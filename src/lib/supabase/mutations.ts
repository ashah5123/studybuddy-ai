'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { courseSchema, assignmentSchema } from '@/lib/validations/courses'
import type { CourseInput, AssignmentInput } from '@/lib/validations/courses'

type MutationResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  return user.id
}

// ── Courses ──────────────────────────────────────────────────

export async function createCourse(
  input: CourseInput
): Promise<MutationResult<{ id: string }>> {
  try {
    const userId = await getAuthUserId()
    const parsed = courseSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('courses')
      .insert({ ...parsed.data, user_id: userId })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/courses')
    revalidatePath('/dashboard')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateCourse(
  courseId: string,
  input: Partial<CourseInput>
): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('courses')
      .update(input)
      .eq('id', courseId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/courses')
    revalidatePath(`/dashboard/courses/${courseId}`)
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteCourse(courseId: string): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/courses')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── Assignments ───────────────────────────────────────────────

export async function createAssignment(
  input: AssignmentInput
): Promise<MutationResult<{ id: string }>> {
  try {
    const userId = await getAuthUserId()
    const parsed = assignmentSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('assignments')
      .insert({ ...parsed.data, user_id: userId })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateAssignment(
  assignmentId: string,
  input: Partial<AssignmentInput>
): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('assignments')
      .update(input)
      .eq('id', assignmentId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteAssignment(
  assignmentId: string
): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function toggleAssignmentComplete(
  assignmentId: string,
  completed: boolean
): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('assignments')
      .update({ completed })
      .eq('id', assignmentId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/assignments')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
