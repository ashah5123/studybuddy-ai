'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { AnnotationSidebar } from './AnnotationSidebar'

// Use unpkg CDN for worker (more reliable than cdnjs for v5)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export interface Annotation {
  id: string
  document_id: string
  page_number: number
  selected_text: string
  note: string | null
  color: string
  position_data: {
    rects: Array<{ top: number; left: number; width: number; height: number }>
  } | null
  ai_explanation: string | null
  created_at: string
}

interface PendingSelection {
  pageNumber: number
  selectedText: string
  rects: Array<{ top: number; left: number; width: number; height: number }>
  // viewport position for the toolbar
  toolbarTop: number
  toolbarLeft: number
}

const COLOR_HEX: Record<string, string> = {
  yellow: '#ffd60a',
  green:  '#4ade80',
  blue:   '#60a5fa',
  pink:   '#f472b6',
  purple: '#c084fc',
}

const COLOR_LABELS = Object.keys(COLOR_HEX) as Array<keyof typeof COLOR_HEX>

interface Props {
  documentId: string
  documentName: string
  fileUrl: string
  initialAnnotations: Annotation[]
}

export function PDFViewerClient({ documentId, documentName, fileUrl, initialAnnotations }: Props) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageWidth, setPageWidth] = useState<number>(700)
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [pending, setPending] = useState<PendingSelection | null>(null)
  const [pendingNote, setPendingNote] = useState('')
  const [pendingColor, setPendingColor] = useState<string>('yellow')
  const [savingAnnotation, setSavingAnnotation] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null) // annotationId being explained

  const containerRef = useRef<HTMLDivElement>(null)
  // Map of pageNumber → page container div
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Resize observer to set pageWidth based on container
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setPageWidth(Math.min(Math.max(w - 32, 300), 900))
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const handleDocumentLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }, [])

  // Capture text selection on mouse up within a page
  const handleMouseUp = useCallback((pageNumber: number) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return
    const text = selection.toString().trim()
    if (!text) return

    const pageEl = pageRefs.current.get(pageNumber)
    if (!pageEl) return

    const pageRect = pageEl.getBoundingClientRect()
    const range = selection.getRangeAt(0)
    const clientRects = Array.from(range.getClientRects())

    // Convert to percentages relative to the page container
    const rects = clientRects
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        top:    ((r.top    - pageRect.top)    / pageRect.height) * 100,
        left:   ((r.left   - pageRect.left)   / pageRect.width)  * 100,
        width:  (r.width                       / pageRect.width)  * 100,
        height: (r.height                      / pageRect.height) * 100,
      }))

    if (!rects.length) return

    // Position toolbar below the last rect in viewport coords
    const lastRect = clientRects[clientRects.length - 1]
    setPending({
      pageNumber,
      selectedText: text,
      rects,
      toolbarTop:  lastRect.bottom + window.scrollY + 8,
      toolbarLeft: Math.max(lastRect.left + window.scrollX - 80, 8),
    })
    setPendingNote('')
    setPendingColor('yellow')
  }, [])

  const dismissToolbar = useCallback(() => {
    setPending(null)
    setPendingNote('')
    window.getSelection()?.removeAllRanges()
  }, [])

  const saveAnnotation = useCallback(async () => {
    if (!pending) return
    setSavingAnnotation(true)
    try {
      const res = await fetch('/api/pdf-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          pageNumber:    pending.pageNumber,
          selectedText:  pending.selectedText,
          note:          pendingNote || null,
          color:         pendingColor,
          positionData:  { rects: pending.rects },
        }),
      })
      const json = await res.json()
      if (json.annotation) {
        setAnnotations((prev) => [...prev, json.annotation])
      }
      dismissToolbar()
    } finally {
      setSavingAnnotation(false)
    }
  }, [pending, pendingNote, pendingColor, documentId, dismissToolbar])

  const deleteAnnotation = useCallback(async (id: string) => {
    await fetch(`/api/pdf-annotations?id=${id}`, { method: 'DELETE' })
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const updateNote = useCallback(async (id: string, note: string) => {
    const res = await fetch(`/api/pdf-annotations?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    const json = await res.json()
    if (json.annotation) {
      setAnnotations((prev) => prev.map((a) => (a.id === id ? json.annotation : a)))
    }
  }, [])

  const explainAnnotation = useCallback(
    async (annotation: Annotation) => {
      setAiLoading(annotation.id)
      try {
        const res = await fetch('/api/pdf-explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedText:  annotation.selected_text,
            annotationId:  annotation.id,
            documentName,
          }),
        })
        const json = await res.json()
        if (json.explanation) {
          setAnnotations((prev) =>
            prev.map((a) =>
              a.id === annotation.id ? { ...a, ai_explanation: json.explanation } : a
            )
          )
        }
      } finally {
        setAiLoading(null)
      }
    },
    [documentName]
  )

  const scrollToPage = useCallback((pageNumber: number) => {
    pageRefs.current.get(pageNumber)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Close toolbar on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissToolbar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [dismissToolbar])

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4 overflow-hidden">
      {/* PDF scroll area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto rounded-xl border border-[var(--sb-border)] bg-[var(--background)] px-4 py-6"
      >
        {/* Top controls */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs text-[var(--sb-muted)]">
            {numPages > 0 ? `${numPages} pages` : 'Loading…'}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPageWidth((w) => Math.max(w - 80, 300))}
              className="rounded-lg border border-[var(--sb-border)] p-1.5 text-[var(--foreground)] hover:bg-[var(--sb-item-bg-hover)]"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPageWidth((w) => Math.min(w + 80, 1200))}
              className="rounded-lg border border-[var(--sb-border)] p-1.5 text-[var(--foreground)] hover:bg-[var(--sb-item-bg-hover)]"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <Document
          file={fileUrl}
          onLoadSuccess={handleDocumentLoad}
          loading={
            <div className="flex items-center justify-center py-20 text-[var(--sb-muted)]">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading PDF…
            </div>
          }
          error={
            <div className="flex items-center justify-center gap-2 py-20 text-rose-400">
              <AlertCircle className="h-5 w-5" />
              Failed to load PDF. Check the file URL and storage bucket permissions.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el)
                else pageRefs.current.delete(pageNum)
              }}
              className="relative mb-4 select-text"
              onMouseUp={() => handleMouseUp(pageNum)}
            >
              {/* Highlight overlays — sit between canvas and text layer via pointer-events-none */}
              {annotations
                .filter((a) => a.page_number === pageNum)
                .flatMap((ann) =>
                  (ann.position_data?.rects ?? []).map((rect, i) => (
                    <div
                      key={`${ann.id}-${i}`}
                      className="pointer-events-none absolute z-10 opacity-40 mix-blend-multiply"
                      style={{
                        top:    `${rect.top}%`,
                        left:   `${rect.left}%`,
                        width:  `${rect.width}%`,
                        height: `${rect.height}%`,
                        backgroundColor: COLOR_HEX[ann.color] ?? COLOR_HEX.yellow,
                      }}
                    />
                  ))
                )}

              <Page
                pageNumber={pageNum}
                width={pageWidth}
                renderTextLayer
                renderAnnotationLayer={false}
                className="shadow-lg"
              />

              {/* Page number badge */}
              <div className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white/60">
                {pageNum}
              </div>
            </div>
          ))}
        </Document>
      </div>

      {/* Sidebar */}
      <AnnotationSidebar
        documentId={documentId}
        documentName={documentName}
        annotations={annotations}
        aiLoading={aiLoading}
        onDelete={deleteAnnotation}
        onUpdateNote={updateNote}
        onExplain={explainAnnotation}
        onScrollToPage={scrollToPage}
      />

      {/* Floating annotation toolbar */}
      {pending && (
        <>
          {/* Backdrop to dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={dismissToolbar}
          />
          <div
            className="fixed z-50 w-72 rounded-xl border border-[var(--sb-border)] bg-[var(--sb-surface)] p-3 shadow-2xl"
            style={{ top: pending.toolbarTop, left: pending.toolbarLeft }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-2 line-clamp-2 text-xs text-[var(--sb-muted)]">
              &ldquo;{pending.selectedText.slice(0, 120)}{pending.selectedText.length > 120 ? '…' : ''}&rdquo;
            </p>

            {/* Color picker */}
            <div className="mb-2 flex gap-1.5">
              {COLOR_LABELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() => setPendingColor(c)}
                  className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: COLOR_HEX[c],
                    outline: pendingColor === c ? `2px solid white` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>

            {/* Note input */}
            <textarea
              value={pendingNote}
              onChange={(e) => setPendingNote(e.target.value)}
              placeholder="Add a note… (optional)"
              rows={2}
              className="mb-2 w-full resize-none rounded-lg border border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-2.5 py-1.5 text-xs text-[var(--foreground)] placeholder:text-[var(--sb-muted)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveAnnotation}
                disabled={savingAnnotation}
                className="flex-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {savingAnnotation ? 'Saving…' : 'Highlight'}
              </button>
              <button
                type="button"
                onClick={dismissToolbar}
                className="rounded-lg border border-[var(--sb-border)] px-3 py-1.5 text-xs text-[var(--sb-muted)] hover:bg-[var(--sb-item-bg)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
