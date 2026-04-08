import { createClient } from '@/lib/supabase/server'
import type { QuizQuestion } from '@/types/database.types'

export async function quizToFlashcards(
  quizId: string,
  deckName: string,
  onlyMissed = false
): Promise<{ deckId: string; createdCount: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id')
    .eq('id', quizId)
    .eq('user_id', user.id)
    .single()
  if (!quiz) throw new Error('Quiz not found')

  const { data: allQuestions, error: qErr } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
  if (qErr) throw new Error(qErr.message)

  let questions = (allQuestions as QuizQuestion[]) ?? []
  if (onlyMissed) {
    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('quiz_id', quizId)
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(1)
    const attemptId = attempts?.[0]?.id
    if (attemptId) {
      const { data: responses } = await supabase
        .from('quiz_responses')
        .select('question_id, is_correct')
        .eq('attempt_id', attemptId)
      const missedIds = new Set(
        (responses ?? []).filter((r) => !r.is_correct).map((r) => r.question_id)
      )
      questions = questions.filter((q) => missedIds.has(q.id))
    }
  }

  const { data: deck, error: deckErr } = await supabase
    .from('flashcard_decks')
    .insert({
      user_id: user.id,
      name: deckName.trim() || 'Quiz Review Deck',
      description: `Auto-generated from quiz ${quizId}`,
      course_id: null,
    })
    .select('id')
    .single()
  if (deckErr || !deck) throw new Error(deckErr?.message ?? 'Failed to create flashcard deck')

  if (questions.length === 0) return { deckId: deck.id, createdCount: 0 }

  const now = new Date().toISOString()
  const { error: cardErr } = await supabase.from('flashcards').insert(
    questions.map((q) => ({
      deck_id: deck.id,
      question: q.question_text,
      answer: `${q.correct_answer}${q.explanation ? `\n\n${q.explanation}` : ''}`,
      difficulty: 'medium',
      next_review: now,
      review_count: 0,
      last_reviewed: null,
    }))
  )
  if (cardErr) throw new Error(cardErr.message)

  return { deckId: deck.id, createdCount: questions.length }
}

