import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET  /api/pdf-annotations?documentId=xxx  → list all annotations for a document
// POST /api/pdf-annotations                 → create annotation
// PUT  /api/pdf-annotations?id=xxx          → update note / ai_explanation
// DELETE /api/pdf-annotations?id=xxx        → delete annotation

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('documentId')
  if (!documentId) return NextResponse.json({ error: 'documentId is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('pdf_annotations')
    .select('*')
    .eq('document_id', documentId)
    .eq('user_id', user.id)
    .order('page_number', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ annotations: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { documentId, pageNumber, selectedText, note, color, positionData } = body

  if (!documentId || !pageNumber || !selectedText) {
    return NextResponse.json(
      { error: 'documentId, pageNumber, and selectedText are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('pdf_annotations')
    .insert({
      document_id: documentId,
      user_id: user.id,
      page_number: pageNumber,
      selected_text: selectedText,
      note: note || null,
      color: color || 'yellow',
      position_data: positionData ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ annotation: data })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if ('note' in body) updates.note = body.note
  if ('ai_explanation' in body) updates.ai_explanation = body.ai_explanation
  if ('color' in body) updates.color = body.color

  const { data, error } = await supabase
    .from('pdf_annotations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ annotation: data })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase
    .from('pdf_annotations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
