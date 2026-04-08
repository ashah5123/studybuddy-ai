import { NextResponse } from 'next/server'
import { quizToFlashcards } from '@/lib/ai/quizToFlashcards'

export async function POST(request: Request) {
  const body = (await request.json()) as {
    quizId?: string
    deckName?: string
    onlyMissed?: boolean
  }
  if (!body.quizId) return NextResponse.json({ error: 'quizId is required' }, { status: 400 })

  try {
    const res = await quizToFlashcards(
      body.quizId,
      body.deckName ?? 'Quiz Review Deck',
      Boolean(body.onlyMissed)
    )
    return NextResponse.json(res)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create flashcards' },
      { status: 500 }
    )
  }
}

