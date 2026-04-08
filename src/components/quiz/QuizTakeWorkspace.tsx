'use client'

import { useEffect, useState, useRef } from 'react'
import type { Quiz, QuizQuestion } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { QuestionCard } from '@/components/quiz/QuestionCard'
import { QuizResults } from '@/components/quiz/QuizResults'

function storageKey(quizId: string) {
  return `quiz-progress:${quizId}`
}

export function QuizTakeWorkspace({
  quiz,
  questions,
}: {
  quiz: Quiz
  questions: QuizQuestion[]
}) {
  const initialProgress = (() => {
    if (typeof window === 'undefined') return { answers: {} as Record<string, string>, index: 0 }
    try {
      const raw = window.localStorage.getItem(storageKey(quiz.id))
      if (!raw) return { answers: {} as Record<string, string>, index: 0 }
      const parsed = JSON.parse(raw) as { answers?: Record<string, string>; index?: number }
      return {
        answers: parsed.answers ?? {},
        index:
          typeof parsed.index === 'number'
            ? Math.max(0, Math.min(questions.length - 1, parsed.index))
            : 0,
      }
    } catch {
      return { answers: {} as Record<string, string>, index: 0 }
    }
  })()

  const [index, setIndex] = useState(initialProgress.index)
  const [answers, setAnswers] = useState<Record<string, string>>(initialProgress.answers)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const startedAtRef = useRef<number>(0)

  const q = questions[index]
  const progress = `${Math.min(index + 1, questions.length)} of ${questions.length}`

  useEffect(() => {
    if (startedAtRef.current === 0) startedAtRef.current = Date.now()
  }, [])

  useEffect(() => {
    localStorage.setItem(storageKey(quiz.id), JSON.stringify({ answers, index }))
  }, [answers, index, quiz.id])

  async function submitQuiz() {
    setSaving(true)
    const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000)
    await fetch('/api/quiz-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: quiz.id,
        timeTakenSeconds: elapsed,
        answers: questions.map((question) => ({
          questionId: question.id,
          answer: answers[question.id] ?? '',
        })),
      }),
    })
    setSaving(false)
    setSubmitted(true)
    localStorage.removeItem(storageKey(quiz.id))
  }

  if (questions.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-[var(--sb-muted)]">
        No questions found for this quiz.
      </div>
    )
  }

  if (submitted) {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        onRetry={() => {
          setSubmitted(false)
          setIndex(0)
          setAnswers({})
        }}
        onCreateFlashcards={async () => {
          await fetch('/api/quiz-to-flashcards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizId: quiz.id,
              deckName: `${quiz.title} — Missed Review`,
              onlyMissed: true,
            }),
          })
          window.location.href = '/dashboard/flashcards'
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sb-muted)]">Progress</p>
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Question {progress}
          </h2>
        </div>
        <Button variant="secondary" onClick={() => void submitQuiz()} disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Quiz'}
        </Button>
      </div>

      <QuestionCard
        question={q}
        answer={answers[q.id] ?? ''}
        onAnswerChange={(value) =>
          setAnswers((prev) => ({
            ...prev,
            [q.id]: value,
          }))
        }
      />

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="secondary"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          Previous
        </Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next Question
          </Button>
        ) : (
          <Button onClick={() => void submitQuiz()} disabled={saving}>
            {saving ? 'Submitting...' : 'Finish Quiz'}
          </Button>
        )}
      </div>
    </div>
  )
}

