import type { StudyPlanTask } from '@/types/database.types'

function canNotify() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestStudyReminderPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!canNotify()) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export function notifyUpcomingStudyTask(task: StudyPlanTask) {
  if (!canNotify() || Notification.permission !== 'granted') return
  new Notification('Study reminder', {
    body: `You have ${task.topic} in 1 hour!`,
    tag: `study-${task.id}`,
  })
}

export function notifyDailySummary(tasks: StudyPlanTask[]) {
  if (!canNotify() || Notification.permission !== 'granted') return
  const today = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter((t) => t.date === today)
  if (todayTasks.length === 0) return
  const mins = todayTasks.reduce((sum, t) => sum + t.duration_minutes, 0)
  new Notification('Today study summary', {
    body: `You have ${todayTasks.length} task(s) today, about ${Math.round(mins / 60)} hour(s).`,
    tag: 'study-daily-summary',
  })
}

