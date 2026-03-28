'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { User, Subscription } from '@/lib/types'
import { updateProfile, deleteAccount } from './actions'

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function planLabel(plan: string): string {
  const labels: Record<string, string> = { free: 'Free', pro: 'Pro', family: 'Family' }
  return labels[plan] ?? plan
}

function planBadgeClass(plan: string): string {
  if (plan === 'pro') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
  if (plan === 'family') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

// ────────────────────────────────────────────────────────────
// Section wrapper
// ────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm', className)}>
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Profile section
// ────────────────────────────────────────────────────────────

function ProfileSection({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <Section title="Profile" description="Update your display name and avatar URL">
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name ?? ''}
            placeholder="Your name"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label htmlFor="avatar_url" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Avatar URL <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="avatar_url"
            name="avatar_url"
            type="url"
            defaultValue={user.avatar_url ?? ''}
            placeholder="https://example.com/avatar.jpg"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed.</p>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
            Profile updated successfully.
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </Section>
  )
}

// ────────────────────────────────────────────────────────────
// Subscription section
// ────────────────────────────────────────────────────────────

function SubscriptionSection({
  user,
  subscription,
  questionsThisMonth,
}: {
  user: User
  subscription: Subscription | null
  questionsThisMonth: number
}) {
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  const openPortal = async () => {
    setLoadingPortal(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setPortalError('Could not open billing portal. Please try again.')
      }
    } catch {
      setPortalError('Could not open billing portal. Please try again.')
    } finally {
      setLoadingPortal(false)
    }
  }

  const FREE_DAILY_LIMIT = 5
  const isPro = user.plan !== 'free'

  return (
    <Section title="Subscription" description="Manage your plan and billing">
      <div className="space-y-5">
        {/* Current plan */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current plan</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('text-sm font-semibold px-2.5 py-0.5 rounded-full', planBadgeClass(user.plan))}>
                {planLabel(user.plan)}
              </span>
              {subscription?.status && subscription.status !== 'inactive' && (
                <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                  ({subscription.status})
                </span>
              )}
            </div>
          </div>
          {isPro ? (
            <button
              onClick={openPortal}
              disabled={loadingPortal}
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 disabled:opacity-60 transition-colors"
            >
              {loadingPortal ? 'Opening…' : 'Manage subscription →'}
            </button>
          ) : (
            <Link
              href="/upgrade"
              className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 transition-colors"
            >
              Upgrade to Pro →
            </Link>
          )}
        </div>

        {/* Next billing date */}
        {subscription?.current_period_end && (
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subscription.status === 'canceled' ? 'Access until' : 'Next billing date'}
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(subscription.current_period_end)}
            </p>
          </div>
        )}

        {/* Usage */}
        <div className="py-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Usage this month
          </p>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">Questions today</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.questions_today}
              {!isPro && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1">
                  / {FREE_DAILY_LIMIT} daily limit
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">Total questions asked</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {questionsThisMonth.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">Day streak</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {user.streak} day{user.streak !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Free tier progress bar */}
        {!isPro && (
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Daily usage</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user.questions_today}/{FREE_DAILY_LIMIT}
              </p>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  user.questions_today >= FREE_DAILY_LIMIT
                    ? 'bg-red-500'
                    : user.questions_today >= 4
                    ? 'bg-amber-500'
                    : 'bg-indigo-500'
                )}
                style={{ width: `${Math.min(100, (user.questions_today / FREE_DAILY_LIMIT) * 100)}%` }}
              />
            </div>
            {user.questions_today >= FREE_DAILY_LIMIT && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
                Daily limit reached.{' '}
                <Link href="/upgrade" className="underline font-medium">
                  Upgrade to Pro
                </Link>{' '}
                for unlimited questions.
              </p>
            )}
          </div>
        )}

        {portalError && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
            {portalError}
          </p>
        )}
      </div>
    </Section>
  )
}

// ────────────────────────────────────────────────────────────
// Referral section
// ────────────────────────────────────────────────────────────

function ReferralSection({ user }: { user: User }) {
  const [copied, setCopied] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(user.referral_code ?? null)
  const [loadingCode, setLoadingCode] = useState(false)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://studybuddy.ai'
  const referralLink = referralCode ? `${appUrl}/signup?ref=${referralCode}` : null

  const generateCode = async () => {
    setLoadingCode(true)
    try {
      const res = await fetch('/api/referral', { method: 'GET' })
      const data = await res.json()
      if (data.referral_code) setReferralCode(data.referral_code)
    } finally {
      setLoadingCode(false)
    }
  }

  const copyLink = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Section
      title="Refer a friend"
      description="Share your referral link — you both get 1 week of Pro free when they sign up"
    >
      <div className="space-y-4">
        {referralLink ? (
          <>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-300 font-mono select-all"
              />
              <button
                onClick={copyLink}
                className={cn(
                  'px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap',
                  copied
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                )}
              >
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                When a friend signs up using your link, you both unlock 7 days of Pro — automatically.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Generate your unique referral link to start sharing.
            </p>
            <button
              onClick={generateCode}
              disabled={loadingCode}
              className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {loadingCode ? 'Generating…' : 'Get referral link'}
            </button>
          </div>
        )}
      </div>
    </Section>
  )
}

// ────────────────────────────────────────────────────────────
// Danger zone
// ────────────────────────────────────────────────────────────

function DangerZone() {
  const [confirmText, setConfirmText] = useState('')
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const CONFIRM_PHRASE = 'delete my account'
  const canDelete = confirmText === CONFIRM_PHRASE

  const handleDelete = () => {
    if (!canDelete) return
    startTransition(async () => {
      const result = await deleteAccount()
      if (result?.error) setError(result.error)
    })
  }

  return (
    <Section
      title="Danger zone"
      className="border-red-200 dark:border-red-900/50"
    >
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
        >
          Delete account →
        </button>
      ) : (
        <div className="space-y-4 max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">This action cannot be undone</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
              Deleting your account will permanently remove all your questions, quizzes, notebook
              entries, and analytics data. Your subscription will be canceled immediately.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Type <span className="font-mono font-bold">{CONFIRM_PHRASE}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={!canDelete || isPending}
              className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isPending ? 'Deleting…' : 'Delete my account'}
            </button>
            <button
              onClick={() => { setExpanded(false); setConfirmText('') }}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

interface Props {
  user: User
  subscription: Subscription | null
  totalQuestions: number
}

export default function SettingsClient({ user, subscription, totalQuestions }: Props) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Manage your profile, subscription, and account.
        </p>
      </div>

      <ProfileSection user={user} />
      <SubscriptionSection
        user={user}
        subscription={subscription}
        questionsThisMonth={totalQuestions}
      />
      <ReferralSection user={user} />
      <DangerZone />
    </div>
  )
}
