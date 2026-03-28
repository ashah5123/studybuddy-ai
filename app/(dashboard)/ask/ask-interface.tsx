'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { submitQuiz } from '@/lib/supabase'
import type { User, Subject, QuizData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const SUBJECTS: Subject[] = ['Math', 'Science', 'Coding', 'History', 'English', 'Other']

const FREE_DAILY_LIMIT = 5

const SUBJECT_COLORS: Record<Subject, string> = {
  Math: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800',
  Science: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  Coding: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800',
  History: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800',
  English: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800',
  Other: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
}

const SUBJECT_ACTIVE: Record<Subject, string> = {
  Math: 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500',
  Science: 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500',
  Coding: 'bg-violet-600 text-white border-violet-600 dark:bg-violet-500',
  History: 'bg-amber-600 text-white border-amber-600 dark:bg-amber-500',
  English: 'bg-rose-600 text-white border-rose-600 dark:bg-rose-500',
  Other: 'bg-slate-700 text-white border-slate-700 dark:bg-slate-600',
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4 MB

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'loading'
  | 'answering'
  | 'complete'
  | 'quiz_loading'
  | 'quiz_ready'

type StreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; questionId: string }
  | { type: 'error'; message: string }

interface QuizState {
  data: QuizData
  quizId: string
  currentIndex: number
  selected: number[]
  revealed: boolean[]
  score: number | null
}

// ────────────────────────────────────────────────────────────
// Markdown renderer (no external deps)
// ────────────────────────────────────────────────────────────

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'ordered_list'; items: string[] }
  | { kind: 'unordered_list'; items: string[] }
  | { kind: 'code'; lang: string; code: string }
  | { kind: 'hr' }

function parseBlocks(raw: string): Block[] {
  const blocks: Block[] = []
  const parts = raw.split(/(```[\w]*\n[\s\S]*?\n```)/g)

  for (const part of parts) {
    const codeMatch = part.match(/^```(\w*)\n([\s\S]*?)\n```$/)
    if (codeMatch) {
      blocks.push({ kind: 'code', lang: codeMatch[1] || 'text', code: codeMatch[2] })
      continue
    }

    const lines = part.split('\n')
    let i = 0

    while (i < lines.length) {
      const line = lines[i]
      if (!line.trim()) { i++; continue }

      const headingMatch = line.match(/^(#{1,3}) (.+)$/)
      if (headingMatch) {
        blocks.push({ kind: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() })
        i++; continue
      }

      if (/^-{3,}$/.test(line.trim())) {
        blocks.push({ kind: 'hr' })
        i++; continue
      }

      if (/^\d+[.)]\s/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\d+[.)]\s/.test(lines[i])) {
          items.push(lines[i].replace(/^\d+[.)]\s+/, ''))
          i++
        }
        blocks.push({ kind: 'ordered_list', items })
        continue
      }

      if (/^[-*+]\s/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
          items.push(lines[i].replace(/^[-*+]\s+/, ''))
          i++
        }
        blocks.push({ kind: 'unordered_list', items })
        continue
      }

      const paraLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^#{1,3} /.test(lines[i]) &&
        !/^\d+[.)]\s/.test(lines[i]) &&
        !/^[-*+]\s/.test(lines[i]) &&
        !/^-{3,}$/.test(lines[i].trim())
      ) {
        paraLines.push(lines[i])
        i++
      }
      if (paraLines.length) blocks.push({ kind: 'paragraph', text: paraLines.join(' ') })
    }
  }

  return blocks
}

function InlineContent({ text }: { text: string }) {
  const tokens = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g)
  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**'))
          return <strong key={i} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>
        if (token.startsWith('*') && token.endsWith('*') && token.length > 2)
          return <em key={i}>{token.slice(1, -1)}</em>
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2)
          return <code key={i} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{token.slice(1, -1)}</code>
        return <span key={i}>{token}</span>
      })}
    </>
  )
}

function MarkdownContent({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text])

  return (
    <div className="space-y-4 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          const cls = block.level === 1
            ? 'text-lg font-bold text-foreground'
            : block.level === 2
              ? 'text-base font-semibold text-foreground'
              : 'text-sm font-semibold text-foreground'
          return <p key={i} className={cls}><InlineContent text={block.text} /></p>
        }

        if (block.kind === 'paragraph') {
          return (
            <p key={i} className="text-foreground/90">
              <InlineContent text={block.text} />
            </p>
          )
        }

        if (block.kind === 'ordered_list') {
          return (
            <ol key={i} className="space-y-3">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {j + 1}
                  </span>
                  <span className="pt-0.5 text-foreground/90">
                    <InlineContent text={item} />
                  </span>
                </li>
              ))}
            </ol>
          )
        }

        if (block.kind === 'unordered_list') {
          return (
            <ul key={i} className="space-y-2">
              {block.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span className="text-foreground/90">
                    <InlineContent text={item} />
                  </span>
                </li>
              ))}
            </ul>
          )
        }

        if (block.kind === 'code') {
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-border">
              {block.lang && block.lang !== 'text' && (
                <div className="flex items-center border-b border-border bg-muted px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">{block.lang}</span>
                </div>
              )}
              <pre className="overflow-x-auto bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-100 dark:bg-zinc-900">
                <code>{block.code}</code>
              </pre>
            </div>
          )
        }

        if (block.kind === 'hr') {
          return <hr key={i} className="border-border" />
        }

        return null
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Skeleton components
// ────────────────────────────────────────────────────────────

function AnswerSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-4 w-3/4 rounded-md bg-muted" />
      <div className="h-4 w-full rounded-md bg-muted" />
      <div className="h-4 w-5/6 rounded-md bg-muted" />
      <div className="h-4 w-2/3 rounded-md bg-muted" />
      <div className="mt-6 h-4 w-full rounded-md bg-muted" />
      <div className="h-4 w-4/5 rounded-md bg-muted" />
      <div className="h-4 w-3/5 rounded-md bg-muted" />
    </div>
  )
}

function QuizSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-5 w-2/3 rounded-md bg-muted" />
      <div className="space-y-2 pt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Quiz question component
// ────────────────────────────────────────────────────────────

function QuizQuestion({
  question,
  optionIndex,
  options,
  correctIndex,
  explanation,
  selected,
  revealed,
  onSelect,
}: {
  question: string
  optionIndex: number
  options: string[]
  correctIndex: number
  explanation?: string
  selected: number
  revealed: boolean
  onSelect: (i: number) => void
}) {
  const OPTION_LABELS = ['A', 'B', 'C', 'D']

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium leading-relaxed text-foreground">{question}</p>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i
          const isCorrect = i === correctIndex
          const showResult = revealed

          let cls = 'flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors'

          if (!showResult) {
            cls += isSelected
              ? ' border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
              : ' border-border bg-card hover:bg-muted/50 cursor-pointer'
          } else if (isCorrect) {
            cls += ' border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40'
          } else if (isSelected && !isCorrect) {
            cls += ' border-destructive bg-destructive/10'
          } else {
            cls += ' border-border bg-card opacity-60'
          }

          return (
            <button
              key={i}
              className={cls}
              onClick={() => !revealed && onSelect(i)}
              disabled={revealed}
            >
              <span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                showResult && isCorrect
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : showResult && isSelected && !isCorrect
                    ? 'border-destructive bg-destructive text-white'
                    : 'border-current'
              }`}>
                {showResult && isCorrect
                  ? '✓'
                  : showResult && isSelected && !isCorrect
                    ? '✗'
                    : OPTION_LABELS[i]}
              </span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>

      {revealed && explanation && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
          <span className="font-semibold">Why: </span>{explanation}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Upgrade modal
// ────────────────────────────────────────────────────────────

function UpgradeModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
            <svg className="size-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <DialogTitle>Daily limit reached</DialogTitle>
          <DialogDescription>
            Free accounts can ask up to {FREE_DAILY_LIMIT} questions per day. Upgrade to Pro for unlimited questions, photo upload, quiz generation, and more.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm">
          {[
            'Unlimited questions every day',
            'Photo upload for any homework',
            'Auto-generated quizzes',
            'Study streak tracking',
            'Full question history & search',
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-muted-foreground">
              <svg className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Maybe later
          </Button>
          <Link
            href="/billing"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Upgrade to Pro — $9/mo
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ────────────────────────────────────────────────────────────
// Main interface
// ────────────────────────────────────────────────────────────

export default function AskInterface({ user }: { user: User }) {
  const sessionIdRef = useRef(crypto.randomUUID())
  const answerRef = useRef('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [subject, setSubject] = useState<Subject>('Math')
  const [questionText, setQuestionText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [answer, setAnswer] = useState('')
  const [isCached, setIsCached] = useState(false)
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [questionId, setQuestionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const questionsRemaining =
    user.plan === 'free' ? Math.max(0, FREE_DAILY_LIMIT - user.questions_today) : null

  // ── Image handling ──────────────────────────────────────

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Only image files are supported.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 4 MB.')
      return
    }

    setError(null)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      setImageBase64(result.split(',')[1])
    }
  }, [])

  const clearImage = useCallback(() => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setImageBase64(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [imagePreview])

  // ── Quiz helpers ────────────────────────────────────────

  const fetchQuiz = useCallback(async (qId: string, answerText: string) => {
    setPhase('quiz_loading')
    try {
      const res = await fetch('/api/ask/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: qId,
          answer: answerText,
          subject,
          sessionId: sessionIdRef.current,
        }),
      })

      if (!res.ok) throw new Error('Quiz generation failed')

      const data = await res.json() as { quiz: QuizData; quizId: string }

      setQuiz({
        data: data.quiz,
        quizId: data.quizId,
        currentIndex: 0,
        selected: new Array(data.quiz.questions.length).fill(-1),
        revealed: new Array(data.quiz.questions.length).fill(false),
        score: null,
      })
      setPhase('quiz_ready')
    } catch {
      setPhase('complete')
    }
  }, [subject])

  // ── Submit ──────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!questionText.trim()) return
    if (phase !== 'idle' && phase !== 'complete' && phase !== 'quiz_ready') return

    if (user.plan === 'free' && user.questions_today >= FREE_DAILY_LIMIT) {
      setShowUpgradeModal(true)
      return
    }

    setPhase('loading')
    setError(null)
    setAnswer('')
    setIsCached(false)
    setSimilarity(null)
    setQuestionId(null)
    setQuiz(null)
    answerRef.current = ''

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          subject,
          imageBase64: imageBase64 ?? undefined,
          mimeType: imageFile?.type,
          sessionId: sessionIdRef.current,
        }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          setShowUpgradeModal(true)
          setPhase('idle')
          return
        }
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Something went wrong')
      }

      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        const data = await res.json() as {
          cached: boolean
          answer: string
          similarity: number
          questionId: string
        }
        setAnswer(data.answer)
        setIsCached(data.cached)
        setSimilarity(data.similarity)
        setQuestionId(data.questionId)
        setPhase('complete')
        await fetchQuiz(data.questionId, data.answer)
        return
      }

      // SSE stream
      setPhase('answering')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let finalQuestionId = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            try {
              const event = JSON.parse(raw) as StreamEvent

              if (event.type === 'chunk') {
                answerRef.current += event.text
                setAnswer(answerRef.current)
              } else if (event.type === 'done') {
                finalQuestionId = event.questionId
                setQuestionId(event.questionId)
                setPhase('complete')
              } else if (event.type === 'error') {
                throw new Error(event.message)
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue
              throw parseErr
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (finalQuestionId) {
        await fetchQuiz(finalQuestionId, answerRef.current)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setPhase('idle')
    }
  }, [questionText, subject, imageBase64, imageFile, phase, user, fetchQuiz])

  // ── Quiz interaction ────────────────────────────────────

  const handleQuizAnswer = useCallback((questionIndex: number, optionIndex: number) => {
    setQuiz((prev) => {
      if (!prev) return prev
      const selected = [...prev.selected]
      const revealed = [...prev.revealed]
      selected[questionIndex] = optionIndex
      revealed[questionIndex] = true
      return { ...prev, selected, revealed }
    })
  }, [])

  const handleNextQuizQuestion = useCallback(() => {
    setQuiz((prev) => {
      if (!prev) return prev
      return { ...prev, currentIndex: prev.currentIndex + 1 }
    })
  }, [])

  const handleFinishQuiz = useCallback(async () => {
    if (!quiz) return

    const correct = quiz.data.questions.reduce((acc, q, i) => {
      return acc + (quiz.selected[i] === q.correct_index ? 1 : 0)
    }, 0)

    setQuiz((prev) => prev ? { ...prev, score: correct } : prev)

    try {
      const db = createClient()
      await submitQuiz(db as never, quiz.quizId, correct)
    } catch {
      // Score save failure is non-fatal
    }
  }, [quiz])

  // ── Reset ───────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setPhase('idle')
    setAnswer('')
    setIsCached(false)
    setSimilarity(null)
    setQuestionId(null)
    setQuiz(null)
    setError(null)
    setQuestionText('')
    clearImage()
    answerRef.current = ''
  }, [clearImage])

  // ── Keyboard submit ─────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const isSubmitting = phase === 'loading' || phase === 'answering'
  const hasAnswer = phase === 'complete' || phase === 'quiz_loading' || phase === 'quiz_ready'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ask a question</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.plan === 'free' && questionsRemaining !== null
              ? questionsRemaining === 0
                ? 'Daily limit reached — '
                : `${questionsRemaining} of ${FREE_DAILY_LIMIT} questions remaining today · `}
            {user.streak > 0 && (
              <span>🔥 {user.streak}-day streak</span>
            )}
          </p>
        </div>
        {hasAnswer && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            New question
          </Button>
        )}
      </div>

      {/* Subject selector */}
      <div className="mb-5 flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => setSubject(s)}
            disabled={isSubmitting}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              subject === s ? SUBJECT_ACTIVE[s] : SUBJECT_COLORS[s] + ' hover:opacity-80'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input area */}
      {!hasAnswer && (
        <Card className="mb-6">
          <CardContent className="pt-4">
            {imagePreview && (
              <div className="relative mb-3 inline-block">
                <img
                  src={imagePreview}
                  alt="Homework photo"
                  className="max-h-48 rounded-lg border border-border object-contain"
                />
                <button
                  onClick={clearImage}
                  className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
                  aria-label="Remove image"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask a ${subject} question…`}
              rows={4}
              disabled={isSubmitting}
              className="w-full resize-none rounded-lg bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
            />

            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || user.plan === 'free'}
                title={user.plan === 'free' ? 'Photo upload requires Pro plan' : 'Upload homework photo'}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                {user.plan === 'free' ? 'Photo (Pro)' : imageFile ? imageFile.name.slice(0, 20) : 'Attach photo'}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">⌘ Enter to submit</span>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !questionText.trim()}
                  className="h-8 bg-indigo-600 px-4 text-white hover:bg-indigo-700"
                  size="sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="size-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {phase === 'loading' ? 'Checking…' : 'Answering…'}
                    </span>
                  ) : 'Ask →'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Answer section */}
      {(isSubmitting || hasAnswer) && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">
                {subject} explanation
              </CardTitle>
              {isCached && (
                <Badge variant="secondary" className="text-xs">
                  ✦ From your history
                  {similarity !== null && ` · ${Math.round(similarity * 100)}% match`}
                </Badge>
              )}
            </div>
            {hasAnswer && questionText && (
              <p className="text-sm text-muted-foreground">{questionText}</p>
            )}
          </CardHeader>
          <CardContent>
            {phase === 'loading' ? (
              <AnswerSkeleton />
            ) : (
              <div className="relative">
                <MarkdownContent text={answer} />
                {phase === 'answering' && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-indigo-500" />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz section */}
      {(phase === 'quiz_loading' || phase === 'quiz_ready') && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Quick check</CardTitle>
              {quiz && (
                <span className="text-xs text-muted-foreground">
                  {quiz.score !== null
                    ? `${quiz.score} / ${quiz.data.questions.length} correct`
                    : `Question ${quiz.currentIndex + 1} of ${quiz.data.questions.length}`}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Test your understanding of what you just learned.
            </p>
          </CardHeader>

          <CardContent>
            {phase === 'quiz_loading' && <QuizSkeleton />}

            {phase === 'quiz_ready' && quiz && (
              <>
                {quiz.score !== null ? (
                  // Score screen
                  <div className="space-y-4 text-center">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-muted">
                      <span className="text-3xl font-bold">
                        {quiz.score}/{quiz.data.questions.length}
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-semibold">
                        {quiz.score === quiz.data.questions.length
                          ? 'Perfect — you nailed it! 🎉'
                          : quiz.score >= 2
                            ? 'Almost there — one more review and you\'ve got it.'
                            : 'Keep at it — re-read the explanation and try again.'}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {Math.round((quiz.score / quiz.data.questions.length) * 100)}% accuracy
                      </p>
                    </div>
                    <Button onClick={handleReset} className="bg-indigo-600 text-white hover:bg-indigo-700">
                      Ask another question
                    </Button>
                  </div>
                ) : (
                  // Active quiz
                  <div className="space-y-6">
                    <QuizQuestion
                      question={quiz.data.questions[quiz.currentIndex].question}
                      optionIndex={quiz.currentIndex}
                      options={quiz.data.questions[quiz.currentIndex].options}
                      correctIndex={quiz.data.questions[quiz.currentIndex].correct_index}
                      explanation={quiz.data.questions[quiz.currentIndex].explanation}
                      selected={quiz.selected[quiz.currentIndex]}
                      revealed={quiz.revealed[quiz.currentIndex]}
                      onSelect={(i) => handleQuizAnswer(quiz.currentIndex, i)}
                    />

                    {quiz.revealed[quiz.currentIndex] && (
                      <div className="flex justify-end">
                        {quiz.currentIndex < quiz.data.questions.length - 1 ? (
                          <Button
                            onClick={handleNextQuizQuestion}
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                            size="sm"
                          >
                            Next question →
                          </Button>
                        ) : (
                          <Button
                            onClick={handleFinishQuiz}
                            className="bg-indigo-600 text-white hover:bg-indigo-700"
                            size="sm"
                          >
                            See my score
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upgrade modal */}
      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  )
}
