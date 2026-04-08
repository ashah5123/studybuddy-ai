'use client'

import { useMemo, useState } from 'react'
import { eachDayOfInterval, endOfMonth, format, isSameDay, startOfMonth } from 'date-fns'
import type { Course, StudyPlanTask } from '@/types/database.types'
import { Progress } from '@/components/ui/progress'
import { TaskCard } from '@/components/study-planner/TaskCard'

function isoDate(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function PlanCalendar({
  tasks,
  courses,
  onToggleTask,
}: {
  tasks: StudyPlanTask[]
  courses: Course[]
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>
}) {
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date())
  const now = new Date()
  const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })
  const tasksByDate = useMemo(() => {
    const map = new Map<string, StudyPlanTask[]>()
    for (const task of tasks) {
      const arr = map.get(task.date) ?? []
      arr.push(task)
      map.set(task.date, arr)
    }
    return map
  }, [tasks])

  const selectedTasks = tasksByDate.get(isoDate(selectedDay)) ?? []
  const completed = tasks.filter((t) => t.completed).length
  const completionPct = tasks.length ? (completed / tasks.length) * 100 : 0
  const courseMap = new Map(courses.map((c) => [c.id, c]))

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="sb-panel p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">{format(now, 'MMMM yyyy')}</h3>
          <span className="text-xs text-[var(--sb-muted)]">{tasks.length} tasks</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const date = isoDate(d)
            const dayTasks = tasksByDate.get(date) ?? []
            const isSelected = isSameDay(d, selectedDay)
            return (
              <button
                type="button"
                key={date}
                onClick={() => setSelectedDay(d)}
                className={`min-h-[74px] rounded-lg border p-2 text-left ${
                  isSelected ? 'border-indigo-400/60 bg-indigo-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="text-xs font-semibold text-[var(--foreground)]">{format(d, 'd')}</div>
                {dayTasks.slice(0, 2).map((t) => (
                  <div key={t.id} className="mt-1 truncate rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white">
                    {t.topic}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="mt-1 text-[10px] text-[var(--sb-muted)]">+{dayTasks.length - 2} more</div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="sb-panel p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">Progress</h3>
            <span className="text-xs text-[var(--sb-muted)]">{Math.round(completionPct)}%</span>
          </div>
          <Progress value={completionPct} />
        </div>
        <div className="sb-panel space-y-3 p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">
            {format(selectedDay, 'EEEE, MMM d')}
          </h3>
          {selectedTasks.length === 0 ? (
            <p className="text-xs text-[var(--sb-muted)]">No study tasks for this day.</p>
          ) : (
            selectedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                courseName={task.course_id ? courseMap.get(task.course_id)?.name : undefined}
                onToggle={(id, done) => void onToggleTask(id, done)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

