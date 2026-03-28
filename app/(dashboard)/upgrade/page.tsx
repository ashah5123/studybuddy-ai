'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

// ────────────────────────────────────────────────────────────
// Plan data
// ────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out StudyBuddy',
    color: 'gray',
    features: [
      { text: '5 questions per day', included: true },
      { text: 'All 6 subjects', included: true },
      { text: 'Quiz generation', included: true },
      { text: 'Notebook (last 20 entries)', included: true },
      { text: 'Semantic search cache', included: true },
      { text: 'Unlimited questions', included: false },
      { text: 'Full analytics dashboard', included: false },
      { text: 'Image question uploads', included: false },
      { text: 'Priority answers', included: false },
      { text: 'Family sharing (up to 5)', included: false },
    ],
    cta: 'Current plan',
    ctaAction: null,
    popular: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For students who want to learn faster',
    color: 'indigo',
    features: [
      { text: 'Unlimited questions', included: true },
      { text: 'All 6 subjects', included: true },
      { text: 'Quiz generation', included: true },
      { text: 'Unlimited notebook entries', included: true },
      { text: 'Semantic search cache', included: true },
      { text: 'Full analytics dashboard', included: true },
      { text: 'Image question uploads', included: true },
      { text: 'Priority answers', included: true },
      { text: 'Family sharing (up to 5)', included: false },
      { text: 'Cancel anytime', included: true },
    ],
    cta: 'Get Pro',
    ctaAction: 'pro',
    popular: true,
  },
  {
    id: 'family' as const,
    name: 'Family',
    price: '$19',
    period: '/month',
    description: 'For households with multiple learners',
    color: 'purple',
    features: [
      { text: 'Unlimited questions', included: true },
      { text: 'All 6 subjects', included: true },
      { text: 'Quiz generation', included: true },
      { text: 'Unlimited notebook entries', included: true },
      { text: 'Semantic search cache', included: true },
      { text: 'Full analytics dashboard', included: true },
      { text: 'Image question uploads', included: true },
      { text: 'Priority answers', included: true },
      { text: 'Family sharing (up to 5 accounts)', included: true },
      { text: 'Cancel anytime', included: true },
    ],
    cta: 'Get Family',
    ctaAction: 'family',
    popular: false,
  },
]

const COLOR_STYLES: Record<string, {
  badge: string
  ring: string
  cta: string
  check: string
}> = {
  gray: {
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    ring: 'border-gray-200 dark:border-gray-700',
    cta: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 cursor-default',
    check: 'text-gray-400 dark:text-gray-500',
  },
  indigo: {
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    ring: 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20',
    cta: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    check: 'text-indigo-600 dark:text-indigo-400',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    ring: 'border-purple-300 dark:border-purple-700',
    cta: 'bg-purple-600 hover:bg-purple-700 text-white',
    check: 'text-purple-600 dark:text-purple-400',
  },
}

// ────────────────────────────────────────────────────────────
// Checkout button
// ────────────────────────────────────────────────────────────

function CheckoutButton({
  planId,
  label,
  colorClass,
  disabled,
}: {
  planId: 'pro' | 'family' | null
  label: string
  colorClass: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!planId || disabled) {
    return (
      <button disabled className={cn('w-full py-2.5 text-sm font-semibold rounded-xl transition-colors', colorClass)}>
        {label}
      </button>
    )
  }

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Could not start checkout. Please try again.')
      }
    } catch {
      setError('Could not start checkout. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={cn(
          'w-full py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed',
          colorClass
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting…
          </span>
        ) : label}
      </button>
      {error && <p className="text-xs text-red-500 mt-1.5 text-center">{error}</p>}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function UpgradePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Choose your plan</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Start free, upgrade when you need more. Cancel anytime.
        </p>

        {/* Money-back guarantee badge */}
        <div className="inline-flex items-center gap-2 mt-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          7-day money-back guarantee — no questions asked
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const styles = COLOR_STYLES[plan.color]
          return (
            <div
              key={plan.id}
              className={cn(
                'relative bg-white dark:bg-gray-800 rounded-2xl border shadow-sm flex flex-col p-6',
                styles.ring
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Most popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-5">
                <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', styles.badge)}>
                  {plan.name}
                </span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{plan.description}</p>
              </div>

              {/* Features list */}
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={cn('w-4 h-4 flex-shrink-0 mt-0.5', styles.check)}>
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-300 dark:text-gray-600">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                    <span className={cn('text-sm', feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through')}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <CheckoutButton
                planId={plan.ctaAction as 'pro' | 'family' | null}
                label={plan.cta}
                colorClass={styles.cta}
                disabled={!plan.ctaAction}
              />
            </div>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white text-center mb-4">
          Frequently asked questions
        </h2>
        {[
          {
            q: 'Can I cancel anytime?',
            a: 'Yes. Cancel from your settings page at any time. You keep Pro access until the end of your billing period.',
          },
          {
            q: 'What counts as a "question"?',
            a: 'Each time you submit a question to get an explanation. Retrying with the same question also counts.',
          },
          {
            q: 'How does family sharing work?',
            a: 'With the Family plan you can invite up to 4 additional members (5 total) to share your subscription.',
          },
          {
            q: 'Is there a student discount?',
            a: 'Email us at support@studybuddy.ai with your student email for a 30% discount.',
          },
        ].map((item) => (
          <details key={item.q} className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
              <span className="text-sm font-medium text-gray-900 dark:text-white">{item.q}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </summary>
            <div className="px-5 pb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.a}</p>
            </div>
          </details>
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-6 pt-2 text-xs text-gray-400 dark:text-gray-500">
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Secure payment via Stripe
        </span>
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          7-day money-back guarantee
        </span>
        <span className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Cancel anytime, no hassle
        </span>
      </div>
    </div>
  )
}
