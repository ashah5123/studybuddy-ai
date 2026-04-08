import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BookOpen,
  Calendar,
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
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
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
  color,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
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

  const firstName = (profile as Pick<Profile, 'full_name'> | null)?.full_name?.split(' ')[0] ?? 'there'
  const studyHours = (stats.studyMinutesThisWeek / 60).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getTimeOfDay()}, {firstName}! 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening with your studies today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Courses"
          value={stats.totalCourses}
          icon={BookOpen}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="Active Assignments"
          value={stats.activeAssignments}
          icon={Calendar}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          label="Completed This Week"
          value={stats.completedThisWeek}
          icon={CheckCircle2}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          label="Study Hours"
          value={studyHours}
          icon={Clock}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming deadlines */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
            <Link
              href="/dashboard/assignments"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-50 p-2">
            {upcoming.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-gray-400">
                No upcoming deadlines — you&apos;re all caught up!
              </p>
            ) : (
              upcoming.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5">
                  <span
                    className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                      PRIORITY_CLASSES[a.priority]
                    }`}
                  >
                    {a.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-400">{relativeDate(a.due_date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent study sessions */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Recent Study Sessions</h2>
          </div>
          <div className="divide-y divide-gray-50 p-2">
            {sessions.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-gray-400">
                No sessions recorded yet. Start studying!
              </p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize text-gray-900">
                      {s.session_type}
                    </p>
                    <p className="text-xs text-gray-400">{s.duration_minutes} min</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/ai"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            Start AI Chat
          </Link>
          <Link
            href="/dashboard/flashcards"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Zap className="h-4 w-4" />
            Create Flashcards
          </Link>
          <Link
            href="/dashboard/notes"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <StickyNote className="h-4 w-4" />
            Add Note
          </Link>
          <Link
            href="/dashboard/assignments"
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </Link>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
