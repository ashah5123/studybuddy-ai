import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  AnalyticsEventInsert,
  AnalyticsEventType,
  DailyQuestionStat,
  SubjectStat,
  CostSummary,
  Plan,
} from './types'

type DB = SupabaseClient<Database>

// ────────────────────────────────────────────────────────────
// Event tracking
// ────────────────────────────────────────────────────────────

export async function trackEvent(
  db: DB,
  event: AnalyticsEventInsert
): Promise<void> {
  const { error } = await db
    .from('analytics_events')
    .insert({ metadata: {}, ...event })

  if (error) throw error
}

export async function trackQuestionAsked(
  db: DB,
  params: {
    userId: string
    subject: string
    plan: Plan
    sessionId: string
    inputTokens: number
    outputTokens: number
    estimatedCostUsd: number
  }
): Promise<void> {
  await trackEvent(db, {
    user_id: params.userId,
    event_type: 'question_asked',
    subject: params.subject,
    plan: params.plan,
    session_id: params.sessionId,
    input_tokens: params.inputTokens,
    output_tokens: params.outputTokens,
    estimated_cost_usd: params.estimatedCostUsd,
  })
}

export async function trackQuizGenerated(
  db: DB,
  params: {
    userId: string
    subject: string
    plan: Plan
    sessionId?: string
  }
): Promise<void> {
  await trackEvent(db, {
    user_id: params.userId,
    event_type: 'quiz_generated',
    subject: params.subject,
    plan: params.plan,
    session_id: params.sessionId ?? null,
    input_tokens: null,
    output_tokens: null,
    estimated_cost_usd: null,
  })
}

export async function trackEmbeddingGenerated(
  db: DB,
  params: { userId: string; plan: Plan }
): Promise<void> {
  await trackEvent(db, {
    user_id: params.userId,
    event_type: 'embedding_generated',
    subject: null,
    plan: params.plan,
    session_id: null,
    input_tokens: null,
    output_tokens: null,
    estimated_cost_usd: null,
  })
}

export async function trackSemanticSearch(
  db: DB,
  params: { userId: string; plan: Plan; hitFound: boolean }
): Promise<void> {
  await trackEvent(db, {
    user_id: params.userId,
    event_type: 'semantic_search',
    subject: null,
    plan: params.plan,
    session_id: null,
    input_tokens: null,
    output_tokens: null,
    estimated_cost_usd: null,
    metadata: { hit_found: params.hitFound },
  })
}

// ────────────────────────────────────────────────────────────
// Aggregated stats
// ────────────────────────────────────────────────────────────

export async function getDailyQuestions(
  db: DB,
  userId: string,
  days = 30
): Promise<DailyQuestionStat[]> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  since.setUTCHours(0, 0, 0, 0)

  const { data, error } = await db
    .from('analytics_events')
    .select('created_at')
    .eq('user_id', userId)
    .eq('event_type', 'question_asked' satisfies AnalyticsEventType)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })

  if (error) throw error
  if (!data || data.length === 0) return []

  const byDate: Record<string, number> = {}
  for (const row of data) {
    const date = row.created_at.slice(0, 10)
    byDate[date] = (byDate[date] ?? 0) + 1
  }

  return Object.entries(byDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export async function getSubjectBreakdown(
  db: DB,
  userId: string
): Promise<SubjectStat[]> {
  const { data, error } = await db
    .from('analytics_events')
    .select('subject')
    .eq('user_id', userId)
    .eq('event_type', 'question_asked' satisfies AnalyticsEventType)
    .not('subject', 'is', null)

  if (error) throw error
  if (!data || data.length === 0) return []

  const counts: Record<string, number> = {}
  for (const row of data) {
    if (row.subject) {
      counts[row.subject] = (counts[row.subject] ?? 0) + 1
    }
  }

  return Object.entries(counts)
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => b.count - a.count)
}

export async function getTotalApiCalls(
  db: DB,
  userId: string
): Promise<number> {
  const { count, error } = await db
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'question_asked' satisfies AnalyticsEventType)

  if (error) throw error
  return count ?? 0
}

export async function getCostSummary(
  db: DB,
  userId: string,
  options?: { sessionId?: string; since?: Date }
): Promise<CostSummary> {
  let query = db
    .from('analytics_events')
    .select('input_tokens, output_tokens, estimated_cost_usd')
    .eq('user_id', userId)
    .eq('event_type', 'question_asked' satisfies AnalyticsEventType)
    .not('estimated_cost_usd', 'is', null)

  if (options?.sessionId) {
    query = query.eq('session_id', options.sessionId)
  }
  if (options?.since) {
    query = query.gte('created_at', options.since.toISOString())
  }

  const { data, error } = await query
  if (error) throw error

  if (!data || data.length === 0) {
    return { total_input_tokens: 0, total_output_tokens: 0, estimated_cost_usd: 0, api_calls: 0 }
  }

  return data.reduce(
    (acc, row) => ({
      total_input_tokens: acc.total_input_tokens + (row.input_tokens ?? 0),
      total_output_tokens: acc.total_output_tokens + (row.output_tokens ?? 0),
      estimated_cost_usd:
        acc.estimated_cost_usd + (Number(row.estimated_cost_usd) ?? 0),
      api_calls: acc.api_calls + 1,
    }),
    { total_input_tokens: 0, total_output_tokens: 0, estimated_cost_usd: 0, api_calls: 0 }
  )
}

export async function getSessionCost(
  db: DB,
  userId: string,
  sessionId: string
): Promise<CostSummary> {
  return getCostSummary(db, userId, { sessionId })
}

export async function getSemanticSearchStats(
  db: DB,
  userId: string
): Promise<{ hits: number; misses: number; costSavedUsd: number }> {
  const { data, error } = await db
    .from('analytics_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('event_type', 'semantic_search' satisfies AnalyticsEventType)

  if (error) throw error
  if (!data || data.length === 0) return { hits: 0, misses: 0, costSavedUsd: 0 }

  let hits = 0
  let misses = 0
  for (const row of data) {
    if ((row.metadata as Record<string, unknown>)?.hit_found === true) {
      hits++
    } else {
      misses++
    }
  }

  const costSummary = await getCostSummary(db, userId)
  const avgCostPerCall =
    costSummary.api_calls > 0 ? costSummary.estimated_cost_usd / costSummary.api_calls : 0
  const costSavedUsd = hits * avgCostPerCall

  return { hits, misses, costSavedUsd }
}

export async function getPeakStudyHours(
  db: DB,
  userId: string
): Promise<{ hour: number; count: number }[]> {
  const { data, error } = await db
    .from('analytics_events')
    .select('created_at')
    .eq('user_id', userId)
    .eq('event_type', 'question_asked' satisfies AnalyticsEventType)

  if (error) throw error
  if (!data || data.length === 0) {
    return Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
  }

  const counts: Record<number, number> = {}
  for (const row of data) {
    const hour = new Date(row.created_at).getHours()
    counts[hour] = (counts[hour] ?? 0) + 1
  }

  return Array.from({ length: 24 }, (_, hour) => ({ hour, count: counts[hour] ?? 0 }))
}

export async function getQuizScoresBySubject(
  db: DB,
  userId: string
): Promise<{ subject: string; avgScore: number; count: number }[]> {
  const { data, error } = await (db as unknown as import('@supabase/supabase-js').SupabaseClient)
    .from('quizzes')
    .select('score, questions!inner(subject)')
    .eq('user_id', userId)
    .not('score', 'is', null)

  if (error) throw error
  if (!data || data.length === 0) return []

  const bySubject: Record<string, { total: number; count: number }> = {}
  for (const row of data as unknown as { score: number; questions: { subject: string } }[]) {
    const subject = row.questions?.subject ?? 'Other'
    if (!bySubject[subject]) bySubject[subject] = { total: 0, count: 0 }
    bySubject[subject].total += (row.score / 3) * 100
    bySubject[subject].count++
  }

  return Object.entries(bySubject)
    .map(([subject, { total, count }]) => ({
      subject,
      avgScore: Math.round(total / count),
      count,
    }))
    .sort((a, b) => b.count - a.count)
}

export async function getPlanUsageBreakdown(
  db: DB,
  userId: string
): Promise<{ free: number; pro: number }> {
  const { data, error } = await db
    .from('analytics_events')
    .select('plan')
    .eq('user_id', userId)
    .eq('event_type', 'question_asked' satisfies AnalyticsEventType)

  if (error) throw error
  if (!data || data.length === 0) return { free: 0, pro: 0 }

  return data.reduce(
    (acc, row) => {
      if (row.plan === 'pro') {
        acc.pro += 1
      } else {
        acc.free += 1
      }
      return acc
    },
    { free: 0, pro: 0 }
  )
}
