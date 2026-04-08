'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  createScheduleEvent,
  deleteScheduleEvent,
  updateScheduleEvent,
} from '@/lib/supabase/mutations'
import type { Course, ScheduleEvent } from '@/types/database.types'

const COLOR_PRESETS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#0ea5e9',
  '#f97316',
  '#64748b',
]

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocalValue(s: string): string {
  return new Date(s).toISOString()
}

interface ScheduleEventDialogProps {
  open: boolean
  onClose: () => void
  /** When creating, anchor default start/end on this day. */
  anchorDay: Date
  editing: ScheduleEvent | null
  courses: Course[]
  onSaved: () => void
}

export function ScheduleEventDialog({
  open,
  onClose,
  anchorDay,
  editing,
  courses,
  onSaved,
}: ScheduleEventDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [color, setColor] = useState(COLOR_PRESETS[0])
  const [courseId, setCourseId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFormError(null)
    if (editing) {
      setTitle(editing.title)
      setDescription(editing.description ?? '')
      setStartLocal(toDatetimeLocalValue(editing.starts_at))
      setEndLocal(toDatetimeLocalValue(editing.ends_at))
      setColor(editing.color)
      setCourseId(editing.course_id ?? '')
    } else {
      const s = new Date(anchorDay)
      s.setHours(9, 0, 0, 0)
      const e = new Date(anchorDay)
      e.setHours(10, 0, 0, 0)
      setTitle('')
      setDescription('')
      setStartLocal(toDatetimeLocalValue(s.toISOString()))
      setEndLocal(toDatetimeLocalValue(e.toISOString()))
      setColor(COLOR_PRESETS[0])
      setCourseId('')
    }
  }, [open, editing, anchorDay])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const starts_at = fromDatetimeLocalValue(startLocal)
    const ends_at = fromDatetimeLocalValue(endLocal)
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      starts_at,
      ends_at,
      color,
      course_id: courseId ? courseId : null,
    }

    const res = editing
      ? await updateScheduleEvent(editing.id, payload)
      : await createScheduleEvent(payload)

    setSaving(false)
    if (!res.success) {
      setFormError(res.error)
      return
    }
    onSaved()
    onClose()
  }

  async function handleDelete() {
    if (!editing) return
    if (!confirm('Delete this block from your schedule?')) return
    setDeleting(true)
    setFormError(null)
    const res = await deleteScheduleEvent(editing.id)
    setDeleting(false)
    if (!res.success) {
      setFormError(res.error)
      return
    }
    onSaved()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? 'Edit block' : 'New block'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-5 py-4">
          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {formError}
            </p>
          )}

          <div>
            <label htmlFor="se-title" className="mb-1 block text-xs font-medium text-slate-600">
              Title
            </label>
            <input
              id="se-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sb-input w-full"
              placeholder="e.g. Chem lab prep"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label htmlFor="se-desc" className="mb-1 block text-xs font-medium text-slate-600">
              Notes (optional)
            </label>
            <textarea
              id="se-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sb-input min-h-[72px] w-full resize-y"
              rows={3}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="se-start" className="mb-1 block text-xs font-medium text-slate-600">
                Starts
              </label>
              <input
                id="se-start"
                type="datetime-local"
                value={startLocal}
                onChange={(e) => setStartLocal(e.target.value)}
                className="sb-input w-full text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="se-end" className="mb-1 block text-xs font-medium text-slate-600">
                Ends
              </label>
              <input
                id="se-end"
                type="datetime-local"
                value={endLocal}
                onChange={(e) => setEndLocal(e.target.value)}
                className="sb-input w-full text-sm"
                required
              />
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-medium text-slate-600">Highlight color</span>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-transform hover:scale-105 ${
                    color === c ? 'ring-indigo-500' : 'ring-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="se-course" className="mb-1 block text-xs font-medium text-slate-600">
              Course (optional)
            </label>
            <select
              id="se-course"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="sb-input w-full text-sm"
            >
              <option value="">None</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={saving || deleting}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition-all hover:brightness-105 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add to calendar'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving || deleting}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                {deleting ? '…' : 'Delete'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
