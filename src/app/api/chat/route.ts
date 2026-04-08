import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'
import { buildUserContext } from '@/lib/ai/buildContext'
import { consumeAIQuestion, getRateLimitState } from '@/lib/ai/rateLimit'

const PRIMARY_MODEL = 'llama-3.1-70b-versatile'
const FALLBACK_MODEL = 'llama-3.3-70b-versatile'

type ChatPostBody = {
  question?: string
  courseId?: string
  conversationId?: string
  subject?: string
  stream?: boolean
  // legacy payload support
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>
}

function sseData(data: Record<string, unknown>) {
  return `data: ${JSON.stringify(data)}\n\n`
}

function makeTitle(question: string) {
  const q = question.trim().replace(/\s+/g, ' ')
  if (!q) return 'New conversation'
  return q.length > 80 ? `${q.slice(0, 77)}...` : q
}

function extractFollowUps(question: string, subject?: string): string[] {
  const focus = subject?.trim() || 'this topic'
  return [
    `Can you explain that in simpler words for ${focus}?`,
    `Give me 3 practice questions about this.`,
    `What common mistakes should I avoid here?`,
  ]
}

async function resolveConversation(
  userId: string,
  conversationId: string | undefined,
  subject: string | undefined,
  question: string
): Promise<{ id: string; subject: string | null }> {
  const supabase = await createClient()
  if (conversationId) {
    const { data } = await supabase
      .from('conversations')
      .select('id, subject')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()
    if (data?.id) return { id: data.id, subject: data.subject ?? null }
  }

  const { data: created, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: makeTitle(question),
      subject: subject?.trim() || null,
    })
    .select('id, subject')
    .single()

  if (error || !created) throw new Error(error?.message ?? 'Unable to create conversation')
  return { id: created.id, subject: created.subject ?? null }
}

async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const supabase = await createClient()
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
  })
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
}

async function handleLegacy(messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'AI is not configured. Set GROQ_API_KEY in your environment (e.g. `.env.local`).',
      },
      { status: 503 }
    )
  }
  const client = new Groq({ apiKey })
  const completion = await client.chat.completions.create({
    model: FALLBACK_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are StudyBuddy, a concise and encouraging tutor for students. Give accurate, clear explanations.',
      },
      ...messages,
    ],
    max_tokens: 1024,
  })

  return NextResponse.json({ message: completion.choices[0]?.message?.content ?? '' })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')

  if (conversationId) {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()
    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ conversation, messages: messages ?? [] })
  }

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ conversations: conversations ?? [] })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ error: 'conversationId is required' }, { status: 400 })

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI is not configured. Set GROQ_API_KEY in your environment.' },
      { status: 503 }
    )
  }

  let body: ChatPostBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (Array.isArray(body.messages) && !body.question) {
    return handleLegacy(body.messages)
  }

  const question = body.question?.trim()
  if (!question) return NextResponse.json({ error: 'Question is required' }, { status: 400 })

  const quota = await getRateLimitState(user.id)
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: 'Daily AI limit reached for free tier.',
        remaining: 0,
        limit: quota.limit,
      },
      { status: 429 }
    )
  }

  const courseName = body.courseId
    ? (
        await supabase
          .from('courses')
          .select('name')
          .eq('id', body.courseId)
          .eq('user_id', user.id)
          .single()
      ).data?.name ?? null
    : null

  const contextPrompt = await buildUserContext(user.id, body.subject ?? courseName ?? undefined)
  const resolvedConversation = await resolveConversation(
    user.id,
    body.conversationId,
    body.subject ?? courseName ?? undefined,
    question
  )

  await saveMessage(resolvedConversation.id, 'user', question)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let full = ''
      const push = (payload: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sseData(payload)))

      try {
        push({
          type: 'meta',
          conversationId: resolvedConversation.id,
          remaining: quota.remaining,
          limit: quota.limit,
        })

        const client = new Groq({ apiKey })
        const model = process.env.GROQ_MODEL ?? PRIMARY_MODEL
        const messages = [
          {
            role: 'system' as const,
            content: [
              'You are StudyBuddy AI, an expert homework helper.',
              contextPrompt,
              courseName ? `Current selected course: ${courseName}.` : '',
              'Use this context naturally. If context is sparse, ask a brief clarification question.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
          { role: 'user' as const, content: question },
        ]

        let completion: Awaited<ReturnType<Groq['chat']['completions']['create']>>
        try {
          completion = await client.chat.completions.create({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 900,
            stream: true,
          })
        } catch {
          completion = await client.chat.completions.create({
            model: FALLBACK_MODEL,
            messages,
            temperature: 0.3,
            max_tokens: 900,
            stream: true,
          })
        }

        for await (const part of completion as AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>) {
          const text = part.choices?.[0]?.delta?.content ?? ''
          if (!text) continue
          full += text
          push({ type: 'chunk', text })
        }

        const postQuota = await consumeAIQuestion(user.id)
        await saveMessage(resolvedConversation.id, 'assistant', full)
        push({
          type: 'done',
          message: full,
          followUps: extractFollowUps(question, body.subject ?? courseName ?? undefined),
          remaining: postQuota.remaining,
          limit: postQuota.limit,
        })
      } catch (e) {
        console.error('[api/chat stream]', e)
        push({ type: 'error', error: 'The AI service failed to respond. Please try again.' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
