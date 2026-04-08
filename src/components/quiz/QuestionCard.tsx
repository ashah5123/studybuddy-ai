'use client'

import type { QuizQuestion } from '@/types/database.types'
import { Input } from '@/components/ui/input'

export function QuestionCard({
  question,
  answer,
  onAnswerChange,
  showFeedback,
  isCorrect,
}: {
  question: QuizQuestion
  answer: string
  onAnswerChange: (value: string) => void
  showFeedback?: boolean
  isCorrect?: boolean
}) {
  return (
    <div className="sb-panel space-y-4 p-5">
      <p className="text-sm font-semibold text-[var(--foreground)]">{question.question_text}</p>

      {question.type === 'multiple_choice' && (
        <div className="space-y-2">
          {question.options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={answer === option}
                onChange={() => onAnswerChange(option)}
              />
              <span className="text-sm text-[var(--foreground)]">{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="grid grid-cols-2 gap-2">
          {['True', 'False'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onAnswerChange(option)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                answer === option
                  ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-100'
                  : 'border-white/10 bg-white/5 text-[var(--foreground)]'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {question.type === 'short_answer' && (
        <Input value={answer} onChange={(e) => onAnswerChange(e.target.value)} placeholder="Type your answer..." />
      )}

      {showFeedback && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            isCorrect
              ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-400/30 bg-rose-500/10 text-rose-100'
          }`}
        >
          <p>
            {isCorrect ? 'Correct!' : `Incorrect. Correct answer: ${question.correct_answer}`}
          </p>
          {question.explanation && <p className="mt-1 text-xs opacity-90">{question.explanation}</p>}
        </div>
      )}
    </div>
  )
}

