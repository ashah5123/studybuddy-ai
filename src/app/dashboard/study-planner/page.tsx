import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourses, getStudyPlans, getStudyPlanTasks } from '@/lib/supabase/queries'
import { StudyPlannerWorkspace } from '@/components/study-planner/StudyPlannerWorkspace'

export default async function StudyPlannerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [courses, plans] = await Promise.all([getCourses(user.id), getStudyPlans(user.id)])
  const latestPlan = plans[0]
  const tasks = latestPlan ? await getStudyPlanTasks(latestPlan.id) : []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--sb-muted)]">AI Planning</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-3xl">
          Smart Study Scheduler
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--sb-muted)]">
          Generate a personalized plan from your exams, available study hours, and course difficulty.
        </p>
      </div>
      <StudyPlannerWorkspace courses={courses} initialTasks={tasks} />
    </div>
  )
}

