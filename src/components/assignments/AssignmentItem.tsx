'use client'

import { useState } from 'react'
import { Trash2, Loader2, AlertCircle } from 'lucide-react'
import { toggleAssignmentComplete, deleteAssignment } from '@/lib/supabase/mutations'
import type { Assignment } from '@/types/database.types'

const TYPE_CLASSES: Record<string, string> = {
  homework: 'bg-sky-500/10 text-sky-200 ring-1 ring-sky-500/20',
  exam: 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-500/20',
  project: 'bg-violet-500/10 text-violet-200 ring-1 ring-violet-500/20',
  quiz: 'bg-amber-500/10 text-amber-200 ring-1 ring-amber-500/20',
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
}

function relativeDate(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: 'No due date', overdue: false }
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { text: 'Due today', overdue: false }
  if (diff === 1) return { text: 'Due tomorrow', overdue: false }
  return { text: `Due in ${diff} days`, overdue: false }
}

interface AssignmentItemProps {
  assignment: Assignment
  onToggle?: (completed: boolean) => void
  onDeleted?: () => void
}

export function AssignmentItem({
  assignment,
  onToggle,
  onDeleted,
}: AssignmentItemProps) {
  const [completed, setCompleted] = useState(assignment.completed)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { text: dueDateText, overdue } = relativeDate(assignment.due_date)

  async function handleToggle() {
    setToggling(true)
    const next = !completed
    setCompleted(next) // optimistic update
    onToggle?.(next)
    const result = await toggleAssignmentComplete(assignment.id, next)
    if (!result.success) {
      setCompleted(!next) // revert
      onToggle?.(!next)
      setError(result.error)
    }
    setToggling(false)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteAssignment(assignment.id)
    setDeleting(false)
    setConfirmDelete(false)
    if (!result.success) setError(result.error)
    else onDeleted?.()
  }

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[rgba(15,23,42,0.92)] p-6 shadow-2xl shadow-black/40 ring-1 ring-white/5 backdrop-blur-md">
            <h3 className="font-semibold text-[var(--foreground)]">Delete assignment?</h3>
            <p className="mt-2 text-sm text-[var(--sb-muted)]">
              &ldquo;{assignment.title}&rdquo; will be permanently removed.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`flex items-start gap-3 py-3 ${completed ? 'opacity-60' : ''}`}>
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          aria-label={completed ? 'Mark as incomplete' : 'Mark as complete'}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            completed
              ? 'border-green-500 bg-green-500'
              : 'border-white/20 hover:border-[rgba(167,139,250,0.55)]'
          } ${toggling ? 'opacity-50 cursor-wait' : ''}`}
        >
          {completed && (
            <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-sm font-medium text-[var(--foreground)] ${completed ? 'line-through' : ''}`}
            >
              {assignment.title}
            </span>
            {assignment.type && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_CLASSES[assignment.type] ?? 'bg-white/5 text-[var(--sb-muted)] ring-1 ring-white/10'}`}
              >
                {assignment.type}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full shrink-0 ${PRIORITY_DOT[assignment.priority]}`} />
            <span
              className={`text-xs ${overdue && !completed ? 'text-rose-300 font-medium' : 'text-[rgba(148,163,184,0.85)]'}`}
            >
              {dueDateText}
            </span>
          </div>
          {error && (
            <div className="mt-1 flex items-center gap-1 text-xs text-rose-300">
              <AlertCircle className="h-3 w-3" /> {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded-md p-1.5 text-[rgba(148,163,184,0.85)] hover:bg-rose-500/10 hover:text-rose-200 transition-colors"
            aria-label="Delete assignment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  )
}
