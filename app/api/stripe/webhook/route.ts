import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const userId = session.metadata?.user_id
      const plan = session.metadata?.plan as 'pro' | 'family' | undefined
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

      if (!userId || !plan || !customerId || !subscriptionId) break

      const sub = await stripe.subscriptions.retrieve(subscriptionId)

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'stripe_customer_id' }
      )

      await supabase.from('users').update({ plan }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      const plan = (sub.metadata?.plan ?? 'free') as 'free' | 'pro' | 'family'
      const isActive = sub.status === 'active' || sub.status === 'trialing'
      const effectivePlan = isActive ? plan : 'free'
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          plan: effectivePlan,
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'stripe_customer_id' }
      )

      await supabase.from('users').update({ plan: effectivePlan }).eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

      await supabase.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          plan: 'free',
          status: 'canceled',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'stripe_customer_id' }
      )

      await supabase.from('users').update({ plan: 'free' }).eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
