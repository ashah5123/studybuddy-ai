import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured.' }, { status: 500 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const audio = formData.get('audio')
  if (!audio || !(audio instanceof Blob)) {
    return NextResponse.json({ error: 'No audio file provided.' }, { status: 400 })
  }

  // Forward to Groq Whisper
  const groqForm = new FormData()
  groqForm.append('file', audio, 'audio.webm')
  groqForm.append('model', 'whisper-large-v3-turbo')
  groqForm.append('language', 'en')
  groqForm.append('response_format', 'json')

  const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: groqForm,
  })

  if (!groqRes.ok) {
    const text = await groqRes.text()
    return NextResponse.json(
      { error: `Transcription failed: ${text}` },
      { status: groqRes.status }
    )
  }

  const data = (await groqRes.json()) as { text?: string }
  return NextResponse.json({ text: data.text ?? '' })
}
