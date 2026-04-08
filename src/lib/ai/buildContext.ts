import { docToPlainPreview } from '@/lib/tiptap/plainDoc'
import {
  getConversationHistory,
  getCourses,
  getRecentNotesBySubject,
} from '@/lib/supabase/queries'
import { createClient } from '@/lib/supabase/server'

type CacheEntry = { expiresAt: number; value: string }

const CACHE_TTL_MS = 5 * 60 * 1000
const contextCache = new Map<string, CacheEntry>()

function cacheKey(userId: string, subject?: string): string {
  return `${userId}::${subject?.trim().toLowerCase() ?? ''}`
}

function collectPreviousQuestionsFromConversations(
  conversationRows: Array<{ id: string }>,
  messagesByConversation: Map<string, Array<{ role: string; content: string }>>
): string[] {
  const out: string[] = []
  for (const row of conversationRows) {
    const msgs = messagesByConversation.get(row.id) ?? []
    for (const m of msgs) {
      if (m.role !== 'user') continue
      if (!m.content?.trim()) continue
      out.push(m.content.trim())
      if (out.length >= 3) return out
    }
  }
  return out
}

export async function buildUserContext(
  userId: string,
  subject?: string
): Promise<string> {
  const key = cacheKey(userId, subject)
  const now = Date.now()
  const cached = contextCache.get(key)
  if (cached && cached.expiresAt > now) return cached.value

  const [courses, history, notes] = await Promise.all([
    getCourses(userId),
    getConversationHistory(userId, 5),
    getRecentNotesBySubject(userId, subject, 6),
  ])

  const supabase = await createClient()
  const conversationIds = history.map((h) => h.id)
  const messagesByConversation = new Map<string, Array<{ role: string; content: string }>>()
  if (conversationIds.length > 0) {
    const { data: rows } = await supabase
      .from('messages')
      .select('conversation_id, role, content, created_at')
      .in('conversation_id', conversationIds)
      .order('created_at', { ascending: false })

    for (const row of rows ?? []) {
      const arr = messagesByConversation.get(row.conversation_id) ?? []
      arr.push({ role: row.role, content: row.content })
      messagesByConversation.set(row.conversation_id, arr)
    }
  }

  const courseList = courses.map((c) => c.name).slice(0, 10)
  const noteTopics = notes
    .map((n) => {
      const preview = docToPlainPreview(n.content)
      return `${n.title}${preview ? ` — ${preview}` : ''}`
    })
    .filter(Boolean)
    .slice(0, 6)
  const previousQuestions = collectPreviousQuestionsFromConversations(
    history.map((h) => ({ id: h.id })),
    messagesByConversation
  )

  const context = [
    `You are helping a student enrolled in: ${
      courseList.length ? courseList.join(', ') : 'No courses yet'
    }.`,
    `Recent topics they've studied: ${
      noteTopics.length ? noteTopics.join(' | ') : 'No recent notes found'
    }.`,
    `Previous questions asked: ${
      previousQuestions.length ? previousQuestions.join(' | ') : 'No previous questions'
    }.`,
    'Adapt explanations to their level, connect answers to their courses when relevant, and keep responses concise and encouraging.',
  ].join('\n')

  contextCache.set(key, { expiresAt: now + CACHE_TTL_MS, value: context })
  return context
}

