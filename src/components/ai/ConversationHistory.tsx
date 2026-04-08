'use client'

import { useMemo, useState } from 'react'
import { Search, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface ConversationListItem {
  id: string
  title: string
  subject: string | null
  updated_at: string
}

interface Props {
  conversations: ConversationListItem[]
  activeConversationId: string | null
  onSelect: (conversationId: string) => void
  onDelete: (conversationId: string) => void
  onNew: () => void
}

export function ConversationHistory({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onNew,
}: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const date = new Date(c.updated_at).toLocaleDateString().toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        (c.subject ?? '').toLowerCase().includes(q) ||
        date.includes(q)
      )
    })
  }, [conversations, query])

  return (
    <div className="flex h-full min-h-[420px] flex-col">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">History</h3>
        <Button variant="secondary" className="h-8 px-2" onClick={onNew}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          New
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--sb-muted)]" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title/date/subject"
          className="pl-9"
        />
      </div>

      <ScrollArea className="flex-1 space-y-1 pr-1">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-[var(--sb-muted)]">No conversations yet.</p>
        ) : (
          filtered.map((c) => {
            const active = c.id === activeConversationId
            return (
              <div
                key={c.id}
                className={`group mb-1 rounded-xl border p-2.5 ${
                  active ? 'border-indigo-400/50 bg-indigo-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="w-full text-left"
                >
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">{c.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--sb-muted)]">
                    {c.subject || 'General'} · {new Date(c.updated_at).toLocaleDateString()}
                  </p>
                </button>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onDelete(c.id)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-300 opacity-0 transition-opacity hover:bg-rose-500/10 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </ScrollArea>
    </div>
  )
}

