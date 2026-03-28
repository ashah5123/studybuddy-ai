import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUser, listQuestions, listQuizzes } from '@/lib/supabase'
import { getDailyQuestions, getSubjectBreakdown } from '@/lib/analytics'
import type { TypedSupabaseClient } from '@/lib/supabase'
import DashboardClient from './dashboard-client'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const typedDb = supabase as unknown as TypedSupabaseClient

  const [user, recentQuestions, completedQuizzes, subjectBreakdown, activityDays] =
    await Promise.all([
      getUser(typedDb, authUser.id),
      listQuestions(typedDb, authUser.id, { limit: 5 }),
      listQuizzes(typedDb, authUser.id, { limit: 50 }),
      getSubjectBreakdown(supabase as any, authUser.id),
      getDailyQuestions(supabase as any, authUser.id, 30),
    ])

  if (!user) redirect('/login')

  const scoredQuizzes = completedQuizzes.filter((q) => q.score !== null)
  const avgScore =
    scoredQuizzes.length > 0
      ? Math.round(
          (scoredQuizzes.reduce((sum, q) => sum + (q.score ?? 0), 0) /
            scoredQuizzes.length /
            3) *
            100
        )
      : null

  const totalQuestions = await typedDb
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', authUser.id)
    .then(({ count }) => count ?? 0)

  return (
    <DashboardClient
      user={user}
      recentQuestions={recentQuestions}
      subjectBreakdown={subjectBreakdown}
      activityDays={activityDays}
      avgScore={avgScore}
      totalQuestions={totalQuestions}
    />
  )
}
