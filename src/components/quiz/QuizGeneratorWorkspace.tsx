'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Loader2 } from 'lucide-react'
import type { Course } from '@/types/database.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'

type GeneratedQ = {
  type: string
  question: string
  options?: string[]
  correct_answer: string
  explanation: string
}

export function QuizGeneratorWorkspace({ courses }: { courses: Course[] }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('Auto Quiz')
  const [courseId, setCourseId] = useState('')
  const [questionCount, setQuestionCount] = useState<'5' | '10' | '20' | '50'>('10')
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'true_false' | 'short_answer' | 'all'>('all')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [fileName, setFileName] = useState('')
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [loadingUpload, setLoadingUpload] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string | null>(null)
  const [questions, setQuestions] = useState<GeneratedQ[]>([])
  const [onlyMissedForCards, setOnlyMissedForCards] = useState(true)

  async function handleFile(file: File) {
    setError(null)
    setLoadingUpload(true)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch('/api/upload-notes', { method: 'POST', body: fd })
      const data = (await res.json()) as { error?: string; fileUrl?: string; fileName?: string; text?: string }
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setFileName(data.fileName ?? file.name)
      setFileUrl(data.fileUrl ?? null)
      setNoteText(data.text ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setLoadingUpload(false)
    }
  }

  async function generateQuiz() {
    if (!noteText.trim()) return
    setLoadingGenerate(true)
    setError(null)
    try {
      const res = await fetch('/api/quiz-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          sourceFileUrl: fileUrl,
          courseId: courseId || null,
          noteText,
          options: {
            questionCount: Number(questionCount),
            questionType,
            difficulty,
          },
        }),
      })
      const data = (await res.json()) as { error?: string; quizId?: string; questions?: GeneratedQ[] }
      if (!res.ok) throw new Error(data.error ?? 'Quiz generation failed')
      setQuizId(data.quizId ?? null)
      setQuestions(data.questions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quiz generation failed')
    } finally {
      setLoadingGenerate(false)
    }
  }

  async function saveFlashcards() {
    if (!quizId) return
    setError(null)
    const res = await fetch('/api/quiz-to-flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId,
        deckName: `${title} — Review`,
        onlyMissed: onlyMissedForCards,
      }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) setError(data.error ?? 'Failed to create flashcards')
    else router.push('/dashboard/flashcards')
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Upload Notes</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files?.[0]
            if (file) void handleFile(file)
          }}
          onDragOver={(e) => e.preventDefault()}
          className="flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-10 text-center hover:bg-white/10"
        >
          {loadingUpload ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--sb-muted)]" />
          ) : (
            <Upload className="h-5 w-5 text-[var(--sb-muted)]" />
          )}
          <p className="mt-2 text-sm text-[var(--foreground)]">Drag and drop notes, or click to browse</p>
          <p className="mt-1 text-xs text-[var(--sb-muted)]">Accepted: PDF, TXT, DOCX, MD (max 10MB)</p>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.docx,.md,.markdown,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/markdown"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
          }}
        />
        {fileName && <p className="text-xs text-[var(--sb-muted)]">Uploaded: {fileName}</p>}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Quiz Options</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Quiz title" />
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="sb-input">
            <option value="">Select course (optional)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--sb-muted)]">
              Number of questions
            </p>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(e.target.value as '5' | '10' | '20' | '50')}
              className="sb-input"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--sb-muted)]">
              Question type
            </p>
            <select
              value={questionType}
              onChange={(e) =>
                setQuestionType(
                  e.target.value as 'multiple_choice' | 'true_false' | 'short_answer' | 'all'
                )
              }
              className="sb-input"
            >
              <option value="all">All</option>
              <option value="multiple_choice">Multiple choice</option>
              <option value="true_false">True/False</option>
              <option value="short_answer">Short answer</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--sb-muted)]">
              Difficulty
            </p>
            <RadioGroup value={difficulty} onValueChange={(v) => setDifficulty(v as 'easy' | 'medium' | 'hard')} className="grid grid-cols-3 gap-2">
              <RadioGroupItem value="easy" label="Easy" />
              <RadioGroupItem value="medium" label="Medium" />
              <RadioGroupItem value="hard" label="Hard" />
            </RadioGroup>
          </div>
        </div>

        <Button onClick={() => void generateQuiz()} disabled={loadingGenerate || !noteText.trim()}>
          {loadingGenerate ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Generate Quiz
        </Button>
      </Card>

      {noteText && (
        <Card className="space-y-2 p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Extracted Preview</h3>
          <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-[var(--sb-muted)]">
            {noteText.slice(0, 2000)}
            {noteText.length > 2000 ? '\n\n...truncated preview...' : ''}
          </pre>
        </Card>
      )}

      {questions.length > 0 && (
        <Card className="space-y-4 p-5">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">Generated Quiz</h3>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={`${q.question}-${i}`} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {i + 1}. {q.question}
                </p>
                <p className="mt-1 text-xs text-[var(--sb-muted)]">Type: {q.type}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-[var(--sb-muted)]">
              <Checkbox checked={onlyMissedForCards} onCheckedChange={setOnlyMissedForCards} />
              Create flashcards from missed questions only
            </label>
            <Button variant="secondary" onClick={() => void saveFlashcards()} disabled={!quizId}>
              Save as flashcard deck
            </Button>
            <Button onClick={() => quizId && router.push(`/dashboard/quiz-generator/take/${quizId}`)} disabled={!quizId}>
              Take quiz now
            </Button>
          </div>
        </Card>
      )}

      {error && <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
    </div>
  )
}

