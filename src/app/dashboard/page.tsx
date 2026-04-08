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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import {
  getUserStats,
  getUpcomingAssignments,
  getRecentStudySessions,
} from '@/lib/supabase/queries'
import type { Profile } from '@/types/database.types'

const PRIORITY_CLASSES = {
  high: 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/20',
  medium: 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20',
  low: 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-500/20',
}

function relativeDate(iso: string | null): string {
  if (!iso) return 'No due date'
  const diff = new Date(iso).getTime() - Date.now()
  const days = Math.ceil(diff / 86_400_000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  return `Due in ${days} days`
}

function StatCard({
  label,
  value,
  icon: Icon,
  blob,
  iconClass,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  blob: string
  iconClass: string
}) {
  return (
    <div className="sb-panel group relative overflow-hidden p-5 transition-shadow hover:shadow-md">
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.2] blur-2xl ${blob}`}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--sb-muted)]">{label}</p>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 shadow-sm ring-1 ring-white/10">
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </span>
      </div>
      <p className="relative mt-3 text-3xl font-bold tabular-nums tracking-tight text-[var(--foreground)]">
        {value}
      </p>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const firstName =
    (profile as Pick<Profile, 'full_name'> | null)?.full_name?.split(' ')[0] ?? 'there'
  const studyHours = (stats.studyMinutesThisWeek / 60).toFixed(1)

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 px-5 py-6 shadow-sm shadow-black/20 sm:px-8 sm:py-7">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
          {getTimeOfDay()} overview
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Hey {firstName}, ready to study?
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--sb-muted)]">
          Here&apos;s a snapshot of your courses, deadlines, and recent focus time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total courses"
          value={stats.totalCourses}
          icon={BookOpen}
          blob="bg-indigo-500"
          iconClass="text-indigo-600"
        />
        <StatCard
          label="Active tasks"
          value={stats.activeAssignments}
          icon={Calendar}
          blob="bg-amber-400"
          iconClass="text-amber-600"
        />
        <StatCard
          label="Done this week"
          value={stats.completedThisWeek}
          icon={CheckCircle2}
          blob="bg-emerald-500"
          iconClass="text-emerald-600"
        />
        <StatCard
          label="Study hours"
          value={studyHours}
          icon={Clock}
          blob="bg-violet-500"
          iconClass="text-violet-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="sb-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-5 py-4">
            <h2 className="font-semibold text-[var(--foreground)]">Upcoming deadlines</h2>
            <Link
              href="/dashboard/assignments"
              className="text-xs font-semibold text-[var(--sb-accent)] transition-colors hover:text-[var(--sb-accent-muted)]"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-white/5 p-2">
            {upcoming.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-[var(--sb-muted)]">
                Nothing due soon — nice work.
              </p>
            ) : (
              upcoming.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
                >
                  <span
                    className={`mt-0.5 rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_CLASSES[a.priority]}`}
                  >
                    {a.priority}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{a.title}</p>
                    <p className="text-xs text-[var(--sb-muted)]">{relativeDate(a.due_date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sb-panel overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-5 py-4">
            <h2 className="font-semibold text-[var(--foreground)]">Recent study sessions</h2>
          </div>
          <div className="divide-y divide-white/5 p-2">
            {sessions.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-[var(--sb-muted)]">
                No sessions logged yet. Start a focus block when you can.
              </p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/20">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize text-[var(--foreground)]">
                      {s.session_type}
                    </p>
                    <p className="text-xs text-[var(--sb-muted)]">{s.duration_minutes} min</p>
                  </div>
                  <span className="text-xs tabular-nums text-[rgba(148,163,184,0.85)]">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="sb-panel p-6">
        <h2 className="mb-4 font-semibold text-[var(--foreground)]">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/ai-helper"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-105 hover:shadow-lg hover:shadow-indigo-500/20"
          >
            <MessageSquare className="h-4 w-4" />
            AI chat
          </Link>
          <Link
            href="/dashboard/flashcards"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors hover:bg-white/10"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            Flashcards
          </Link>
          <Link
            href="/dashboard/notes"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors hover:bg-white/10"
          >
            <StickyNote className="h-4 w-4 text-sky-600" />
            Notes
          </Link>
          <Link
            href="/dashboard/assignments"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors hover:bg-white/10"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            Assignment
          </Link>
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors hover:bg-white/10"
          >
            <CalendarDays className="h-4 w-4 text-violet-600" />
            Schedule
          </Link>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}
