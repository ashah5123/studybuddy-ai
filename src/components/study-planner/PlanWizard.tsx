'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Course, StudyPlanTask } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'

type Priority = 'low' | 'medium' | 'high'

type ExamRow = { courseId: string; date: string; priority: Priority }

const steps = [
  'Select courses',
  'Exam dates + priorities',
  'Hours per day',
  'Difficulty',
  'Generate',
]

export function PlanWizard({
  courses,
  onPlanGenerated,
}: {
  courses: Course[]
  onPlanGenerated: (tasks: StudyPlanTask[]) => void
}) {
  const [step, setStep] = useState(0)
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [exams, setExams] = useState<ExamRow[]>([])
  const [hoursPerDay, setHoursPerDay] = useState(2)
  const [difficulty, setDifficulty] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedCourses = useMemo(
    () => courses.filter((c) => selectedCourseIds.includes(c.id)),
    [courses, selectedCourseIds]
  )

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: selectedCourses.map((c) => ({ id: c.id, name: c.name })),
          exams,
          hoursPerDay,
          difficulty: Object.fromEntries(selectedCourses.map((c) => [c.name, difficulty[c.id] ?? 3])),
        }),
      })
      const data = (await res.json()) as { error?: string; tasks?: StudyPlanTask[] }
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate study plan')
      onPlanGenerated(data.tasks ?? [])
      setStep(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <Badge
            key={label}
            className={i === step ? 'border-indigo-400/40 bg-indigo-500/20 text-indigo-100' : ''}
          >
            {i + 1}. {label}
          </Badge>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">Choose courses for this plan</p>
          {courses.length === 0 && (
            <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 p-3 text-sm text-amber-100">
              No courses found yet. Create at least one course first, then come back to generate a study
              plan.
              <div className="mt-2">
                <Link
                  href="/dashboard/courses"
                  className="inline-flex rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
                >
                  Go to Courses
                </Link>
              </div>
            </div>
          )}
          {courses.map((course) => {
            const checked = selectedCourseIds.includes(course.id)
            return (
              <label
                key={course.id}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <span className="text-sm text-[var(--foreground)]">
                  {course.emoji} {course.name}
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedCourseIds((prev) => [...prev, course.id])
                    else setSelectedCourseIds((prev) => prev.filter((id) => id !== course.id))
                  }}
                />
              </label>
            )
          })}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          {selectedCourses.map((course) => {
            const existing = exams.find((x) => x.courseId === course.id)
            return (
              <div key={course.id} className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-3">
                <p className="self-center text-sm text-[var(--foreground)]">
                  {course.emoji} {course.name}
                </p>
                <Calendar
                  selected={existing?.date ? new Date(`${existing.date}T00:00:00`) : undefined}
                  onSelect={(date) => {
                    setExams((prev) => {
                      const filtered = prev.filter((x) => x.courseId !== course.id)
                      return [
                        ...filtered,
                        { courseId: course.id, date: format(date, 'yyyy-MM-dd'), priority: existing?.priority ?? 'medium' },
                      ]
                    })
                  }}
                />
                <select
                  className="sb-input"
                  value={existing?.priority ?? 'medium'}
                  onChange={(e) => {
                    const next = e.target.value as Priority
                    setExams((prev) => {
                      const old = prev.find((x) => x.courseId === course.id)
                      const filtered = prev.filter((x) => x.courseId !== course.id)
                      return [...filtered, { courseId: course.id, date: old?.date ?? format(new Date(), 'yyyy-MM-dd'), priority: next }]
                    })
                  }}
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </select>
              </div>
            )
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--foreground)]">How many hours can you study daily?</p>
          <Input
            type="number"
            min={1}
            max={8}
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Math.max(1, Math.min(8, Number(e.target.value || 1))))}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--foreground)]">Rate course difficulty (1-5)</p>
          {selectedCourses.map((course) => (
            <div key={course.id} className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_120px]">
              <label className="text-sm text-[var(--foreground)]">
                {course.emoji} {course.name}
              </label>
              <Input
                type="number"
                min={1}
                max={5}
                value={difficulty[course.id] ?? 3}
                onChange={(e) =>
                  setDifficulty((prev) => ({
                    ...prev,
                    [course.id]: Math.max(1, Math.min(5, Number(e.target.value || 3))),
                  }))
                }
              />
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
          Study plan generated successfully. Review it in the calendar tab.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <Button variant="secondary" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => Math.min(4, s + 1))} disabled={loading || (step === 0 && selectedCourseIds.length === 0)}>
            Next
          </Button>
        ) : (
          <Button onClick={() => void generate()} disabled={loading || selectedCourseIds.length === 0}>
            {loading ? 'Generating...' : 'Generate AI Study Plan'}
          </Button>
        )}
      </div>
    </Card>
  )
}

