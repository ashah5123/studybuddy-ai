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
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-semibold text-gray-900">Delete course?</h3>
        <p className="mt-2 text-sm text-gray-500">
          <strong>{courseName}</strong> and all its notes and flashcards will be
          permanently deleted. Assignments will be unlinked. This cannot be undone.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
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
        const diff = Math.ceil(
          (new Date(nextDue.due_date).getTime() - Date.now()) / 86_400_000
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
        className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        style={{ borderTopColor: course.color, borderTopWidth: 3 }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{course.emoji}</span>
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">{course.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-gray-200 bg-white py-1 shadow-lg z-10">
                <button
                  onClick={() => { setMenuOpen(false); onEdit(course) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit2 className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Next due */}
        {nextDue && dueDateText && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="h-3.5 w-3.5" />
            <span className="truncate">{nextDue.title}</span>
            <span className="shrink-0 font-medium" style={{ color: course.color }}>
              {dueDateText}
            </span>
          </div>
        )}

        {/* View link */}
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="mt-4 flex items-center justify-center rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View course
        </Link>
      </div>
    </>
  )
}
