'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCourses } from '@/hooks/useCourses'
import { useAssignments } from '@/hooks/useAssignments'
import { CourseCard } from '@/components/courses/CourseCard'
import { CreateCourseDialog } from '@/components/courses/CreateCourseDialog'
import type { Course } from '@/types/database.types'

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
      <div className="flex gap-3">
        <div className="h-8 w-8 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>
      </div>
      <div className="mt-4 h-9 rounded-lg bg-gray-100" />
    </div>
  )
}

export default function CoursesPage() {
  const { courses, loading, error, refetch } = useCourses()
  const { assignments } = useAssignments()
  const [createOpen, setCreateOpen] = useState(false)
  const [, setEditingCourse] = useState<Course | null>(null)

  // Build lookup: courseId → next upcoming assignment
  const nextDueMap = assignments.reduce<Record<string, (typeof assignments)[0]>>(
    (acc, a) => {
      if (!a.course_id || a.completed || !a.due_date) return acc
      const prev = acc[a.course_id]
      if (!prev || new Date(a.due_date) < new Date(prev.due_date!)) {
        acc[a.course_id] = a
      }
      return acc
    },
    {}
  )

  const countMap = assignments.reduce<Record<string, number>>((acc, a) => {
    if (a.course_id) acc[a.course_id] = (acc[a.course_id] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600/90">
            Organize
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Courses</h1>
          <p className="mt-2 text-sm text-slate-600">
            {courses.length} course{courses.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-105"
        >
          <Plus className="h-4 w-4" />
          New Course
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200/90 bg-red-50 p-4 text-sm text-red-800">
          {error.message}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && courses.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/90 bg-white py-16 text-center shadow-sm">
          <span className="text-5xl">📚</span>
          <h3 className="mt-4 font-semibold text-slate-900">No courses yet</h3>
          <p className="mt-1 text-sm text-slate-600">Get started by adding your first course.</p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-105"
          >
            <Plus className="h-4 w-4" />
            Add your first course
          </button>
        </div>
      )}

      {/* Course grid */}
      {!loading && courses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              assignmentCount={countMap[course.id] ?? 0}
              nextDue={nextDueMap[course.id] ?? null}
              onDeleted={refetch}
              onEdit={setEditingCourse}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateCourseDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={refetch}
      />
    </div>
  )
}
