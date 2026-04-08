'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { createNote, deleteNote } from '@/lib/supabase/mutations'
import { docToPlainPreview } from '@/lib/tiptap/plainDoc'
import type { Note } from '@/types/database.types'

export function NotesManager({ initialNotes }: { initialNotes: Note[] }) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const res = await createNote(title, body)
    setSaving(false)
    if (!res.success) {
      setError(res.error)
      return
    }
    setTitle('')
    setBody('')
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setError(null)
    const res = await deleteNote(id)
    setDeletingId(null)
    if (!res.success) {
      setError(res.error)
      return
    }
    setNotes((n) => n.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="sb-panel space-y-4 p-6">
        <h2 className="font-semibold text-slate-900">New note</h2>
        {error && (
          <div className="rounded-xl border border-red-200/90 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="note-title" className="sb-label">
            Title
          </label>
          <input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sb-input"
            placeholder="Lecture 4 — thermodynamics"
            required
          />
        </div>
        <div>
          <label htmlFor="note-body" className="sb-label">
            Content
          </label>
          <textarea
            id="note-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="sb-input resize-y"
            placeholder="Key ideas, formulas, or reminders…"
          />
        </div>
        <button type="submit" disabled={saving || !title.trim()} className="sb-btn-primary-inline">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save note
        </button>
      </form>

      <div className="sb-panel overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <h2 className="font-semibold text-slate-900">Your notes</h2>
          <p className="mt-0.5 text-xs text-slate-500">{notes.length} saved</p>
        </div>
        <ul className="divide-y divide-slate-50">
          {notes.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-slate-500">No notes yet.</li>
          )}
          {notes.map((note) => {
            const preview = docToPlainPreview(
              note.content as Record<string, unknown> | null
            )
            return (
              <li
                key={note.id}
                className="flex gap-3 px-5 py-4 transition-colors hover:bg-slate-50/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{note.title}</p>
                  {preview && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{preview}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    Updated {new Date(note.updated_at).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(note.id)}
                  disabled={deletingId === note.id}
                  className="shrink-0 self-start rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete note"
                >
                  {deletingId === note.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
