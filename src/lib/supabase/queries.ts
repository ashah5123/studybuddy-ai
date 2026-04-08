import { createClient } from '@/lib/supabase/server'
import type { Assignment, Course, StudySession } from '@/types/database.types'

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
