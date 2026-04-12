import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCourseById, getAssignments } from '@/lib/supabase/queries'
import { CourseDetailTabs } from './CourseDetailTabs'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const [course, assignments] = await Promise.all([
    getCourseById(courseId, user.id),
    getAssignments(user.id, { courseId }),
  ])

  if (!course) notFound()

  const completedCount = assignments.filter((a) => a.completed).length
  const completionPct =
    assignments.length > 0
      ? Math.round((completedCount / assignments.length) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--sb-muted)]">
        <Link href="/dashboard" className="hover:text-[var(--foreground)]">Dashboard</Link>
        <span>/</span>
        <Link href="/dashboard/courses" className="hover:text-[var(--foreground)]">Courses</Link>
        <span>/</span>
        <span className="text-[var(--foreground)] font-medium">{course.name}</span>
      </div>

      {/* Course header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/courses"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--sb-border)] bg-[var(--sb-item-bg)] text-[var(--foreground)] hover:bg-[var(--sb-item-bg-hover)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: `${course.color}20` }}
          >
            {course.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{course.name}</h1>
            <p className="text-sm text-[var(--sb-muted)]">
              {assignments.length} assignments · {completionPct}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: assignments.length },
          { label: 'Completed', value: completedCount },
          { label: 'Remaining', value: assignments.length - completedCount },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-[var(--sb-border)] bg-[var(--sb-item-bg)] p-4 text-center">
            <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
            <p className="text-xs text-[var(--sb-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs (client component for interactivity) */}
      <CourseDetailTabs assignments={assignments} />
    </div>
  )
}
