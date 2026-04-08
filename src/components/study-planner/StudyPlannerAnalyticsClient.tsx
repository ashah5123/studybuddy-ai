'use client'

import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Course, StudyPlanTask } from '@/types/database.types'
import { Card } from '@/components/ui/card'

export function StudyPlannerAnalyticsClient({
  tasks,
  courses,
}: {
  tasks: StudyPlanTask[]
  courses: Course[]
}) {
  const completionPct = tasks.length ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0
  const weekHours = tasks
    .filter((t) => {
      const d = new Date(`${t.date}T00:00:00`)
      const today = new Date()
      const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 7
    })
    .reduce((sum, t) => sum + t.duration_minutes, 0) / 60

  const byCourse = useMemo(() => {
    const courseMap = new Map(courses.map((c) => [c.id, c.name]))
    const map = new Map<string, number>()
    for (const task of tasks) {
      const key = task.course_id ? courseMap.get(task.course_id) ?? 'Unknown' : 'General'
      map.set(key, (map.get(key) ?? 0) + task.duration_minutes / 60)
    }
    return Array.from(map.entries()).map(([course, hours]) => ({ course, hours: Math.round(hours * 10) / 10 }))
  }, [tasks, courses])

  const mostStudied = [...byCourse].sort((a, b) => b.hours - a.hours)[0]?.course ?? 'N/A'
  const leastStudied = [...byCourse].sort((a, b) => a.hours - b.hours)[0]?.course ?? 'N/A'

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">Insights</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Study Planner Analytics
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-[var(--sb-muted)]">Adherence</p><p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{completionPct}%</p></Card>
        <Card className="p-4"><p className="text-xs text-[var(--sb-muted)]">Hours this week</p><p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{weekHours.toFixed(1)}</p></Card>
        <Card className="p-4"><p className="text-xs text-[var(--sb-muted)]">Most studied</p><p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{mostStudied}</p></Card>
        <Card className="p-4"><p className="text-xs text-[var(--sb-muted)]">Least studied</p><p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{leastStudied}</p></Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Hours by course</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byCourse}>
              <XAxis dataKey="course" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">AI Insight</h3>
        <p className="mt-2 text-sm text-[var(--sb-muted)]">
          You study best in the evening when you complete tasks with medium/high priority first. Keep short daily sessions and protect consistency to maintain your streak.
        </p>
      </Card>
    </div>
  )
}

