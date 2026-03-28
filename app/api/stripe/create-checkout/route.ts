import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PLANS, getOrCreateStripeCustomer } from '@/lib/stripe'
import { getSubscription } from '@/lib/supabase'
import type { TypedSupabaseClient } from '@/lib/supabase'
import type { StripePlan } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as { plan: StripePlan }
  const { plan } = body

  if (!plan || !PLANS[plan]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const typedDb = supabase as unknown as TypedSupabaseClient
  const existingSub = await getSubscription(typedDb, user.id)

  const customerId = await getOrCreateStripeCustomer(
    user.email!,
    user.id,
    existingSub?.stripe_customer_id
  )

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/upgrade`,
    metadata: {
      user_id: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        plan,
      },
    },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
