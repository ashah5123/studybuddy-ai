'use client'

import { useCallback, useRef, useState } from 'react'
import { ImagePlus, Loader2, Send, Sparkles, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Msg =
  | { role: 'assistant'; content: string }
  | { role: 'user'; content: string; images?: string[] }

const MAX_PENDING_IMAGES = 5
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp'

export function AIChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const readFilesAsDataUrls = useCallback((files: FileList | null) => {
    if (!files?.length) return
    const cap = MAX_PENDING_IMAGES - pendingImages.length
    const list = Array.from(files).slice(0, Math.max(0, cap))
    if (list.length === 0) return

    let remaining = list.length
    for (const file of list) {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : ''
        if (dataUrl) {
          setPendingImages((prev) => {
            if (prev.length >= MAX_PENDING_IMAGES) return prev
            return [...prev, dataUrl].slice(0, MAX_PENDING_IMAGES)
          })
        }
        remaining -= 1
        if (remaining === 0) setTimeout(scrollToBottom, 50)
      }
      reader.readAsDataURL(file)
    }
  }, [pendingImages.length, scrollToBottom])

  function removePendingAt(i: number) {
    setPendingImages((prev) => prev.filter((_, j) => j !== i))
  }

  function serializeForApi(history: Msg[]) {
    return history.map((m) => {
      if (m.role === 'assistant') {
        return { role: 'assistant' as const, content: m.content }
      }
      if (m.images?.length) {
        return { role: 'user' as const, content: m.content, images: m.images }
      }
      return { role: 'user' as const, content: m.content }
    })
  }

  async function send() {
    const text = input.trim()
    const imgs = [...pendingImages]
    if ((!text && imgs.length === 0) || loading) return

    setError(null)
    const userContent =
      text || 'Answer based on the image(s).'
    const nextUser: Msg =
      imgs.length > 0 ? { role: 'user', content: userContent, images: imgs } : { role: 'user', content: text }
    const history = [...messages, nextUser]
    setMessages(history)
    setInput('')
    setPendingImages([])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: serializeForApi(history),
        }),
      })
      const data = (await res.json()) as { message?: string; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Request failed')
        return
      }
      if (data.message) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message! }])
      }
      setTimeout(scrollToBottom, 50)
    } catch {
      setError('Network error — check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const canSend =
    !loading && (input.trim().length > 0 || pendingImages.length > 0)

  return (
    <div className="sb-panel flex max-h-[min(70vh,640px)] min-h-[420px] flex-col overflow-hidden">
      <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-5">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <Sparkles className="h-6 w-6" />
              </span>
              <p className="max-w-sm text-sm leading-relaxed text-slate-600">
                Ask anything — or attach a photo of a problem, diagram, or notes. The tutor answers from
                what you type and what it sees in your images.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm sm:max-w-[85%] ${
                  m.role === 'user'
                    ? 'rounded-br-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                    : 'rounded-bl-md border border-slate-100 bg-slate-50 text-slate-900'
                }`}
              >
                {m.role === 'user' && m.images && m.images.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {m.images.map((src, j) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={j}
                        src={src}
                        alt=""
                        className="max-h-36 max-w-[min(100%,200px)] rounded-lg border border-white/30 object-contain"
                      />
                    ))}
                  </div>
                )}
                {m.role === 'assistant' ? (
                  <div className="prose prose-slate prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-slate-900 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-pre:overflow-x-auto prose-pre:rounded-lg prose-pre:bg-slate-900 prose-pre:text-slate-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                Thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-1 rounded-xl border border-red-200/90 bg-red-50 px-3.5 py-2.5 text-sm text-red-800">
          {error}
        </div>
      )}

      {pendingImages.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/80 px-3 py-2 sm:px-4">
          {pendingImages.map((src, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
              />
              <button
                type="button"
                onClick={() => removePendingAt(i)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-slate-700"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            readFilesAsDataUrls(e.target.files)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || pendingImages.length >= MAX_PENDING_IMAGES}
          className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/80 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Attach images"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send()
            }
          }}
          placeholder="Ask a question or describe what you need…"
          rows={2}
          className="sb-input flex-1 resize-none"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20 transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Send"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  )
}
