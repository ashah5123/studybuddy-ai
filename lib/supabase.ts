// ────────────────────────────────────────────────────────────
// lib/supabase.ts
// Typed helper functions for all common database operations.
// Import the appropriate Supabase client (browser or server)
// before calling these helpers.
// ────────────────────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Database,
  User,
  UserUpdate,
  Question,
  QuestionInsert,
  QuestionUpdate,
  Quiz,
  QuizInsert,
  QuizUpdate,
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
} from './types'

export type TypedSupabaseClient = SupabaseClient<Database>

// ────────────────────────────────────────────────────────────
// Users
// ────────────────────────────────────────────────────────────

export async function getUser(
  db: TypedSupabaseClient,
  userId: string
): Promise<User | null> {
  const { data, error } = await db
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateUser(
  db: TypedSupabaseClient,
  userId: string,
  payload: UserUpdate
): Promise<User> {
  const { data, error } = await db
    .from('users')
    .update(payload)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function incrementQuestionsToday(
  db: TypedSupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await db.rpc('increment_questions_today', { uid: userId })
  if (error) {
    // Fallback: fetch current value and update manually
    const user = await getUser(db, userId)
    if (!user) throw new Error('User not found')
    await updateUser(db, userId, {
      questions_today: user.questions_today + 1,
      last_active: new Date().toISOString(),
    })
  }
}

export async function updateStreak(
  db: TypedSupabaseClient,
  userId: string,
  streak: number
): Promise<void> {
  await updateUser(db, userId, { streak, last_active: new Date().toISOString() })
}

// ────────────────────────────────────────────────────────────
// Questions
// ────────────────────────────────────────────────────────────

export async function getQuestion(
  db: TypedSupabaseClient,
  questionId: string
): Promise<Question | null> {
  const { data, error } = await db
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single()

  if (error) throw error
  return data
}

export async function listQuestions(
  db: TypedSupabaseClient,
  userId: string,
  options?: { subject?: string; limit?: number; offset?: number }
): Promise<Question[]> {
  let query = db
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.subject) {
    query = query.eq('subject', options.subject)
  }
  if (options?.limit !== undefined) {
    query = query.limit(options.limit)
  }
  if (options?.offset !== undefined) {
    query = query.range(options.offset, options.offset + (options.limit ?? 20) - 1)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createQuestion(
  db: TypedSupabaseClient,
  payload: QuestionInsert
): Promise<Question> {
  const { data, error } = await db
    .from('questions')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateQuestion(
  db: TypedSupabaseClient,
  questionId: string,
  payload: QuestionUpdate
): Promise<Question> {
  const { data, error } = await db
    .from('questions')
    .update(payload)
    .eq('id', questionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteQuestion(
  db: TypedSupabaseClient,
  questionId: string
): Promise<void> {
  const { error } = await db
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
}

export async function countQuestionsToday(
  db: TypedSupabaseClient,
  userId: string
): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setUTCHours(0, 0, 0, 0)

  const { count, error } = await db
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())

  if (error) throw error
  return count ?? 0
}

// ────────────────────────────────────────────────────────────
// Quizzes
// ────────────────────────────────────────────────────────────

export async function getQuiz(
  db: TypedSupabaseClient,
  quizId: string
): Promise<Quiz | null> {
  const { data, error } = await db
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single()

  if (error) throw error
  return data
}

export async function listQuizzes(
  db: TypedSupabaseClient,
  userId: string,
  options?: { questionId?: string; limit?: number }
): Promise<Quiz[]> {
  let query = db
    .from('quizzes')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false, nullsFirst: false })

  if (options?.questionId) {
    query = query.eq('question_id', options.questionId)
  }
  if (options?.limit !== undefined) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createQuiz(
  db: TypedSupabaseClient,
  payload: QuizInsert
): Promise<Quiz> {
  const { data, error } = await db
    .from('quizzes')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateQuiz(
  db: TypedSupabaseClient,
  quizId: string,
  payload: QuizUpdate
): Promise<Quiz> {
  const { data, error } = await db
    .from('quizzes')
    .update(payload)
    .eq('id', quizId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function submitQuiz(
  db: TypedSupabaseClient,
  quizId: string,
  score: number
): Promise<Quiz> {
  return updateQuiz(db, quizId, {
    score,
    completed_at: new Date().toISOString(),
  })
}

export async function getAverageScore(
  db: TypedSupabaseClient,
  userId: string
): Promise<number | null> {
  const { data, error } = await db
    .from('quizzes')
    .select('score')
    .eq('user_id', userId)
    .not('score', 'is', null)

  if (error) throw error
  if (!data || data.length === 0) return null

  const total = data.reduce((sum, row) => sum + (row.score ?? 0), 0)
  return Math.round(total / data.length)
}

// ────────────────────────────────────────────────────────────
// Subscriptions
// ────────────────────────────────────────────────────────────

export async function getSubscription(
  db: TypedSupabaseClient,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await db
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getSubscriptionByCustomerId(
  db: TypedSupabaseClient,
  stripeCustomerId: string
): Promise<Subscription | null> {
  const { data, error } = await db
    .from('subscriptions')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function upsertSubscription(
  db: TypedSupabaseClient,
  payload: SubscriptionInsert
): Promise<Subscription> {
  const { data, error } = await db
    .from('subscriptions')
    .upsert(payload, { onConflict: 'stripe_customer_id' })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSubscription(
  db: TypedSupabaseClient,
  stripeCustomerId: string,
  payload: SubscriptionUpdate
): Promise<Subscription> {
  const { data, error } = await db
    .from('subscriptions')
    .update(payload)
    .eq('stripe_customer_id', stripeCustomerId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function isSubscriptionActive(
  db: TypedSupabaseClient,
  userId: string
): Promise<boolean> {
  const sub = await getSubscription(db, userId)
  if (!sub) return false

  const isActive = sub.status === 'active' || sub.status === 'trialing'
  if (!isActive) return false

  if (sub.current_period_end) {
    return new Date(sub.current_period_end) > new Date()
  }
  return true
}
