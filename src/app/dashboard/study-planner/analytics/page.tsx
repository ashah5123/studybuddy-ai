import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCourses, getStudyPlans, getStudyPlanTasks } from '@/lib/supabase/queries'
import { StudyPlannerAnalyticsClient } from '@/components/study-planner/StudyPlannerAnalyticsClient'

export default async function StudyPlannerAnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [courses, plans] = await Promise.all([getCourses(user.id), getStudyPlans(user.id)])
  const latestPlan = plans[0]
  const tasks = latestPlan ? await getStudyPlanTasks(latestPlan.id) : []

  return <StudyPlannerAnalyticsClient tasks={tasks} courses={courses} />
}

