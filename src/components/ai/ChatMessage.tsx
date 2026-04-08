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
            ? 'rounded-br-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
            : 'rounded-bl-md border border-white/10 bg-white/5 text-[var(--foreground)]'
        }`}
      >
        <div className="prose prose-sm max-w-none prose-invert prose-p:my-1 prose-pre:overflow-x-auto">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>

        <div
          className={`mt-2 flex items-center gap-2 text-[11px] ${
            isUser ? 'text-white/70' : 'text-[var(--sb-muted)]'
          }`}
        >
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-white/10"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  )
}

