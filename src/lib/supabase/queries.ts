import { createClient } from '@/lib/supabase/server'
import type {
  Assignment,
  Conversation,
  Course,
  FlashcardDeck,
  Message,
  Note,
StudyPlan,
  StudyPlanTask,
  StudySession,
} from '@/types/database.types'

export async function getCourses(userId: string): Promise<Course[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getCourseById(
  courseId: string,
  userId: string
): Promise<Course | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('user_id', userId)
    .single()
  if (error) return null
  return data
}

export interface AssignmentFilters {
  courseId?: string
  completed?: boolean
  overdue?: boolean
}

export async function getAssignments(
  userId: string,
  filters: AssignmentFilters = {}
): Promise<Assignment[]> {
  const supabase = await createClient()
  let query = supabase
    .from('assignments')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters.courseId) query = query.eq('course_id', filters.courseId)
  if (filters.completed !== undefined) query = query.eq('completed', filters.completed)
  if (filters.overdue) {
    query = query
      .lt('due_date', new Date().toISOString())
      .eq('completed', false)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getUpcomingAssignments(
  userId: string,
  days = 7
): Promise<Assignment[]> {
  const supabase = await createClient()
  const now = new Date()
  const future = new Date(now)
  future.setDate(future.getDate() + days)

  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .gte('due_date', now.toISOString())
    .lte('due_date', future.toISOString())
    .order('due_date', { ascending: true })
    .limit(5)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getRecentStudySessions(
  userId: string,
  limit = 5
): Promise<StudySession[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data ?? []
}

export interface UserStats {
  totalCourses: number
  activeAssignments: number
  completedThisWeek: number
  studyMinutesThisWeek: number
}

export async function getNotes(userId: string): Promise<Note[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getFlashcardDecks(userId: string): Promise<
  (FlashcardDeck & { card_count: number })[]
> {
  const supabase = await createClient()
  const { data: decks, error: deckErr } = await supabase
    .from('flashcard_decks')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (deckErr) throw new Error(deckErr.message)
  if (!decks?.length) return []

  const ids = decks.map((d) => d.id)
  const { data: rows, error: countErr } = await supabase
    .from('flashcards')
    .select('deck_id')
    .in('deck_id', ids)
  if (countErr) throw new Error(countErr.message)

  const countMap = (rows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.deck_id] = (acc[row.deck_id] ?? 0) + 1
    return acc
  }, {})

  return decks.map((d) => ({
    ...d,
    card_count: countMap[d.id] ?? 0,
  }))
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient()

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [courses, active, completedWeek, sessions] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', false),
    supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('updated_at', weekAgo.toISOString()),
    supabase
      .from('study_sessions')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('created_at', weekAgo.toISOString()),
  ])

  const studyMinutes = (sessions.data ?? []).reduce(
    (sum, s) => sum + (s.duration_minutes ?? 0),
    0
  )

  return {
    totalCourses: courses.count ?? 0,
    activeAssignments: active.count ?? 0,
    completedThisWeek: completedWeek.count ?? 0,
    studyMinutesThisWeek: studyMinutes,
  }
}

export async function getConversationHistory(
  userId: string,
  limit = 20
): Promise<Conversation[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data as Conversation[]) ?? []
}

export async function getRecentNotesBySubject(
  userId: string,
  subject?: string,
  limit = 8
): Promise<Note[]> {
  const supabase = await createClient()
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  const normalized = subject?.trim()
  if (normalized) {
    query = query.ilike('title', `%${normalized}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Note[]) ?? []
}

export async function getActiveConversation(
  conversationId: string
): Promise<{ conversation: Conversation; messages: Message[] } | null> {
  const supabase = await createClient()
  const { data: conversation, error: convErr } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (convErr || !conversation) return null

  const { data: messages, error: msgErr } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (msgErr) throw new Error(msgErr.message)

  return {
    conversation: conversation as Conversation,
    messages: (messages as Message[]) ?? [],
  }
}

export async function getStudyPlans(userId: string): Promise<StudyPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_plans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as StudyPlan[]) ?? []
}

export async function getStudyPlanTasks(planId: string): Promise<StudyPlanTask[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('study_plan_tasks')
    .select('*')
    .eq('plan_id', planId)
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return (data as StudyPlanTask[]) ?? []
}

