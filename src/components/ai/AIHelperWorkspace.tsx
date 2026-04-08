'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import type { Conversation, Course, Message } from '@/types/database.types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChatMessage, type ChatMessageData } from '@/components/ai/ChatMessage'
import {
  ConversationHistory,
  type ConversationListItem,
} from '@/components/ai/ConversationHistory'

type StreamEvent =
  | { type: 'meta'; conversationId: string; remaining: number; limit: number }
  | { type: 'chunk'; text: string }
  | { type: 'done'; message: string; followUps: string[]; remaining: number; limit: number }
  | { type: 'error'; error: string }

function toChatMessages(rows: Message[]): ChatMessageData[] {
  return rows.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
  }))
}

export function AIHelperWorkspace({
  courses,
  initialConversations,
}: {
  courses: Course[]
  initialConversations: Conversation[]
}) {
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    initialConversations as ConversationListItem[]
  )
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialConversations[0]?.id ?? null
  )
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [input, setInput] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [followUps, setFollowUps] = useState<string[]>([])
  const [remaining, setRemaining] = useState<number | null>(null)
  const [limit, setLimit] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    async function loadConversation(id: string) {
      const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(id)}`)
      const data = (await res.json()) as { messages?: Message[]; error?: string }
      if (!res.ok) {
        setError(data.error ?? 'Failed to load conversation')
        return
      }
      setMessages(toChatMessages(data.messages ?? []))
      setError(null)
      setFollowUps([])
    }

    if (activeConversationId) void loadConversation(activeConversationId)
    else setMessages([])
  }, [activeConversationId])

  async function refreshConversations() {
    const res = await fetch('/api/chat')
    const data = (await res.json()) as { conversations?: Conversation[] }
    if (res.ok) setConversations((data.conversations ?? []) as ConversationListItem[])
  }

  async function handleDeleteConversation(conversationId: string) {
    const res = await fetch(`/api/chat?conversationId=${encodeURIComponent(conversationId)}`, {
      method: 'DELETE',
    })
    if (!res.ok) return
    setConversations((prev) => prev.filter((c) => c.id !== conversationId))
    if (activeConversationId === conversationId) {
      setActiveConversationId(null)
      setMessages([])
    }
  }

  async function sendQuestion(q: string) {
    const text = q.trim()
    if (!text || loading) return
    setError(null)
    setLoading(true)
    setFollowUps([])

    const userMsg: ChatMessageData = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    }
    const aiMsgId = `a-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: aiMsgId, role: 'assistant', content: '', createdAt: new Date().toISOString() },
    ])
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          courseId: selectedCourseId || undefined,
          subject: selectedCourse?.name,
          conversationId: activeConversationId ?? undefined,
          stream: true,
        }),
      })

      if (!response.ok || !response.body) {
        const data = (await response.json()) as { error?: string; remaining?: number; limit?: number }
        if (typeof data.remaining === 'number') setRemaining(data.remaining)
        if (typeof data.limit === 'number') setLimit(data.limit)
        throw new Error(data.error ?? 'Request failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const blocks = buffer.split('\n\n')
        buffer = blocks.pop() ?? ''

        for (const block of blocks) {
          const line = block
            .split('\n')
            .map((l) => l.trim())
            .find((l) => l.startsWith('data: '))
          if (!line) continue
          const payload = JSON.parse(line.slice(6)) as StreamEvent

          if (payload.type === 'meta') {
            setActiveConversationId(payload.conversationId)
            setRemaining(payload.remaining)
            setLimit(payload.limit)
            void refreshConversations()
          } else if (payload.type === 'chunk') {
            setMessages((prev) =>
              prev.map((m) => (m.id === aiMsgId ? { ...m, content: m.content + payload.text } : m))
            )
          } else if (payload.type === 'done') {
            setFollowUps(payload.followUps ?? [])
            setRemaining(payload.remaining)
            setLimit(payload.limit)
            void refreshConversations()
          } else if (payload.type === 'error') {
            throw new Error(payload.error)
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to stream AI response'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <Card className="p-3">
        <ConversationHistory
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={setActiveConversationId}
          onDelete={(id) => void handleDeleteConversation(id)}
          onNew={() => {
            setActiveConversationId(null)
            setMessages([])
            setFollowUps([])
          }}
        />
      </Card>

      <Card className="flex min-h-[70vh] flex-col overflow-hidden p-0">
        <div className="border-b border-white/10 bg-white/5 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="sb-input max-w-[280px] text-sm"
            >
              <option value="">Select Course (optional)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
            <div className="ml-auto text-xs text-[var(--sb-muted)]">
              {remaining !== null && limit !== null
                ? `You have ${remaining} questions remaining today`
                : 'Daily quota: 10 questions (free tier)'}
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 sm:p-5">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="py-20 text-center text-sm text-[var(--sb-muted)]">
                Ask a homework question. I will personalize help using your courses, notes, and recent chat history.
              </p>
            ) : (
              messages.map((m) => <ChatMessage key={m.id} message={m} />)
            )}
            {loading && (
              <div className="flex justify-start text-xs text-[var(--sb-muted)]">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  AI is thinking...
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {followUps.length > 0 && (
          <div className="border-t border-white/10 bg-white/5 px-3 py-2 sm:px-4">
            <p className="mb-2 text-xs font-medium text-[var(--sb-muted)]">Suggested follow-up questions</p>
            <div className="flex flex-wrap gap-2">
              {followUps.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setInput(f)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[var(--foreground)] hover:bg-white/10"
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="border-t border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 sm:px-4">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void sendQuestion(input)
          }}
          className="flex items-end gap-2 border-t border-white/10 bg-white/[0.03] p-3 sm:p-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a homework question..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-11 w-11 px-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </Card>
    </div>
  )
}

