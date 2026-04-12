'use client'

import { useMemo, useState } from 'react'
import type { Course, StudyPlanTask } from '@/types/database.types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlanWizard } from '@/components/study-planner/PlanWizard'
import { PlanCalendar } from '@/components/study-planner/PlanCalendar'
import { useCourses } from '@/hooks/useCourses'

export function StudyPlannerWorkspace({
  courses,
  initialTasks,
}: {
  courses: Course[]
  initialTasks: StudyPlanTask[]
}) {
  const { courses: liveCourses } = useCourses()
  const plannerCourses = liveCourses.length > 0 ? liveCourses : courses
  const [activeTab, setActiveTab] = useState('wizard')
  const [tasks, setTasks] = useState<StudyPlanTask[]>(initialTasks)
  const [updating, setUpdating] = useState(false)

  const completedCount = useMemo(() => tasks.filter((t) => t.completed).length, [tasks])

  async function toggleTask(taskId: string, completed: boolean) {
    const previous = tasks
    setTasks((curr) => curr.map((t) => (t.id === taskId ? { ...t, completed } : t)))
    setUpdating(true)
    const res = await fetch('/api/study-plan', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId, completed }),
    })
    setUpdating(false)
    if (!res.ok) setTasks(previous)
  }

  async function handleFellBehind() {
    const incomplete = tasks.filter((t) => !t.completed)
    if (incomplete.length === 0) return
    const today = new Date().toISOString().slice(0, 10)
    const redistributed = incomplete.map((t, i) => {
      const d = new Date(`${today}T00:00:00`)
      d.setDate(d.getDate() + Math.floor(i / 2))
      return { ...t, date: d.toISOString().slice(0, 10) }
    })
    setTasks((curr) => curr.map((t) => redistributed.find((r) => r.id === t.id) ?? t))
  }

  function exportToGoogleCalendar() {
    const first = tasks[0]
    if (!first) return
    const details = tasks
      .slice(0, 15)
      .map((t) => `${t.date}: ${t.topic} (${Math.round(t.duration_minutes / 60)}h)`)
      .join('\n')
    const url = new URL('https://calendar.google.com/calendar/render')
    url.searchParams.set('action', 'TEMPLATE')
    url.searchParams.set('text', 'Smart Study Plan')
    url.searchParams.set('details', details)
    window.open(url.toString(), '_blank')
  }

  return (
    <Card className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="wizard">Setup Wizard</TabsTrigger>
            <TabsTrigger value="calendar">Plan Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-3 py-1 text-xs text-[var(--sb-muted)]">
            {completedCount}/{tasks.length} tasks complete
          </span>
          <Button variant="secondary" onClick={handleFellBehind}>
            I fell behind
          </Button>
          <Button variant="secondary" onClick={exportToGoogleCalendar}>
            Export to Google Calendar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="wizard">
          <PlanWizard
            courses={plannerCourses}
            onPlanGenerated={(nextTasks) => {
              setTasks(nextTasks)
              setActiveTab('calendar')
            }}
          />
        </TabsContent>
        <TabsContent value="calendar">
          <PlanCalendar tasks={tasks} courses={plannerCourses} onToggleTask={toggleTask} />
          {updating && <p className="mt-2 text-xs text-[var(--sb-muted)]">Saving progress...</p>}
        </TabsContent>
      </Tabs>
    </Card>
  )
}

