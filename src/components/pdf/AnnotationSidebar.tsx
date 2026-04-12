'use client'

import { useState } from 'react'
import {
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  BookOpen,
} from 'lucide-react'
import type { Annotation } from './PDFViewerClient'

const COLOR_HEX: Record<string, string> = {
  yellow: '#ffd60a',
  green:  '#4ade80',
  blue:   '#60a5fa',
  pink:   '#f472b6',
  purple: '#c084fc',
}

interface Props {
  documentId: string
  documentName: string
  annotations: Annotation[]
  aiLoading: string | null
  onDelete: (id: string) => void
  onUpdateNote: (id: string, note: string) => void
  onExplain: (annotation: Annotation) => void
  onScrollToPage: (page: number) => void
}

function exportStudyGuide(documentName: string, annotations: Annotation[]) {
  if (!annotations.length) return

  const byPage = annotations.reduce<Record<number, Annotation[]>>((acc, a) => {
    ;(acc[a.page_number] ??= []).push(a)
    return acc
  }, {})

  const lines: string[] = [
    `# Study Guide — ${documentName}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
  ]

  for (const page of Object.keys(byPage)
    .map(Number)
    .sort((a, b) => a - b)) {
    lines.push(`## Page ${page}`, '')
    for (const ann of byPage[page]) {
      lines.push(`**Highlight (${ann.color}):** "${ann.selected_text}"`, '')
      if (ann.note) lines.push(`*Note:* ${ann.note}`, '')
      if (ann.ai_explanation) lines.push(`*AI Explanation:* ${ann.ai_explanation}`, '')
      lines.push('---', '')
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${documentName.replace(/\.pdf$/i, '')}-study-guide.md`
  a.click()
  URL.revokeObjectURL(url)
}

function AnnotationCard({
  annotation,
  aiLoading,
  onDelete,
  onUpdateNote,
  onExplain,
}: {
  annotation: Annotation
  aiLoading: string | null
  onDelete: (id: string) => void
  onUpdateNote: (id: string, note: string) => void
  onExplain: (a: Annotation) => void
}) {
  const [editing, setEditing] = useState(false)
  const [noteValue, setNoteValue] = useState(annotation.note ?? '')
  const [showExplanation, setShowExplanation] = useState(!!annotation.ai_explanation)

  const isLoadingThis = aiLoading === annotation.id

  const handleSaveNote = () => {
    onUpdateNote(annotation.id, noteValue)
    setEditing(false)
  }

  return (
    <div className="rounded-lg border border-[var(--sb-border)] bg-[var(--sb-item-bg)] p-3">
      {/* Highlight swatch + text */}
      <div className="mb-2 flex items-start gap-2">
        <div
          className="mt-0.5 h-3 w-1 flex-shrink-0 rounded-full"
          style={{ backgroundColor: COLOR_HEX[annotation.color] ?? COLOR_HEX.yellow }}
        />
        <p className="text-xs leading-relaxed text-[var(--foreground)]">
          &ldquo;{annotation.selected_text}&rdquo;
        </p>
      </div>

      {/* Note */}
      {editing ? (
        <div className="mb-2">
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-lg border border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--sb-muted)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Add a note…"
          />
          <div className="mt-1 flex gap-1.5">
            <button
              type="button"
              onClick={handleSaveNote}
              className="rounded bg-indigo-600 px-2 py-1 text-[11px] text-white hover:bg-indigo-500"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded px-2 py-1 text-[11px] text-[var(--sb-muted)] hover:text-[var(--foreground)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : annotation.note ? (
        <p
          className="mb-2 cursor-pointer rounded bg-[var(--sb-item-bg-hover)] px-2 py-1 text-[11px] italic text-[var(--sb-muted)] hover:bg-[var(--sb-surface-2)]"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {annotation.note}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mb-2 text-[11px] text-[var(--sb-muted)] hover:text-[var(--foreground)]"
        >
          + Add note
        </button>
      )}

      {/* AI explanation */}
      {annotation.ai_explanation ? (
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setShowExplanation((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-[var(--sb-accent)] hover:opacity-80"
          >
            {showExplanation ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            AI Explanation
          </button>
          {showExplanation && (
            <p className="mt-1.5 rounded-lg bg-[var(--sb-accent-bg)] px-2.5 py-2 text-[11px] leading-relaxed text-[var(--foreground)]">
              {annotation.ai_explanation}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onExplain(annotation)}
          disabled={!!aiLoading}
          className="mb-2 flex items-center gap-1 text-[11px] text-[var(--sb-accent)] hover:opacity-80 disabled:opacity-50"
        >
          {isLoadingThis ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          {isLoadingThis ? 'Explaining…' : 'Explain with AI'}
        </button>
      )}

      {/* Delete */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onDelete(annotation.id)}
          className="rounded p-1 text-[var(--sb-muted)] hover:text-rose-500"
          title="Delete annotation"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function AnnotationSidebar({
  documentName,
  annotations,
  aiLoading,
  onDelete,
  onUpdateNote,
  onExplain,
  onScrollToPage,
}: Props) {
  const byPage = annotations.reduce<Record<number, Annotation[]>>((acc, a) => {
    ;(acc[a.page_number] ??= []).push(a)
    return acc
  }, {})
  const pages = Object.keys(byPage)
    .map(Number)
    .sort((a, b) => a - b)

  return (
    <div className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-[var(--sb-border)] bg-[var(--sb-surface)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--sb-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-[var(--sb-accent)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">Annotations</span>
          {annotations.length > 0 && (
            <span className="rounded-full bg-[var(--sb-accent-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--sb-accent)]">
              {annotations.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => exportStudyGuide(documentName, annotations)}
          disabled={annotations.length === 0}
          title="Export as study guide (.md)"
          className="flex items-center gap-1 rounded-lg border border-[var(--sb-border)] px-2 py-1 text-[11px] text-[var(--sb-muted)] hover:bg-[var(--sb-item-bg)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {annotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 text-3xl">✍️</div>
            <p className="text-sm font-medium text-[var(--foreground)]">No highlights yet</p>
            <p className="mt-1 text-xs text-[var(--sb-muted)]">
              Select text in the PDF to highlight and annotate it.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pages.map((page) => (
              <div key={page}>
                <button
                  type="button"
                  onClick={() => onScrollToPage(page)}
                  className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--sb-muted)] hover:text-[var(--foreground)]"
                >
                  Page {page}
                </button>
                <div className="space-y-2">
                  {byPage[page].map((ann) => (
                    <AnnotationCard
                      key={ann.id}
                      annotation={ann}
                      aiLoading={aiLoading}
                      onDelete={onDelete}
                      onUpdateNote={onUpdateNote}
                      onExplain={onExplain}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
