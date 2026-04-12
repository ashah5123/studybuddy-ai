import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const courseId = formData.get('courseId') as string | null

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Only PDF files are supported.' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large. Max size is 50 MB.' }, { status: 400 })
  }

  const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
  const filePath = `${user.id}/${Date.now()}-${safeName}`

  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(filePath, bytes, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return NextResponse.json(
      { error: `Storage upload failed: ${uploadError.message}` },
      { status: 500 }
    )
  }

  const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(filePath)

  const { data: doc, error: dbError } = await supabase
    .from('pdf_documents')
    .insert({
      user_id: user.id,
      course_id: courseId || null,
      name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
    })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  return NextResponse.json({ document: doc })
}
