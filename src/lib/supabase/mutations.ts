'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { courseSchema, assignmentSchema } from '@/lib/validations/courses'
import type { CourseInput, AssignmentInput } from '@/lib/validations/courses'
import { scheduleEventSchema } from '@/lib/validations/schedule'
import type { ScheduleEventInput } from '@/lib/validations/schedule'
import { plainTextToDoc } from '@/lib/tiptap/plainDoc'

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

// ── Notes ────────────────────────────────────────────────────

export async function createNote(
  title: string,
  body: string
): Promise<MutationResult<{ id: string }>> {
  try {
    const userId = await getAuthUserId()
    const t = title.trim()
    if (!t) return { success: false, error: 'Title is required' }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title: t,
        content: plainTextToDoc(body),
        source: 'manual',
        course_id: null,
        video_url: null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/notes')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteNote(noteId: string): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/notes')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── Flashcards ────────────────────────────────────────────────

export async function createFlashcardDeck(
  name: string,
  description: string | null
): Promise<MutationResult<{ id: string }>> {
  try {
    const userId = await getAuthUserId()
    const n = name.trim()
    if (!n) return { success: false, error: 'Deck name is required' }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: userId,
        name: n,
        description: description?.trim() || null,
        course_id: null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/flashcards')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function createFlashcard(
  deckId: string,
  question: string,
  answer: string
): Promise<MutationResult<{ id: string }>> {
  try {
    const userId = await getAuthUserId()
    const q = question.trim()
    const a = answer.trim()
    if (!q || !a) return { success: false, error: 'Question and answer are required' }

    const supabase = await createClient()
    const { data: deck, error: deckErr } = await supabase
      .from('flashcard_decks')
      .select('id')
      .eq('id', deckId)
      .eq('user_id', userId)
      .single()
    if (deckErr || !deck) return { success: false, error: 'Deck not found' }

    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: deckId,
        question: q,
        answer: a,
        difficulty: 'medium',
        next_review: now,
        review_count: 0,
        last_reviewed: null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/flashcards')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── Schedule (calendar blocks) ───────────────────────────────

export async function createScheduleEvent(
  input: ScheduleEventInput
): Promise<MutationResult<{ id: string }>> {
  try {
    const userId = await getAuthUserId()
    const parsed = scheduleEventSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('schedule_events')
      .insert({
        user_id: userId,
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        starts_at: parsed.data.starts_at,
        ends_at: parsed.data.ends_at,
        color: parsed.data.color,
        course_id: parsed.data.course_id ?? null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateScheduleEvent(
  eventId: string,
  input: ScheduleEventInput
): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const parsed = scheduleEventSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('schedule_events')
      .update({
        title: parsed.data.title,
        description: parsed.data.description?.trim() || null,
        starts_at: parsed.data.starts_at,
        ends_at: parsed.data.ends_at,
        color: parsed.data.color,
        course_id: parsed.data.course_id ?? null,
      })
      .eq('id', eventId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteScheduleEvent(eventId: string): Promise<MutationResult> {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('schedule_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/schedule')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ── AI conversations ─────────────────────────────────────────

export async function createConversation(
  userId: string,
  title: string,
  subject: string | null
): Promise<MutationResult<{ id: string }>> {
  try {
    const authUserId = await getAuthUserId()
    if (authUserId !== userId) return { success: false, error: 'Unauthorized' }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: authUserId,
        title: title.trim() || 'New chat',
        subject: subject?.trim() || null,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/ai-helper')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<MutationResult<{ id: string }>> {
  try {
    const authUserId = await getAuthUserId()
    const supabase = await createClient()

    const { data: conversation, error: convErr } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', authUserId)
      .single()

    if (convErr || !conversation) return { success: false, error: 'Conversation not found' }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content: content.trim(),
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', authUserId)

    revalidatePath('/dashboard/ai-helper')
    return { success: true, data: { id: data.id } }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function deleteConversation(
  conversationId: string
): Promise<MutationResult> {
  try {
    const authUserId = await getAuthUserId()
    const supabase = await createClient()
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', authUserId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/ai-helper')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
