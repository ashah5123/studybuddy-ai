'use client'

import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { QuizQuestion } from '@/types/database.types'
import { Button } from '@/components/ui/button'

export function QuizResults({
  questions,
  answers,
  onRetry,
  onCreateFlashcards,
}: {
  questions: QuizQuestion[]
  answers: Record<string, string>
  onRetry: () => void
  onCreateFlashcards: () => void
}) {
  const rows = questions.map((q) => {
    const user = answers[q.id] ?? ''
    const isCorrect = user.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()
    return { q, user, isCorrect }
  })
  const correct = rows.filter((r) => r.isCorrect).length
  const total = Math.max(1, rows.length)
  const pct = Math.round((correct / total) * 100)
  const weakTypes = rows
    .filter((r) => !r.isCorrect)
    .reduce<Record<string, number>>((acc, r) => {
      acc[r.q.type] = (acc[r.q.type] ?? 0) + 1
      return acc
    }, {})

  return (
    <div className="space-y-4">
      <div className="sb-panel grid gap-4 p-5 sm:grid-cols-[1fr_220px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sb-muted)]">Score</p>
          <h2 className="mt-1 text-3xl font-bold text-[var(--foreground)]">
            {correct}/{total} ({pct}%)
          </h2>
          <p className="mt-2 text-sm text-[var(--sb-muted)]">
            Weak topics: {Object.keys(weakTypes).length ? Object.keys(weakTypes).join(', ') : 'None'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onRetry}>
              Retry Quiz
            </Button>
            <Button onClick={onCreateFlashcards}>Create Flashcards from Missed Questions</Button>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={[{ name: 'Correct', value: correct }, { name: 'Incorrect', value: total - correct }]} dataKey="value" innerRadius={38} outerRadius={62}>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.q.id} className="sb-panel p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">{row.q.question_text}</p>
            <p className="mt-1 text-xs text-[var(--sb-muted)]">Your answer: {row.user || '(blank)'}</p>
            <p className={`mt-1 text-xs ${row.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
              {row.isCorrect ? 'Correct' : `Incorrect · Correct: ${row.q.correct_answer}`}
            </p>
            {row.q.explanation && <p className="mt-2 text-xs text-[var(--sb-muted)]">{row.q.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

