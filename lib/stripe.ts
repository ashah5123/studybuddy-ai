import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export const PLANS = {
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    amount: 900,
    label: '$9/mo',
    interval: 'month',
  },
  family: {
    name: 'Family',
    priceId: process.env.STRIPE_FAMILY_PRICE_ID!,
    amount: 1900,
    label: '$19/mo',
    interval: 'month',
  },
} as const

export type StripePlan = keyof typeof PLANS

export async function getOrCreateStripeCustomer(
  email: string,
  userId: string,
  existingCustomerId?: string | null
): Promise<string> {
  if (existingCustomerId) {
    return existingCustomerId
  }
  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })
  return customer.id
}
