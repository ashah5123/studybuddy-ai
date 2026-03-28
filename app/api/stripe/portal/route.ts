import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe'
import { getSubscription } from '@/lib/supabase'
import type { TypedSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const typedDb = supabase as unknown as TypedSupabaseClient
  const existingSub = await getSubscription(typedDb, user.id)

  const customerId = await getOrCreateStripeCustomer(
    user.email!,
    user.id,
    existingSub?.stripe_customer_id
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
