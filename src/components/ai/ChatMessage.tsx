'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessageData {
  id: string
  role: ChatRole
  content: string
  createdAt: string
}

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[82%] ${
          isUser
            ? 'rounded-br-md bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-900/20'
            : 'rounded-bl-md border border-[var(--sb-border)] bg-[var(--sb-surface)] text-[var(--foreground)]'
        }`}
      >
        {/* Prose content — sb-prose adapts colors per theme */}
        <div className={`prose prose-sm max-w-none sb-prose prose-p:my-1 prose-pre:overflow-x-auto prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)] prose-li:text-[var(--foreground)] prose-strong:text-[var(--foreground)] prose-code:text-[var(--foreground)] prose-pre:rounded-xl ${isUser ? 'prose-invert' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        <div className={`mt-2 flex items-center gap-2 text-[11px] ${isUser ? 'text-white/70' : 'text-[var(--sb-muted)]'}`}>
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors ${
              isUser ? 'hover:bg-white/15' : 'hover:bg-[var(--sb-item-bg)]'
            }`}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}
