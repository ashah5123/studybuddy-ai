'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { User, Question, SubjectStat, DailyQuestionStat } from '@/lib/types'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface Props {
  user: User
  recentQuestions: Question[]
  subjectBreakdown: SubjectStat[]
  activityDays: DailyQuestionStat[]
  avgScore: number | null
  totalQuestions: number
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const FREE_DAILY_LIMIT = 5

const SUBJECT_COLORS: Record<string, string> = {
  math: 'bg-blue-500',
  science: 'bg-green-500',
  coding: 'bg-purple-500',
  history: 'bg-amber-500',
  english: 'bg-rose-500',
  other: 'bg-gray-500',
}

const SUBJECT_BADGE_COLORS: Record<string, string> = {
  math: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  science: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  coding: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  history: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  english: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMotivation(streak: number): string {
  if (streak >= 30) return "Incredible — 30 days straight. You're unstoppable."
  if (streak >= 14) return "Two-week streak! Keep the momentum going."
  if (streak >= 7) return "One full week of learning. Great consistency!"
  if (streak >= 3) return "Three days in a row — you're building a habit."
  if (streak === 1) return "Welcome back! Learning a little every day adds up."
  return "Ready to learn something new today?"
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  const hours = Math.floor(mins / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

function buildActivityGrid(
  activityDays: DailyQuestionStat[],
  days = 30
): { date: string; count: number }[] {
  const byDate: Record<string, number> = {}
  for (const stat of activityDays) {
    byDate[stat.date] = stat.count
  }

  const result: { date: string; count: number }[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10)
    result.push({ date: dateStr, count: byDate[dateStr] ?? 0 })
  }
  return result
}

function activityColor(count: number): string {
  if (count === 0) return 'bg-gray-100 dark:bg-gray-700/50'
  if (count === 1) return 'bg-emerald-200 dark:bg-emerald-900/50'
  if (count <= 3) return 'bg-emerald-400 dark:bg-emerald-700'
  return 'bg-emerald-600 dark:bg-emerald-500'
}

// ────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent)}>
          {icon}
        </div>
      </div>
      <div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

export default function DashboardClient({
  user,
  recentQuestions,
  subjectBreakdown,
  activityDays,
  avgScore,
  totalQuestions,
}: Props) {
  const greeting = getGreeting()
  const motivation = getMotivation(user.streak ?? 0)
  const activityGrid = useMemo(() => buildActivityGrid(activityDays, 30), [activityDays])
  const isFree = user.plan === 'free'
  const questionsRemaining = Math.max(0, FREE_DAILY_LIMIT - (user.questions_today ?? 0))
  const maxSubjectCount = subjectBreakdown[0]?.count ?? 1

  return (
    <div className="space-y-6">
      {/* ── Welcome header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}, {user.name?.split(' ')[0] ?? 'Student'} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{motivation}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── Upgrade banner (free users) ── */}
      {isFree && (
        <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl px-5 py-4">
          <div className="min-w-0">
            <p className="font-semibold text-sm">
              {questionsRemaining} question{questionsRemaining !== 1 ? 's' : ''} left today
            </p>
            <p className="text-indigo-100 text-xs mt-0.5">
              Upgrade to Pro for unlimited questions, priority support, and more.
            </p>
          </div>
          <Link
            href="/upgrade"
            className="flex-shrink-0 text-xs font-semibold bg-white text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Questions today"
          value={user.questions_today ?? 0}
          sub={isFree ? `of ${FREE_DAILY_LIMIT} daily limit` : 'unlimited plan'}
          accent="bg-blue-50 dark:bg-blue-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600 dark:text-blue-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Day streak"
          value={user.streak ?? 0}
          sub={user.streak ? 'days in a row' : 'ask a question to start'}
          accent="bg-orange-50 dark:bg-orange-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-orange-500 dark:text-orange-400">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
        />
        <StatCard
          label="Total questions"
          value={totalQuestions}
          sub="all time"
          accent="bg-emerald-50 dark:bg-emerald-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600 dark:text-emerald-400">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <StatCard
          label="Quiz average"
          value={avgScore !== null ? `${avgScore}%` : '—'}
          sub={avgScore !== null ? 'across all quizzes' : 'no quizzes yet'}
          accent="bg-purple-50 dark:bg-purple-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-600 dark:text-purple-400">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
      </div>

      {/* ── Activity + Subject breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">30-day activity</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {activityDays.reduce((s, d) => s + d.count, 0)} questions
            </span>
          </div>
          <div className="grid grid-cols-10 gap-1.5">
            {activityGrid.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} question${day.count !== 1 ? 's' : ''}`}
                className={cn('aspect-square rounded-sm', activityColor(day.count))}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="text-xs text-gray-400 dark:text-gray-500">Less</span>
            {[0, 1, 2, 4, 5].map((n) => (
              <div key={n} className={cn('w-3 h-3 rounded-sm', activityColor(n))} />
            ))}
            <span className="text-xs text-gray-400 dark:text-gray-500">More</span>
          </div>
        </div>

        {/* Subject breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Subject breakdown</h2>
          {subjectBreakdown.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2">
                <path d="M12 20h9" strokeLinecap="round" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-gray-400 dark:text-gray-500">No questions yet.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Ask your first question to see your breakdown.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subjectBreakdown.map((stat) => {
                const pct = Math.round((stat.count / maxSubjectCount) * 100)
                const colorClass = SUBJECT_COLORS[stat.subject.toLowerCase()] ?? SUBJECT_COLORS.other
                return (
                  <div key={stat.subject}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize text-gray-700 dark:text-gray-300 font-medium">
                        {stat.subject}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {stat.count} q{stat.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', colorClass)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent questions ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent questions</h2>
          <Link
            href="/ask"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Ask new →
          </Link>
        </div>

        {recentQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No questions yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">
              Ask your first question to get started.
            </p>
            <Link
              href="/ask"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Ask a question
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentQuestions.map((q) => {
              const badgeClass = SUBJECT_BADGE_COLORS[q.subject?.toLowerCase() ?? ''] ?? SUBJECT_BADGE_COLORS.other
              return (
                <div key={q.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  {q.subject && (
                    <span className={cn('mt-0.5 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full capitalize', badgeClass)}>
                      {q.subject}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 dark:text-gray-200 truncate font-medium">
                      {q.question_text}
                    </p>
                    {q.ai_response && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                        {q.ai_response.slice(0, 120)}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5">
                    {timeAgo(q.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/ask"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-indigo-600 dark:text-indigo-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Ask a question</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Get an instant answer</p>
            </div>
          </Link>

          <Link
            href="/notebook"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-600 dark:text-emerald-400">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Open notebook</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Review your saved notes</p>
            </div>
          </Link>

          <Link
            href="/analytics"
            className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-purple-600 dark:text-purple-400">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">View analytics</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Track your progress</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
