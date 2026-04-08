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
    <div className="sb-panel relative overflow-hidden p-4">
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[var(--sb-muted)]">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${blob}`}>
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </span>
      </div>
      <p className="relative mt-2 text-2xl font-bold tabular-nums tracking-tight text-[var(--foreground)]">
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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--sb-muted)]">
          {getTimeOfDay()} study board
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Hey {firstName}</h1>
        <p className="mt-1 text-sm text-[var(--sb-muted)]">Here is your day at a glance.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_340px]">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total courses"
              value={stats.totalCourses}
              icon={BookOpen}
              blob="bg-indigo-500/15"
              iconClass="text-indigo-300"
            />
            <StatCard
              label="Active tasks"
              value={stats.activeAssignments}
              icon={Calendar}
              blob="bg-amber-500/15"
              iconClass="text-amber-300"
            />
            <StatCard
              label="Done this week"
              value={stats.completedThisWeek}
              icon={CheckCircle2}
              blob="bg-emerald-500/15"
              iconClass="text-emerald-300"
            />
            <StatCard
              label="Study hours"
              value={studyHours}
              icon={Clock}
              blob="bg-violet-500/15"
              iconClass="text-violet-300"
            />
          </div>

          <div className="sb-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="font-semibold text-white">Upcoming deadlines</h2>
              <Link href="/dashboard/assignments" className="text-xs font-semibold text-indigo-300 hover:text-indigo-200">
                View all
              </Link>
            </div>
            <div className="divide-y divide-white/5 p-2">
              {upcoming.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-[var(--sb-muted)]">
                  Nothing due soon - nice work.
                </p>
              ) : (
                upcoming.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/5">
                    <span
                      className={`mt-0.5 rounded-lg px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_CLASSES[a.priority]}`}
                    >
                      {a.priority}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{a.title}</p>
                      <p className="text-xs text-[var(--sb-muted)]">{relativeDate(a.due_date)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="sb-panel p-5">
            <h2 className="mb-3 font-semibold text-white">Today focus meter</h2>
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((a, i) => (
                <div key={a.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate text-[var(--sb-muted)]">{a.title}</span>
                    <span className="text-[var(--sb-muted)]">{i === 0 ? '80%' : i === 1 ? '55%' : '35%'}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: i === 0 ? '80%' : i === 1 ? '55%' : '35%' }}
                    />
                  </div>
                </div>
              ))}
              {upcoming.length === 0 && (
                <p className="text-xs text-[var(--sb-muted)]">Add assignments to see your focus meter.</p>
              )}
            </div>
          </div>

          <div className="sb-panel p-5">
            <h2 className="mb-3 font-semibold text-white">Recent sessions</h2>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-xs text-[var(--sb-muted)]">No recent sessions yet.</p>
              ) : (
                sessions.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2">
                    <p className="text-sm capitalize text-white">{s.session_type}</p>
                    <p className="text-xs text-[var(--sb-muted)]">{s.duration_minutes} min</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sb-panel p-6">
        <h2 className="mb-4 font-semibold text-white">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/ai-helper"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <MessageSquare className="h-4 w-4" />
            AI chat
          </Link>
          <Link
            href="/dashboard/flashcards"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-white/10"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            Flashcards
          </Link>
          <Link
            href="/dashboard/notes"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-white/10"
          >
            <StickyNote className="h-4 w-4 text-sky-600" />
            Notes
          </Link>
          <Link
            href="/dashboard/assignments"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-white/10"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            Assignment
          </Link>
          <Link
            href="/dashboard/schedule"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-white/10"
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
