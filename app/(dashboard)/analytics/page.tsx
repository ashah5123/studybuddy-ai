import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getAverageScore } from '@/lib/supabase'
import type { TypedSupabaseClient } from '@/lib/supabase'
import {
  getDailyQuestions,
  getSubjectBreakdown,
  getTotalApiCalls,
  getCostSummary,
  getSemanticSearchStats,
  getPeakStudyHours,
  getQuizScoresBySubject,
} from '@/lib/analytics'
import AnalyticsClient from './analytics-client'

export const metadata: Metadata = { title: 'Analytics' }

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) redirect('/login')

  const typedDb = supabase as unknown as TypedSupabaseClient
  const db = supabase as any

  const [
    totalApiCalls,
    costSummary,
    avgScore,
    dailyQuestions,
    subjectBreakdown,
    semanticStats,
    peakHours,
    quizBySubject,
    totalQuestionsResult,
  ] = await Promise.all([
    getTotalApiCalls(db, authUser.id),
    getCostSummary(db, authUser.id),
    getAverageScore(typedDb, authUser.id),
    getDailyQuestions(db, authUser.id, 30),
    getSubjectBreakdown(db, authUser.id),
    getSemanticSearchStats(db, authUser.id),
    getPeakStudyHours(db, authUser.id),
    getQuizScoresBySubject(db, authUser.id),
    typedDb
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .then(({ count }) => count ?? 0),
  ])

  const avgScorePct = avgScore !== null ? Math.round((avgScore / 3) * 100) : null

  return (
    <AnalyticsClient
      totalQuestions={totalQuestionsResult}
      totalApiCalls={totalApiCalls}
      costSummary={costSummary}
      avgScorePct={avgScorePct}
      dailyQuestions={dailyQuestions}
      subjectBreakdown={subjectBreakdown}
      semanticStats={semanticStats}
      peakHours={peakHours}
      quizBySubject={quizBySubject}
    />
  )
}
