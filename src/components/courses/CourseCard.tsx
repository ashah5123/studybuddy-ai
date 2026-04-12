'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Calendar, Edit2, MoreVertical, Trash2 } from 'lucide-react'
import { deleteCourse } from '@/lib/supabase/mutations'
import type { Assignment, Course } from '@/types/database.types'

interface CourseCardProps {
  course: Course
  assignmentCount?: number
  nextDue?: Assignment | null
  onDeleted: () => void
  onEdit: (course: Course) => void
}

function ConfirmDialog({
  courseName,
  onConfirm,
  onCancel,
  loading,
}: {
  courseName: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.92)] p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-md">
        <h3 className="font-semibold text-[var(--foreground)]">Delete course?</h3>
        <p className="mt-2 text-sm text-[var(--sb-muted)]">
          <strong>{courseName}</strong> and all its notes and flashcards will be
          permanently deleted. Assignments will be unlinked. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function CourseCard({
  course,
  assignmentCount = 0,
  nextDue,
  onDeleted,
  onEdit,
}: CourseCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteCourse(course.id)
    setDeleting(false)
    setConfirmDelete(false)
    if (result.success) onDeleted()
  }

  const dueDateText = nextDue?.due_date
    ? (() => {
        /* eslint-disable-next-line react-hooks/purity -- relative due date label */
        const now = Date.now()
        const diff = Math.ceil(
          (new Date(nextDue.due_date).getTime() - now) / 86_400_000
        )
        if (diff < 0) return `${Math.abs(diff)}d overdue`
        if (diff === 0) return 'Due today'
        return `Due in ${diff}d`
      })()
    : null

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          courseName={course.name}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
          loading={deleting}
        />
      )}

      <div
        className="group relative overflow-hidden rounded-2xl border border-[var(--sb-border)] bg-[var(--sb-surface)] p-5 shadow-[var(--sb-shadow-sm)] transition-all duration-200 hover:-translate-y-1 hover:border-[var(--sb-border-2)] hover:shadow-[var(--sb-shadow-lg)]"
      >
        {/* Colored top accent bar */}
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-2xl" style={{ background: course.color }} />

        {/* Subtle background tint from course color */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] rounded-2xl" style={{ background: course.color }} />

        {/* Header */}
        <div className="relative flex items-start justify-between pt-1">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm"
              style={{ background: `${course.color}18` }}
            >
              {course.emoji}
            </span>
            <div>
              <h3 className="font-semibold leading-tight text-[var(--foreground)]">{course.name}</h3>
              <p className="mt-0.5 text-xs text-[var(--sb-muted)]">
                {assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-1.5 text-[var(--sb-muted)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--sb-surface-2)] hover:text-[var(--foreground)]"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-xl border border-[var(--sb-border)] bg-[var(--sb-surface)] py-1 shadow-[var(--sb-shadow-lg)] ring-1 ring-[var(--sb-border)] backdrop-blur-md">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(course) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--sb-surface-2)]"
                >
                  <Edit2 className="h-4 w-4 text-[var(--sb-muted)]" /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Next due */}
        {nextDue && dueDateText && (
          <div className="relative mt-3 flex items-center gap-1.5 rounded-lg bg-[var(--sb-surface-2)] px-2.5 py-1.5 text-xs text-[var(--sb-muted)]">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{nextDue.title}</span>
            <span className="ml-auto shrink-0 font-semibold" style={{ color: course.color }}>
              {dueDateText}
            </span>
          </div>
        )}

        {/* View link */}
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="relative mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--sb-border)] bg-[var(--sb-surface-2)] py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:border-[var(--sb-border-2)] hover:bg-[var(--sb-accent-bg)] hover:text-[var(--sb-accent)]"
        >
          View course
        </Link>
      </div>
    </>
  )
}
