'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { DailyQuestionStat, SubjectStat, CostSummary } from '@/lib/types'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface Props {
  totalQuestions: number
  totalApiCalls: number
  costSummary: CostSummary
  avgScorePct: number | null
  dailyQuestions: DailyQuestionStat[]
  subjectBreakdown: SubjectStat[]
  semanticStats: { hits: number; misses: number; costSavedUsd: number }
  peakHours: { hour: number; count: number }[]
  quizBySubject: { subject: string; avgScore: number; count: number }[]
}

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const SUBJECT_PALETTE: Record<string, string> = {
  math: '#3b82f6',
  science: '#22c55e',
  coding: '#a855f7',
  history: '#f59e0b',
  english: '#f43f5e',
  other: '#6b7280',
}

const FALLBACK_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#ec4899', '#14b8a6', '#84cc16']

function subjectColor(subject: string, idx: number): string {
  return SUBJECT_PALETTE[subject?.toLowerCase()] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatHour(hour: number): string {
  if (hour === 0) return '12a'
  if (hour < 12) return `${hour}a`
  if (hour === 12) return '12p'
  return `${hour - 12}p`
}

function hourIntensity(count: number, max: number): string {
  if (count === 0 || max === 0) return 'bg-gray-100 dark:bg-gray-700/50'
  const ratio = count / max
  if (ratio < 0.25) return 'bg-indigo-100 dark:bg-indigo-900/40'
  if (ratio < 0.5) return 'bg-indigo-300 dark:bg-indigo-700'
  if (ratio < 0.75) return 'bg-indigo-500 dark:bg-indigo-500'
  return 'bg-indigo-700 dark:bg-indigo-400'
}

// ────────────────────────────────────────────────────────────
// Shared card wrapper
// ────────────────────────────────────────────────────────────

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-5', className)}>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Stat card
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accent)}>{icon}</div>
      </div>
      <div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Custom tooltip for charts
// ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, formatter }: {
  active?: boolean
  payload?: { value: number; name?: string; color?: string }[]
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs">
      {label && <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name ? `${p.name}: ` : ''}{formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Empty state
// ────────────────────────────────────────────────────────────

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-center">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2">
        <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
        <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
      </svg>
      <p className="text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

export default function AnalyticsClient({
  totalQuestions,
  totalApiCalls,
  costSummary,
  avgScorePct,
  dailyQuestions,
  subjectBreakdown,
  semanticStats,
  peakHours,
  quizBySubject,
}: Props) {
  const cacheHitRate = useMemo(() => {
    const total = semanticStats.hits + semanticStats.misses
    return total > 0 ? Math.round((semanticStats.hits / total) * 100) : 0
  }, [semanticStats])

  const lineData = useMemo(() => {
    if (dailyQuestions.length === 0) return []
    return dailyQuestions.map((d) => ({
      date: formatShortDate(d.date),
      Questions: d.count,
    }))
  }, [dailyQuestions])

  const pieData = useMemo(
    () => subjectBreakdown.map((s) => ({ name: s.subject, value: s.count })),
    [subjectBreakdown]
  )

  const barData = useMemo(
    () => quizBySubject.map((s) => ({ subject: s.subject, 'Avg Score': s.avgScore })),
    [quizBySubject]
  )

  const peakMax = useMemo(() => Math.max(...peakHours.map((h) => h.count), 1), [peakHours])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          Your study patterns and performance at a glance
        </p>
      </div>

      {/* ── Overview stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total questions"
          value={totalQuestions.toLocaleString()}
          sub="all time"
          accent="bg-indigo-50 dark:bg-indigo-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-indigo-600 dark:text-indigo-400">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          }
        />
        <StatCard
          label="API calls made"
          value={totalApiCalls.toLocaleString()}
          sub={`${costSummary.total_input_tokens.toLocaleString()} tokens total`}
          accent="bg-blue-50 dark:bg-blue-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600 dark:text-blue-400">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          }
        />
        <StatCard
          label="Cost saved"
          value={`$${semanticStats.costSavedUsd.toFixed(4)}`}
          sub={`${semanticStats.hits} cached answers`}
          accent="bg-emerald-50 dark:bg-emerald-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600 dark:text-emerald-400">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          label="Quiz average"
          value={avgScorePct !== null ? `${avgScorePct}%` : '—'}
          sub={avgScorePct !== null ? 'across all quizzes' : 'no quizzes yet'}
          accent="bg-purple-50 dark:bg-purple-900/20"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-purple-600 dark:text-purple-400">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
      </div>

      {/* ── Line chart: questions over time ── */}
      <Card title="Questions over time — last 30 days">
        {lineData.length === 0 ? (
          <EmptyChart message="No questions asked yet" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={lineData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone"
                dataKey="Questions"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* ── Pie + Bar charts side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject distribution pie */}
        <Card title="Subject distribution">
          {pieData.length === 0 ? (
            <EmptyChart message="No questions by subject yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    percent > 0.06 ? `${name} ${Math.round(percent * 100)}%` : ''
                  }
                  labelLine={false}
                >
                  {pieData.map((entry, idx) => (
                    <Cell key={entry.name} fill={subjectColor(entry.name, idx)} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs">
                        <p className="font-semibold capitalize" style={{ color: payload[0].payload.fill }}>
                          {payload[0].name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300">{payload[0].value} questions</p>
                      </div>
                    ) : null
                  }
                />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs capitalize text-gray-600 dark:text-gray-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Quiz scores by subject bar chart */}
        <Card title="Quiz performance by subject">
          {barData.length === 0 ? (
            <EmptyChart message="Complete some quizzes to see scores" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1, 4)}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs">
                        <p className="font-semibold capitalize text-gray-700 dark:text-gray-200 mb-1">{label}</p>
                        <p className="text-indigo-600 dark:text-indigo-400 font-medium">{payload[0].value}% avg score</p>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="Avg Score" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell key={entry.subject} fill={subjectColor(entry.subject, idx)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── Semantic search efficiency ── */}
      <Card title="Semantic search efficiency">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Hit rate visual */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="2.8" className="text-gray-100 dark:text-gray-700" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeDasharray={`${cacheHitRate} ${100 - cacheHitRate}`}
                  className="text-emerald-500 dark:text-emerald-400 transition-all duration-700"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{cacheHitRate}%</span>
                <span className="text-xs text-gray-400">hit rate</span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Cache hits</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{semanticStats.hits}</span>
                <span className="text-xs text-gray-400 ml-1">queries</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Fresh API calls</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{semanticStats.misses}</span>
                <span className="text-xs text-gray-400 ml-1">queries</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Estimated cost saved</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ${semanticStats.costSavedUsd.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 leading-relaxed">
          Semantic search finds similar past answers using vector embeddings. When a match is found above
          the similarity threshold, the cached answer is returned instantly without an API call.
        </p>
      </Card>

      {/* ── Peak study hours heatmap ── */}
      <Card title="Peak study hours">
        {peakHours.every((h) => h.count === 0) ? (
          <EmptyChart message="No activity recorded yet" />
        ) : (
          <>
            <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
              {peakHours.map((h) => (
                <div key={h.hour} className="flex flex-col items-center gap-1">
                  <div
                    title={`${formatHour(h.hour)}: ${h.count} question${h.count !== 1 ? 's' : ''}`}
                    className={cn(
                      'w-full aspect-square rounded-md transition-colors cursor-default',
                      hourIntensity(h.count, peakMax)
                    )}
                  />
                  <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 leading-none">
                    {formatHour(h.hour)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-gray-400 dark:text-gray-500">Less active</span>
              {[0, 0.2, 0.5, 0.8, 1].map((ratio, i) => (
                <div
                  key={i}
                  className={cn('w-3.5 h-3.5 rounded-sm', hourIntensity(ratio * peakMax, peakMax))}
                />
              ))}
              <span className="text-xs text-gray-400 dark:text-gray-500">More active</span>
            </div>

            {/* Peak hour callout */}
            {(() => {
              const peak = peakHours.reduce((a, b) => (b.count > a.count ? b : a))
              if (peak.count === 0) return null
              return (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Your most active hour is{' '}
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {formatHour(peak.hour)}–{formatHour((peak.hour + 1) % 24)}
                  </span>{' '}
                  with {peak.count} question{peak.count !== 1 ? 's' : ''}.
                </p>
              )
            })()}
          </>
        )}
      </Card>
    </div>
  )
}
