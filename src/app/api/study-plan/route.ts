import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStudyPlan } from '@/lib/ai/generateStudyPlan'
import { createStudyPlan, toggleStudyPlanTaskComplete } from '@/lib/supabase/mutations'
import { getStudyPlanTasks } from '@/lib/supabase/queries'

type PlanBody = {
  courses: Array<{ id: string; name: string }>
  exams: Array<{ courseId: string; date: string; priority: 'low' | 'medium' | 'high' }>
  hoursPerDay: number
  difficulty: Record<string, number>
  title?: string
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as PlanBody
  if (!body?.courses?.length) {
    return NextResponse.json({ error: 'Select at least one course' }, { status: 400 })
  }

  try {
    const aiPlan = await generateStudyPlan(
      body.courses.map((c) => c.name),
      body.exams.map((e) => ({
        course: body.courses.find((c) => c.id === e.courseId)?.name ?? 'Course',
        date: e.date,
        priority: e.priority,
      })),
      body.hoursPerDay,
      body.difficulty
    )

    const courseNameToId = new Map(body.courses.map((c) => [c.name.toLowerCase(), c.id] as const))
    const days = aiPlan.days.filter((d) => d.tasks.length > 0)
    const startDate = days[0]?.date ?? new Date().toISOString().slice(0, 10)
    const endDate = days[days.length - 1]?.date ?? startDate

    const result = await createStudyPlan(
      body.title ?? 'AI Smart Study Plan',
      startDate,
      endDate,
      days.flatMap((d) =>
        d.tasks.map((t) => ({
          date: d.date,
          courseId: courseNameToId.get(t.course.toLowerCase()) ?? null,
          topic: `${t.course}: ${t.topic}`,
          durationMinutes: Math.max(15, Math.round((t.duration || 1) * 60)),
          priority: t.priority,
        }))
      )
    )
    if (!result.success || !result.data?.id) {
      const err = result.success ? 'Failed to save plan' : result.error
      return NextResponse.json({ error: err }, { status: 500 })
    }

    const tasks = await getStudyPlanTasks(result.data.id)
    return NextResponse.json({
      planId: result.data.id,
      tasks,
      generated: aiPlan,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to generate study plan' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json()) as { taskId?: string; completed?: boolean }
  if (!body.taskId || typeof body.completed !== 'boolean') {
    return NextResponse.json({ error: 'taskId and completed are required' }, { status: 400 })
  }

  const result = await toggleStudyPlanTaskComplete(body.taskId, body.completed)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}

