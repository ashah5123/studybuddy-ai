import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  StickyNote,
  Zap,
  TrendingUp,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  getUserStats,
  getUpcomingAssignments,
  getRecentStudySessions,
} from '@/lib/supabase/queries'
import type { Profile } from '@/types/database.types'

const PRIORITY_CLASSES = {
  high:   'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
  medium: 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20',
  low:    'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
}

const PRIORITY_DOT = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-emerald-400',
}

function relativeDate(iso: string | null): { text: string; urgent: boolean } {
  if (!iso) return { text: 'No due date', urgent: false }
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, urgent: true }
  if (diff === 0) return { text: 'Due today', urgent: true }
  if (diff === 1) return { text: 'Tomorrow', urgent: true }
  if (diff <= 3)  return { text: `In ${diff} days`, urgent: true }
  return { text: `In ${diff} days`, urgent: false }
}

interface StatCardProps {
  label: string
  value: number | string
  icon: React.ElementType
  gradient: string
  iconBg: string
  iconColor: string
  sub?: string
}

function StatCard({ label, value, icon: Icon, gradient, iconBg, iconColor, sub }: StatCardProps) {
  return (
    <div className={`sb-panel relative overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--sb-shadow-lg)]`}>
      {/* Gradient blob */}
      <div className={`pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl opacity-20 ${gradient}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[var(--sb-muted)]">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-[var(--foreground)]">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-[var(--sb-muted)]">{sub}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </span>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const [stats, upcoming, sessions] = await Promise.all([
    getUserStats(user.id),
    getUpcomingAssignments(user.id, 7),
    getRecentStudySessions(user.id, 5),
  ])

  const firstName = (profile as Pick<Profile, 'full_name'> | null)?.full_name?.split(' ')[0] ?? 'there'
  const studyHours = (stats.studyMinutesThisWeek / 60).toFixed(1)
  const overdueCount = upcoming.filter(a => a.due_date && new Date(a.due_date).getTime() < Date.now()).length

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="sb-panel relative overflow-hidden px-6 py-7">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-600/8 via-violet-600/5 to-transparent" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-indigo-500/8 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--sb-muted)]">
              {getTimeOfDay()} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Hey, {firstName} 👋
            </h1>
            <p className="mt-1.5 text-sm text-[var(--sb-muted)]">
              {overdueCount > 0
                ? `You have ${overdueCount} overdue assignment${overdueCount > 1 ? 's' : ''} — let's get caught up.`
                : upcoming.length > 0
                  ? `${upcoming.length} upcoming deadline${upcoming.length > 1 ? 's' : ''}. Keep the momentum going!`
                  : 'All clear! A great time to get ahead on your coursework.'}
            </p>
          </div>
          <Link
            href="/dashboard/ai-helper"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-indigo-500/40"
          >
            <MessageSquare className="h-4 w-4" />
            Ask AI Helper
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          gradient="bg-indigo-500"
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-400"
        />
        <StatCard
          label="Active tasks"
          value={stats.activeAssignments}
          icon={Calendar}
          gradient="bg-amber-500"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          sub={overdueCount > 0 ? `${overdueCount} overdue` : undefined}
        />
        <StatCard
          label="Done this week"
          value={stats.completedThisWeek}
          icon={CheckCircle2}
          gradient="bg-emerald-500"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
        />
        <StatCard
          label="Study hours"
          value={studyHours}
          icon={Clock}
          gradient="bg-violet-500"
          iconBg="bg-violet-500/10"
          iconColor="text-violet-400"
          sub="this week"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        {/* Upcoming deadlines */}
        <div className="sb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--sb-border)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[var(--sb-accent)]" />
              <h2 className="font-semibold text-[var(--foreground)]">Upcoming deadlines</h2>
            </div>
            <Link
              href="/dashboard/assignments"
              className="flex items-center gap-1 text-xs font-semibold text-[var(--sb-accent)] transition-colors hover:text-[var(--sb-accent-muted)]"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="text-4xl">🎉</span>
              <p className="mt-3 font-medium text-[var(--foreground)]">Nothing due soon</p>
              <p className="mt-1 text-sm text-[var(--sb-muted)]">Great work staying on top of things!</p>
              <Link
                href="/dashboard/assignments"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--sb-accent-bg)] px-3 py-1.5 text-sm font-medium text-[var(--sb-accent)] hover:opacity-80 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" /> Add assignment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--sb-border)] px-2 py-1">
              {upcoming.map((a) => {
                const { text, urgent } = relativeDate(a.due_date)
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--sb-surface-2)]">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[a.priority]}`} />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">{a.title}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_CLASSES[a.priority]}`}>
                          {a.priority}
                        </span>
                      </div>
                      <span className={`shrink-0 text-xs font-semibold ${urgent ? 'text-rose-400' : 'text-[var(--sb-muted)]'}`}>
                        {text}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="sb-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-[var(--foreground)]">
              <TrendingUp className="h-4 w-4 text-[var(--sb-accent)]" />
              Quick actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/dashboard/ai-helper',   icon: MessageSquare, label: 'AI Chat',   color: 'from-indigo-500 to-violet-500', bg: 'bg-indigo-500/10', text: 'text-indigo-400' },
                { href: '/dashboard/flashcards',  icon: Zap,           label: 'Flashcards', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-500/10',  text: 'text-amber-400' },
                { href: '/dashboard/notes',       icon: StickyNote,    label: 'Notes',     color: 'from-sky-400 to-cyan-500',    bg: 'bg-sky-500/10',    text: 'text-sky-400' },
                { href: '/dashboard/assignments', icon: Plus,          label: 'Task',      color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
                { href: '/dashboard/schedule',    icon: CalendarDays,  label: 'Schedule',  color: 'from-violet-400 to-purple-500', bg: 'bg-violet-500/10', text: 'text-violet-400' },
                { href: '/dashboard/pdf-annotator', icon: FileText,    label: 'PDF',       color: 'from-rose-400 to-pink-500',   bg: 'bg-rose-500/10',   text: 'text-rose-400' },
              ].map(({ href, icon: Icon, label, bg, text }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1.5 rounded-xl ${bg} p-3 text-center transition-all duration-150 hover:-translate-y-0.5 hover:opacity-90`}
                >
                  <Icon className={`h-5 w-5 ${text}`} />
                  <span className={`text-xs font-semibold ${text}`}>{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent sessions */}
          <div className="sb-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-[var(--foreground)]">
              <Clock className="h-4 w-4 text-[var(--sb-accent)]" />
              Recent sessions
            </h2>
            {sessions.length === 0 ? (
              <p className="text-center text-xs text-[var(--sb-muted)] py-4">No sessions logged yet.</p>
            ) : (
              <div className="space-y-1.5">
                {sessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-[var(--sb-border)] px-3 py-2 transition-colors hover:bg-[var(--sb-surface-2)]">
                    <p className="text-sm capitalize font-medium text-[var(--foreground)]">{s.session_type}</p>
                    <span className="text-xs font-semibold text-[var(--sb-accent)]">{s.duration_minutes} min</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
