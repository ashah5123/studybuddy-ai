'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Loader2, Plus } from 'lucide-react'
import { createFlashcard, createFlashcardDeck } from '@/lib/supabase/mutations'
import type { FlashcardDeck } from '@/types/database.types'

export type DeckRow = FlashcardDeck & { card_count: number }

export function FlashcardsManager({ initialDecks }: { initialDecks: DeckRow[] }) {
  const router = useRouter()
  const [decks, setDecks] = useState(initialDecks)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [savingDeck, setSavingDeck] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const [savingCard, setSavingCard] = useState(false)

  useEffect(() => {
    setDecks(initialDecks)
  }, [initialDecks])

  useEffect(() => {
    setQ('')
    setA('')
  }, [openId])

  async function handleCreateDeck(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSavingDeck(true)
    const res = await createFlashcardDeck(name, description || null)
    setSavingDeck(false)
    if (!res.success) {
      setError(res.error)
      return
    }
    setName('')
    setDescription('')
    router.refresh()
  }

  async function handleAddCard(deckId: string) {
    setError(null)
    setSavingCard(true)
    const res = await createFlashcard(deckId, q, a)
    setSavingCard(false)
    if (!res.success) {
      setError(res.error)
      return
    }
    setQ('')
    setA('')
    setDecks((prev) =>
      prev.map((d) =>
        d.id === deckId ? { ...d, card_count: d.card_count + 1 } : d
      )
    )
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreateDeck} className="sb-panel space-y-4 p-6">
        <h2 className="font-semibold text-[var(--foreground)]">New deck</h2>
        {error && (
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-200">
            {error}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="deck-name" className="sb-label">
              Name
            </label>
            <input
              id="deck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sb-input"
              placeholder="Biology — cell structure"
              required
            />
          </div>
          <div>
            <label htmlFor="deck-desc" className="sb-label">
              Description (optional)
            </label>
            <input
              id="deck-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sb-input"
              placeholder="Midterm review"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={savingDeck || !name.trim()}
          className="sb-btn-primary-inline"
        >
          {savingDeck ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create deck
        </button>
      </form>

      <div className="sb-panel overflow-hidden">
        <div className="border-b border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-5 py-4">
          <h2 className="font-semibold text-[var(--foreground)]">Your decks</h2>
          <p className="mt-0.5 text-xs text-[var(--sb-muted)]">
            {decks.length} deck{decks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ul className="divide-y divide-white/5">
          {decks.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-[var(--sb-muted)]">
              No flashcard decks yet. Create one above.
            </li>
          )}
          {decks.map((deck) => {
            const open = openId === deck.id
            return (
              <li key={deck.id} className="bg-transparent">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : deck.id)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--sb-item-bg)]"
                >
                  {open ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[rgba(148,163,184,0.85)]" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[rgba(148,163,184,0.85)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--foreground)]">{deck.name}</p>
                    {deck.description && (
                      <p className="truncate text-sm text-[var(--sb-muted)]">{deck.description}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-[rgba(148,163,184,0.85)]">
                    {deck.card_count} cards
                  </span>
                </button>
                {open && (
                  <div className="space-y-3 border-t border-[var(--sb-border)] bg-[var(--sb-item-bg)] px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sb-muted)]">
                      Add a card
                    </p>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="sb-input"
                      placeholder="Question"
                    />
                    <textarea
                      value={a}
                      onChange={(e) => setA(e.target.value)}
                      rows={2}
                      className="sb-input resize-y"
                      placeholder="Answer"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddCard(deck.id)}
                      disabled={savingCard || !q.trim() || !a.trim()}
                      className="sb-btn-primary-inline px-4 py-2 text-sm font-medium"
                    >
                      {savingCard ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add to deck
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
