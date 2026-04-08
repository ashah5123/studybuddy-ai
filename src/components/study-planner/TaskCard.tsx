'use client'

import { Badge } from '@/components/ui/badge'
import type { StudyPlanTask } from '@/types/database.types'

export function TaskCard({
  task,
  courseName,
  onToggle,
}: {
  task: StudyPlanTask
  courseName?: string
  onToggle?: (taskId: string, completed: boolean) => void
}) {
  const priorityClass =
    task.priority === 'high'
      ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'
      : task.priority === 'low'
        ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
        : 'border-amber-300/30 bg-amber-500/15 text-amber-200'

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {courseName ? `${courseName}: ` : ''}
            {task.topic}
          </p>
          <p className="mt-0.5 text-xs text-[var(--sb-muted)]">
            {Math.round(task.duration_minutes / 60)} hr {task.duration_minutes % 60} min
          </p>
        </div>
        <Badge className={priorityClass}>{task.priority}</Badge>
      </div>

      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs text-[var(--sb-muted)]">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(e) => onToggle?.(task.id, e.target.checked)}
          className="h-3.5 w-3.5 rounded border-white/20 bg-white/5"
        />
        Mark complete
      </label>
    </div>
  )
}

