import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamAnswer } from '@/lib/gemini'
import { getCachedAnswer, saveQuestionEmbedding } from '@/lib/semantic-search'
import { createQuestion, countQuestionsToday } from '@/lib/supabase'
import {
  trackQuestionAsked,
  trackSemanticSearch,
  trackEmbeddingGenerated,
} from '@/lib/analytics'
import type { Subject, Plan } from '@/lib/types'
import type { TypedSupabaseClient } from '@/lib/supabase'

const FREE_DAILY_LIMIT = 5

export async function POST(request: NextRequest) {
  const supabase = (await createClient()) as unknown as TypedSupabaseClient

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as {
    question: string
    subject: Subject
    imageBase64?: string
    mimeType?: string
    sessionId: string
  }

  const { question, subject, imageBase64, mimeType, sessionId } = body

  if (!question?.trim() || !subject) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const plan = profile.plan as Plan

  if (plan === 'free') {
    const todayCount = await countQuestionsToday(supabase, user.id)
    if (todayCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'quota_exceeded', questionsToday: todayCount },
        { status: 429 }
      )
    }
  }

  // Semantic cache check
  try {
    const cached = await getCachedAnswer(supabase, { userId: user.id, queryText: question })
    if (cached) {
      await trackSemanticSearch(supabase, { userId: user.id, plan, hitFound: true })

      const saved = await createQuestion(supabase, {
        user_id: user.id,
        subject,
        question_text: question,
        has_image: false,
        image_url: null,
        ai_response: cached.answer,
      })

      await supabase
        .from('users')
        .update({ questions_today: profile.questions_today + 1, last_active: new Date().toISOString() })
        .eq('id', user.id)

      return NextResponse.json({
        cached: true,
        answer: cached.answer,
        similarity: cached.similarity,
        questionId: saved.id,
      })
    }
    await trackSemanticSearch(supabase, { userId: user.id, plan, hitFound: false })
  } catch {
    // Cache check failure is non-fatal — continue to fresh answer
  }

  // Stream the answer
  const encoder = new TextEncoder()
  let fullAnswer = ''

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      try {
        const geminiStream = await streamAnswer(question, subject, imageBase64, mimeType)

        for await (const chunk of geminiStream.stream) {
          const text = chunk.text()
          if (text) {
            fullAnswer += text
            send({ type: 'chunk', text })
          }
        }

        const finalResponse = await geminiStream.response
        const usage = finalResponse.usageMetadata
        const inputTokens = usage?.promptTokenCount ?? Math.ceil(question.length / 4)
        const outputTokens = usage?.candidatesTokenCount ?? Math.ceil(fullAnswer.length / 4)
        const estimatedCostUsd =
          (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.3

        const saved = await createQuestion(supabase, {
          user_id: user.id,
          subject,
          question_text: question,
          has_image: !!(imageBase64 && mimeType),
          image_url: null,
          ai_response: fullAnswer,
        })

        await supabase
          .from('users')
          .update({
            questions_today: profile.questions_today + 1,
            last_active: new Date().toISOString(),
          })
          .eq('id', user.id)

        await trackQuestionAsked(supabase, {
          userId: user.id,
          subject,
          plan,
          sessionId,
          inputTokens,
          outputTokens,
          estimatedCostUsd,
        })

        send({ type: 'done', questionId: saved.id })

        try {
          await saveQuestionEmbedding(supabase, {
            questionId: saved.id,
            userId: user.id,
            questionText: question,
          })
          await trackEmbeddingGenerated(supabase, { userId: user.id, plan })
        } catch {
          // Embedding failure is non-fatal
        }
      } catch (err) {
        send({ type: 'error', message: 'Failed to generate answer. Please try again.' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
