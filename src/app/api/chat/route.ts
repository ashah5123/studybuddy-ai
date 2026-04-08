import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
} from 'groq-sdk/resources/chat/completions'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_TEXT_MODEL = 'llama-3.3-70b-versatile'
const DEFAULT_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

/** Groq Llama 4 Scout: max 5 images per request across all turns we send. */
const MAX_IMAGES_PER_REQUEST = 5
const MAX_IMAGES_PER_MESSAGE = 5
/** ~4 MiB decoded per image to keep requests server-friendly */
const MAX_BYTES_PER_IMAGE = 4 * 1024 * 1024

const DATA_IMAGE_PREFIX_RE = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i

type ClientUserMessage = {
  role: 'user'
  content: string
  images?: string[]
}

type ClientAssistantMessage = { role: 'assistant'; content: string }

type ClientMessage = ClientUserMessage | ClientAssistantMessage

function decodedBase64BytesFromDataUrl(dataUrl: string): number {
  const i = dataUrl.indexOf(',')
  if (i === -1) return Number.POSITIVE_INFINITY
  const b64 = dataUrl.slice(i + 1).replace(/\s/g, '')
  return Math.floor((b64.length * 3) / 4)
}

function isValidDataImageUrl(url: string): boolean {
  if (!DATA_IMAGE_PREFIX_RE.test(url) || url.length > 25 * 1024 * 1024) return false
  return decodedBase64BytesFromDataUrl(url) <= MAX_BYTES_PER_IMAGE
}

function toGroqMessages(validated: ClientMessage[]): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = []
  for (const m of validated) {
    if (m.role === 'assistant') {
      out.push({ role: 'assistant', content: m.content })
      continue
    }
    const imgs = m.images?.filter(Boolean) ?? []
    if (imgs.length === 0) {
      out.push({ role: 'user', content: m.content })
      continue
    }
    const text =
      m.content.trim() ||
      'Answer based on the image(s). If the user only attached images, describe what you see and help with any implied study question.'
    const parts: ChatCompletionContentPart[] = [
      { type: 'text', text },
      ...imgs.map(
        (url): ChatCompletionContentPart => ({
          type: 'image_url',
          image_url: { url, detail: 'auto' },
        })
      ),
    ]
    out.push({ role: 'user', content: parts })
  }
  return out
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  let body: { messages?: unknown[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const raw = body.messages
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: 'Expected a non-empty messages array' }, { status: 400 })
  }

  const messages: ClientMessage[] = []
  let totalImages = 0

  for (const m of raw) {
    if (!m || typeof m !== 'object') {
      return NextResponse.json({ error: 'Invalid message shape' }, { status: 400 })
    }
    const role = (m as { role?: unknown }).role
    if (role !== 'user' && role !== 'assistant') {
      return NextResponse.json({ error: 'Invalid message role' }, { status: 400 })
    }

    if (role === 'assistant') {
      const content = (m as { content?: unknown }).content
      if (typeof content !== 'string') {
        return NextResponse.json({ error: 'Invalid assistant message' }, { status: 400 })
      }
      if (content.length > 12_000) {
        return NextResponse.json({ error: 'Message too long' }, { status: 400 })
      }
      if ('images' in m && (m as { images?: unknown }).images != null) {
        return NextResponse.json({ error: 'Assistant messages cannot include images' }, { status: 400 })
      }
      messages.push({ role: 'assistant', content })
      continue
    }

    const content = (m as { content?: unknown }).content
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Invalid user message content' }, { status: 400 })
    }
    if (content.length > 12_000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const imagesRaw = (m as { images?: unknown }).images
    let images: string[] | undefined
    if (imagesRaw !== undefined) {
      if (!Array.isArray(imagesRaw)) {
        return NextResponse.json({ error: 'images must be an array of data URLs' }, { status: 400 })
      }
      if (imagesRaw.length > MAX_IMAGES_PER_MESSAGE) {
        return NextResponse.json(
          { error: `At most ${MAX_IMAGES_PER_MESSAGE} images per message` },
          { status: 400 }
        )
      }
      for (const url of imagesRaw) {
        if (typeof url !== 'string' || !isValidDataImageUrl(url)) {
          return NextResponse.json(
            {
              error:
                'Each image must be a base64 data URL (jpeg, png, gif, or webp) under the size limit.',
            },
            { status: 400 }
          )
        }
      }
      images = imagesRaw
      totalImages += images.length
    }

    if (!content.trim() && (!images || images.length === 0)) {
      return NextResponse.json(
        { error: 'User messages need text and/or at least one image' },
        { status: 400 }
      )
    }

    messages.push(images?.length ? { role: 'user', content, images } : { role: 'user', content })
  }

  if (totalImages > MAX_IMAGES_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `This chat request includes too many images (max ${MAX_IMAGES_PER_REQUEST} per request). Remove older images from the thread or start a new chat.`,
      },
      { status: 400 }
    )
  }

  const needsVision = messages.some(
    (m) => m.role === 'user' && Array.isArray(m.images) && m.images.length > 0
  )
  const model = needsVision
    ? (process.env.GROQ_VISION_MODEL ?? DEFAULT_VISION_MODEL)
    : (process.env.GROQ_MODEL ?? DEFAULT_TEXT_MODEL)

  const client = new Groq({ apiKey })

  try {
    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are StudyBuddy, a concise and encouraging tutor for students. Give accurate, clear explanations. Use short sections or bullet points when it helps readability. When the user shares images, answer their question using what is visible (diagrams, equations, screenshots, handwriting, etc.).',
        },
        ...toGroqMessages(messages),
      ],
      max_tokens: 1024,
    })
    const text = completion.choices[0]?.message?.content ?? ''
    return NextResponse.json({ message: text })
  } catch (e) {
    console.error('[api/chat]', e)
    return NextResponse.json(
      { error: 'The AI service failed to respond. Try again in a moment.' },
      { status: 500 }
    )
  }
}
