import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractTextFromFile } from '@/lib/files/extractText'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'docx', 'md', 'markdown'])

function hasSuspiciousContent(text: string): boolean {
  const probe = text.slice(0, 5000).toLowerCase()
  const risky = ['<script', 'powershell', 'cmd.exe', 'eval(', 'document.cookie']
  return risky.some((token) => probe.includes(token))
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required (form field: file)' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large. Max size is 10MB.' }, { status: 400 })
  }

  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: 'Unsupported file type. Use PDF, TXT, DOCX, or MD.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  let extracted
  try {
    extracted = await extractTextFromFile(file.name, file.type, bytes)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not extract text from file.' },
      { status: 400 }
    )
  }

  if (hasSuspiciousContent(extracted.text)) {
    return NextResponse.json(
      { error: 'Upload blocked due to potentially unsafe content.' },
      { status: 400 }
    )
  }

  const filePath = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
  const { error: uploadError } = await supabase.storage
    .from('note-uploads')
    .upload(filePath, bytes, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (uploadError) {
    return NextResponse.json(
      { error: `Failed to upload file to storage: ${uploadError.message}` },
      { status: 500 }
    )
  }

  const { data: urlData } = supabase.storage.from('note-uploads').getPublicUrl(filePath)

  return NextResponse.json({
    fileName: file.name,
    filePath,
    fileUrl: urlData.publicUrl,
    text: extracted.text,
    truncated: extracted.truncated,
    chunks: extracted.chunks,
  })
}

