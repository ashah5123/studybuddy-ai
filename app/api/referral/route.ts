import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TypedSupabaseClient } from '@/lib/supabase'

function generateReferralCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// GET /api/referral — get or generate the current user's referral code
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const typedDb = supabase as unknown as TypedSupabaseClient

  const { data: profile } = await typedDb
    .from('users')
    .select('referral_code')
    .eq('id', user.id)
    .single()

  if (profile?.referral_code) {
    return NextResponse.json({ code: profile.referral_code })
  }

  let code = generateReferralCode()
  let attempts = 0
  while (attempts < 5) {
    const { error } = await typedDb
      .from('users')
      .update({ referral_code: code } as any)
      .eq('id', user.id)

    if (!error) break
    code = generateReferralCode()
    attempts++
  }

  return NextResponse.json({ code })
}

// POST /api/referral/claim — called when a new user signs up with a referral code
export async function POST(request: NextRequest) {
  const body = await request.json() as { code: string; newUserId: string }
  const { code, newUserId } = body

  if (!code || !newUserId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: referrer } = await admin
    .from('users')
    .select('id, email, referral_pro_expires_at')
    .eq('referral_code', code)
    .single()

  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 })
  }

  if (referrer.id === newUserId) {
    return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
  }

  const { data: existingReferral } = await admin
    .from('referrals')
    .select('id')
    .eq('referrer_id', referrer.id)
    .eq('referred_user_id', newUserId)
    .maybeSingle()

  if (existingReferral) {
    return NextResponse.json({ ok: true, alreadyClaimed: true })
  }

  const proUntil = new Date()
  proUntil.setDate(proUntil.getDate() + 7)
  const proUntilIso = proUntil.toISOString()

  const referrerProUntil =
    referrer.referral_pro_expires_at && new Date(referrer.referral_pro_expires_at) > new Date()
      ? new Date(Math.max(new Date(referrer.referral_pro_expires_at).getTime(), proUntil.getTime())).toISOString()
      : proUntilIso

  await Promise.all([
    admin.from('referrals').insert({
      referrer_id: referrer.id,
      referred_user_id: newUserId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }),
    admin.from('users').update({ referral_pro_expires_at: referrerProUntil }).eq('id', referrer.id),
    admin.from('users').update({ referral_pro_expires_at: proUntilIso }).eq('id', newUserId),
  ])

  return NextResponse.json({ ok: true })
}
