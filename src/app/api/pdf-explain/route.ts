import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { createClient } from '@/lib/supabase/server'

const MODEL = 'llama-3.3-70b-versatile'

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

  const body = await request.json()
  const { selectedText, annotationId, documentName } = body

  if (!selectedText?.trim()) {
    return NextResponse.json({ error: 'selectedText is required' }, { status: 400 })
  }

  const client = new Groq({ apiKey })

  const prompt = [
    'You are StudyBuddy AI, an expert academic tutor.',
    documentName ? `The student is reading: "${documentName}".` : '',
    '',
    'The student highlighted the following text from their PDF textbook:',
    `"""`,
    selectedText.trim(),
    `"""`,
    '',
    'Explain this concept clearly and concisely. Cover:',
    '1. What it means in plain language',
    '2. Why it matters or how it is used',
    '3. A simple example if helpful',
    '',
    'Keep the response focused and under 250 words.',
  ]
    .filter((l) => l !== null)
    .join('\n')

  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 400,
  })

  const explanation = completion.choices[0]?.message?.content ?? ''

  // Persist explanation to the annotation record if annotationId provided
  if (annotationId) {
    await supabase
      .from('pdf_annotations')
      .update({ ai_explanation: explanation })
      .eq('id', annotationId)
      .eq('user_id', user.id)
  }

  return NextResponse.json({ explanation })
}
