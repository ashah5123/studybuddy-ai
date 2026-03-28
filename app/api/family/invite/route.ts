import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { TypedSupabaseClient } from '@/lib/supabase'

const MAX_FAMILY_MEMBERS = 4

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const typedDb = supabase as unknown as TypedSupabaseClient

  const { data: profile } = await typedDb.from('users').select('plan').eq('id', user.id).single()
  if (profile?.plan !== 'family') {
    return NextResponse.json({ error: 'Family plan required' }, { status: 403 })
  }

  const body = await request.json() as { email: string }
  const email = body.email?.trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const { count } = await (supabase as any)
    .from('family_members')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .neq('status', 'removed')

  if ((count ?? 0) >= MAX_FAMILY_MEMBERS) {
    return NextResponse.json({ error: `Family plan allows up to ${MAX_FAMILY_MEMBERS} members` }, { status: 400 })
  }

  const { data: existingUser } = await typedDb
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  const { error: insertError } = await (supabase as any)
    .from('family_members')
    .insert({
      owner_id: user.id,
      member_id: existingUser?.id ?? null,
      invited_email: email,
      status: existingUser ? 'active' : 'pending',
      joined_at: existingUser ? new Date().toISOString() : null,
    })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
