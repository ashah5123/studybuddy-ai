'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { createAssignment } from '@/lib/supabase/mutations'
import { assignmentSchema, type AssignmentInput } from '@/lib/validations/courses'
import type { Course } from '@/types/database.types'

interface CreateAssignmentDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  courses: Course[]
  defaultCourseId?: string
}

const FIELD_CLASS =
  'sb-input'

export function CreateAssignmentDialog({
  open,
  onClose,
  onCreated,
  courses,
  defaultCourseId,
}: CreateAssignmentDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      priority: 'medium',
      course_id: defaultCourseId ?? null,
    },
  })

  async function onSubmit(data: AssignmentInput) {
    setServerError(null)
    const result = await createAssignment(data)
    if (!result.success) {
      setServerError(result.error)
      return
    }
    reset()
    onCreated()
    onClose()
  }

  function handleClose() {
    reset()
    setServerError(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--sb-border)] bg-[var(--sb-surface)] shadow-2xl shadow-black/20 ring-1 ring-[var(--sb-border)] backdrop-blur-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--sb-border)] px-6 py-4">
          <h2 className="font-semibold text-[var(--foreground)]">New Assignment</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-[var(--sb-muted)] hover:bg-[var(--sb-item-bg-hover)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {serverError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {serverError}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[var(--sb-muted)] mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              placeholder="e.g. Chapter 5 homework"
              className={FIELD_CLASS}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-rose-300">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[var(--sb-muted)] mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={2}
              placeholder="Optional details…"
              className={FIELD_CLASS}
            />
          </div>

          {/* Course + Type row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--sb-muted)] mb-1">Course</label>
              <select {...register('course_id')} className={FIELD_CLASS}>
                <option value="">None</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--sb-muted)] mb-1">Type</label>
              <select {...register('type')} className={FIELD_CLASS}>
                <option value="">—</option>
                <option value="homework">Homework</option>
                <option value="exam">Exam</option>
                <option value="project">Project</option>
                <option value="quiz">Quiz</option>
              </select>
            </div>
          </div>

          {/* Priority + Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--sb-muted)] mb-1">Priority</label>
              <select {...register('priority')} className={FIELD_CLASS}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--sb-muted)] mb-1">Due date</label>
              <input type="date" {...register('due_date')} className={FIELD_CLASS} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--sb-item-bg-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sb-btn-primary-inline flex-1 justify-center px-5 py-2.5 font-semibold disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
