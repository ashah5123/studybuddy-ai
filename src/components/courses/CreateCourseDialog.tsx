'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { createCourse } from '@/lib/supabase/mutations'
import { courseSchema, type CourseInput } from '@/lib/validations/courses'

const EMOJI_OPTIONS = [
  '📚', '📖', '✏️', '🔬', '🧬', '⚗️', '🧪', '🔭', '🎨', '🎵',
  '💻', '🖥️', '📐', '📏', '🗺️', '🌍', '📊', '📈', '💡', '🏆',
  '🧮', '📝', '🎭', '⚽', '🎯', '🏛️', '🔢', '🔤', '🌱', '🤖',
]

const COLOR_PRESETS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
  '#F97316', '#EAB308', '#22C55E', '#14B8A6',
  '#6366F1', '#64748B',
]

interface CreateCourseDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateCourseDialog({
  open,
  onClose,
  onCreated,
}: CreateCourseDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: { color: '#3B82F6', emoji: '📚' },
  })

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch() is safe here
  const selectedEmoji = watch('emoji')
  const selectedColor = watch('color')

  async function onSubmit(data: CourseInput) {
    setServerError(null)
    const result = await createCourse(data)
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
          <h2 className="font-semibold text-[var(--foreground)]">New Course</h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-[var(--sb-muted)] hover:bg-[var(--sb-item-bg-hover)] hover:text-[var(--foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/25 bg-rose-500/10 p-3 text-sm text-rose-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Course name */}
          <div>
            <label className="block text-sm font-medium text-[var(--sb-muted)] mb-1">
              Course name <span className="text-red-500">*</span>
            </label>
            <input
              {...register('name')}
              placeholder="e.g. Calculus II"
              className="sb-input"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-300">{errors.name.message}</p>
            )}
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-[var(--sb-muted)] mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setValue('emoji', emoji)}
                  className={`h-9 w-9 rounded-lg text-lg transition-colors ${
                    selectedEmoji === emoji
                      ? 'bg-[var(--sb-item-bg-hover)] ring-2 ring-[var(--sb-accent)]'
                      : 'bg-[var(--sb-item-bg)] hover:bg-[var(--sb-item-bg-hover)]'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-[var(--sb-muted)] mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  style={{ backgroundColor: color }}
                  className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-[var(--sb-accent)] ring-offset-[var(--sb-surface)]' : ''
                  }`}
                />
              ))}
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setValue('color', e.target.value)}
                className="h-7 w-7 cursor-pointer rounded-full border-0 p-0"
                title="Custom color"
              />
            </div>
            {errors.color && (
              <p className="mt-1 text-xs text-rose-300">{errors.color.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--sb-item-bg-hover)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ backgroundColor: selectedColor }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Creating…' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
