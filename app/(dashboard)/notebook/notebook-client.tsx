'use client'

import { useState, useMemo, useTransition } from 'react'
import { cn } from '@/lib/utils'
import type { Question, Quiz } from '@/lib/types'
import { deleteQuestion } from './actions'

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

const SUBJECTS = ['All', 'Math', 'Science', 'Coding', 'History', 'English', 'Other'] as const
type SubjectFilter = (typeof SUBJECTS)[number]

const SUBJECT_BADGE: Record<string, string> = {
  math: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  science: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  coding: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  history: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  english: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function scoreLabel(score: number): string {
  const pct = Math.round((score / 3) * 100)
  return `${pct}%`
}

function scoreColor(score: number): string {
  const pct = (score / 3) * 100
  if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20'
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
}

// ────────────────────────────────────────────────────────────
// Question card
// ────────────────────────────────────────────────────────────

function QuestionCard({
  question,
  quiz,
  onDelete,
}: {
  question: Question
  quiz: Quiz | undefined
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [, startTransition] = useTransition()

  const badgeClass = SUBJECT_BADGE[question.subject?.toLowerCase() ?? ''] ?? SUBJECT_BADGE.other

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    startTransition(async () => {
      await deleteQuestion(question.id)
      onDelete(question.id)
    })
  }

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl border shadow-sm transition-all',
      deleting ? 'opacity-50 pointer-events-none' : 'border-gray-100 dark:border-gray-700'
    )}>
      {/* Card header */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          {/* Subject badge */}
          <span className={cn('flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize mt-0.5', badgeClass)}>
            {question.subject}
          </span>

          {/* Question text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
              {question.question_text}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {formatDate(question.created_at)}
              {question.has_image && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Image attached
                </span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {quiz?.score !== undefined && quiz.score !== null && (
              <span className={cn('text-xs font-bold px-2 py-1 rounded-lg', scoreColor(quiz.score))}>
                Quiz: {scoreLabel(quiz.score)}
              </span>
            )}

            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              {expanded ? 'Collapse' : 'Expand'}
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg transition-colors"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                aria-label="Delete question"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded: full AI explanation */}
      {expanded && question.ai_response && (
        <div className="px-4 sm:px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
          <div className="pt-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Explanation
            </p>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {question.ai_response}
            </div>
          </div>
        </div>
      )}

      {expanded && !question.ai_response && (
        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No explanation saved.</p>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────

interface Props {
  questions: Question[]
  quizzes: Quiz[]
}

export default function NotebookClient({ questions: initialQuestions, quizzes }: Props) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [search, setSearch] = useState('')
  const [activeSubject, setActiveSubject] = useState<SubjectFilter>('All')
  const [page, setPage] = useState(1)

  const quizByQuestionId = useMemo(() => {
    const map: Record<string, Quiz> = {}
    for (const q of quizzes) {
      if (!map[q.question_id] || (q.score !== null && map[q.question_id].score === null)) {
        map[q.question_id] = q
      }
    }
    return map
  }, [quizzes])

  const filtered = useMemo(() => {
    let result = questions
    if (activeSubject !== 'All') {
      result = result.filter(
        (q) => q.subject?.toLowerCase() === activeSubject.toLowerCase()
      )
    }
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter((q) => q.question_text.toLowerCase().includes(term))
    }
    return result
  }, [questions, activeSubject, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePagee = Math.min(page, totalPages)
  const paginated = filtered.slice((safePagee - 1) * PAGE_SIZE, safePagee * PAGE_SIZE)

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const handleSearchChange = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleSubjectChange = (s: SubjectFilter) => {
    setActiveSubject(s)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Notebook</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
            {questions.length} question{questions.length !== 1 ? 's' : ''} saved
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-400">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search questions…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Subject filter tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SUBJECTS.map((subject) => (
          <button
            key={subject}
            onClick={() => handleSubjectChange(subject)}
            className={cn(
              'flex-shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-colors',
              activeSubject === subject
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
            )}
          >
            {subject}
            {subject !== 'All' && (
              <span className="ml-1.5 opacity-60">
                {questions.filter((q) => q.subject?.toLowerCase() === subject.toLowerCase()).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Results info ── */}
      {(search || activeSubject !== 'All') && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Showing {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {search && <> for &ldquo;<span className="font-medium text-gray-600 dark:text-gray-300">{search}</span>&rdquo;</>}
          {activeSubject !== 'All' && <> in <span className="font-medium text-gray-600 dark:text-gray-300">{activeSubject}</span></>}
        </p>
      )}

      {/* ── Question cards ── */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8 text-gray-400">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">Your notebook is empty</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
            Every question you ask is automatically saved here with its full explanation.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3">
            <circle cx="11" cy="11" r="8" strokeLinecap="round" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No questions match your search</p>
          <button
            onClick={() => { handleSearchChange(''); handleSubjectChange('All') }}
            className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              quiz={quizByQuestionId[q.id]}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && filtered.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Page {safePagee} of {totalPages} &mdash; {filtered.length} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={safePagee === 1}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="First page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePagee === 1}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(safePagee - 2, totalPages - 4))
              const pageNum = start + i
              if (pageNum > totalPages) return null
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                    pageNum === safePagee
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePagee === totalPages}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePagee === totalPages}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Last page"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
