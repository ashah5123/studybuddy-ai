'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import {
  FileText,
  Upload,
  Loader2,
  Trash2,
  BookOpen,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface PDFDocument {
  id: string
  name: string
  file_url: string
  file_size: number | null
  page_count: number | null
  course_id: string | null
  created_at: string
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PDFAnnotatorPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [docs, setDocs] = useState<PDFDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('pdf_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setDocs(data ?? [])
      setLoading(false)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)

    const form = new FormData()
    form.append('file', file)

    const res = await fetch('/api/pdf-upload', { method: 'POST', body: form })
    const json = await res.json()

    if (!res.ok || json.error) {
      setUploadError(json.error ?? 'Upload failed.')
    } else {
      setDocs((prev) => [json.document, ...prev])
      router.push(`/dashboard/pdf-annotator/${json.document.id}`)
    }
    setUploading(false)
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDelete(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    await supabase.from('pdf_documents').delete().eq('id', id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">
            Study Tools
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
            PDF Annotator
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--sb-muted)]">
            Upload PDF textbooks, highlight passages, add notes, and get AI explanations. Export
            your annotations as a study guide.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </button>
        </div>
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Document grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[var(--sb-muted)]">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading…
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 py-20 text-center">
          <FileText className="mb-3 h-10 w-10 text-[var(--sb-muted)]" />
          <p className="text-base font-semibold text-white">No PDFs yet</p>
          <p className="mt-1 text-sm text-[var(--sb-muted)]">
            Upload a PDF textbook to get started.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-5 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            Upload PDF
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="group relative rounded-xl border border-white/10 bg-[#111a33] p-4 transition-colors hover:border-indigo-500/40"
            >
              <button
                type="button"
                onClick={() => router.push(`/dashboard/pdf-annotator/${doc.id}`)}
                className="block w-full text-left"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/20">
                  <FileText className="h-5 w-5 text-indigo-400" />
                </div>
                <p className="truncate text-sm font-semibold text-white" title={doc.name}>
                  {doc.name}
                </p>
                <p className="mt-1 text-xs text-[var(--sb-muted)]">
                  {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  {doc.file_size ? ` · ${formatBytes(doc.file_size)}` : ''}
                </p>
              </button>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/pdf-annotator/${doc.id}`)}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-lg p-1.5 text-[var(--sb-muted)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-400"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
