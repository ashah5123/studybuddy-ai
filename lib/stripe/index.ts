import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Free',
    studySetsLimit: 3,
    flashcardsPerSetLimit: 20,
    aiGenerationsPerMonth: 5,
  },
  pro: {
    name: 'Pro',
    studySetsLimit: Infinity,
    flashcardsPerSetLimit: Infinity,
    aiGenerationsPerMonth: Infinity,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
  },
} as const
