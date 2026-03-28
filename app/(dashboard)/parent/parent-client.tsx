'use client'

import { useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { User, FamilyMember } from '@/lib/types'

const MAX_FAMILY_MEMBERS = 4

const SUBJECT_COLORS: Record<string, string> = {
  math: 'bg-blue-500', science: 'bg-green-500', coding: 'bg-purple-500',
  history: 'bg-amber-500', english: 'bg-rose-500', other: 'bg-gray-400',
}

interface MemberStats {
  member: FamilyMember
  profile: { name: string | null; email: string; streak: number; questions_today: number } | null
  totalQuestions: number
  avgScore: number | null
  subjectBreakdown: { subject: string; count: number }[]
  recentActivity: { question_text: string; subject: string; created_at: string }[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  return 'just now'
}

function initials(name: string | null, email: string): string {
  return (name ?? email)
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function MemberCard({ stats }: { stats: MemberStats }) {
  const [expanded, setExpanded] = useState(false)
  const { member, profile, totalQuestions, avgScore, subjectBreakdown, recentActivity } = stats
  const maxSubject = subjectBreakdown[0]?.count ?? 1

  const isPending = member.status === 'pending'
  const displayName = profile?.name ?? profile?.email ?? member.invited_email

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold',
            isPending
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
              : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
          )}>
            {initials(profile?.name ?? null, member.invited_email)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                isPending
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              )}>
                {isPending ? 'Invited' : 'Active'}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{member.invited_email}</p>
          </div>

          {!isPending && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex-shrink-0"
            >
              {expanded ? 'Hide details' : 'View details'}
            </button>
          )}
        </div>

        {!isPending && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Streak', value: `${profile?.streak ?? 0}d`, color: 'text-orange-500' },
              { label: 'Total Qs', value: String(totalQuestions), color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Quiz avg', value: avgScore !== null ? `${avgScore}%` : '—', color: 'text-emerald-600 dark:text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                <p className={cn('text-lg font-bold', color)}>{value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {isPending && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
            Invitation sent · Waiting for {member.invited_email} to create an account.
          </p>
        )}
      </div>

      {expanded && !isPending && (
        <div className="border-t border-gray-100 dark:border-gray-700 p-5 space-y-5">
          {subjectBreakdown.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Subject breakdown
              </p>
              <div className="space-y-2">
                {subjectBreakdown.map((s) => (
                  <div key={s.subject}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize text-gray-700 dark:text-gray-300">{s.subject}</span>
                      <span className="text-gray-400">{s.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', SUBJECT_COLORS[s.subject.toLowerCase()] ?? 'bg-gray-400')}
                        style={{ width: `${(s.count / maxSubject) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentActivity.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                Recent activity
              </p>
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full capitalize flex-shrink-0">
                      {a.subject}
                    </span>
                    <p className="text-xs text-gray-700 dark:text-gray-300 flex-1 truncate">{a.question_text}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(a.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InviteMemberForm({ onInvited }: { onInvited: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/family/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? 'Failed to send invitation.')
        } else {
          setSuccess(true)
          onInvited(email.trim())
          setEmail('')
          setTimeout(() => setSuccess(false), 3000)
        }
      } catch {
        setError('Failed to send invitation. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="family.member@example.com"
        required
        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-lg transition-colors"
      >
        {isPending ? 'Inviting…' : 'Invite'}
      </button>
    </form>
  )
}

export default function ParentClient({
  owner,
  memberStats: initialMemberStats,
}: {
  owner: User
  memberStats: MemberStats[]
}) {
  const [memberStats, setMemberStats] = useState(initialMemberStats)
  const activeCount = memberStats.filter((m) => m.member.status === 'active').length
  const pendingCount = memberStats.filter((m) => m.member.status === 'pending').length
  const canInviteMore = memberStats.length < MAX_FAMILY_MEMBERS

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Family Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {activeCount} active member{activeCount !== 1 ? 's' : ''} · {pendingCount} pending ·
          {' '}{MAX_FAMILY_MEMBERS - memberStats.length} invitation{MAX_FAMILY_MEMBERS - memberStats.length !== 1 ? 's' : ''} remaining
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Members', value: String(activeCount), color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Avg streak', value: `${activeCount > 0 ? Math.round(memberStats.filter(m => m.profile).reduce((s, m) => s + (m.profile?.streak ?? 0), 0) / Math.max(1, activeCount) ) : 0}d`, color: 'text-orange-500' },
          { label: 'Total questions', value: String(memberStats.reduce((s, m) => s + m.totalQuestions, 0)), color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Avg quiz score', value: (() => { const scores = memberStats.filter(m => m.avgScore !== null).map(m => m.avgScore!); return scores.length > 0 ? `${Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}%` : '—' })(), color: 'text-purple-600 dark:text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 text-center">
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {memberStats.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-indigo-500">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No family members yet</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
            Invite up to {MAX_FAMILY_MEMBERS} family members to share your subscription.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {memberStats.map((stats) => (
            <MemberCard key={stats.member.id} stats={stats} />
          ))}
        </div>
      )}

      {canInviteMore && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Invite a family member
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            They'll get full Pro access under your Family plan.
          </p>
          <InviteMemberForm
            onInvited={(email) =>
              setMemberStats((prev) => [
                ...prev,
                {
                  member: {
                    id: crypto.randomUUID(), owner_id: owner.id, member_id: null,
                    invited_email: email, status: 'pending',
                    invited_at: new Date().toISOString(), joined_at: null,
                  },
                  profile: null, totalQuestions: 0, avgScore: null,
                  subjectBreakdown: [], recentActivity: [],
                },
              ])
            }
          />
        </div>
      )}
    </div>
  )
}
