import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, QuestionEmbeddingInsert, SemanticMatch } from './types'
import { generateEmbedding } from './gemini'

type DB = SupabaseClient<Database>

const SIMILARITY_THRESHOLD = 0.85
const MAX_RESULTS = 5

// ────────────────────────────────────────────────────────────
// Save an embedding for a question
// ────────────────────────────────────────────────────────────

export async function saveQuestionEmbedding(
  db: DB,
  params: { questionId: string; userId: string; questionText: string }
): Promise<void> {
  const embedding = await generateEmbedding(params.questionText)

  const payload: QuestionEmbeddingInsert = {
    question_id: params.questionId,
    user_id: params.userId,
    embedding,
  }

  const { error } = await db
    .from('question_embeddings')
    .upsert(payload, { onConflict: 'question_id' })

  if (error) throw error
}

// ────────────────────────────────────────────────────────────
// Search for similar past questions
// Returns up to MAX_RESULTS matches above SIMILARITY_THRESHOLD,
// ordered by descending similarity.
// ────────────────────────────────────────────────────────────

export async function findSimilarQuestions(
  db: DB,
  params: {
    userId: string
    queryText: string
    threshold?: number
    limit?: number
  }
): Promise<SemanticMatch[]> {
  const threshold = params.threshold ?? SIMILARITY_THRESHOLD
  const limit = params.limit ?? MAX_RESULTS

  const queryEmbedding = await generateEmbedding(params.queryText)

  const { data, error } = await db.rpc('match_question_embeddings', {
    query_embedding: queryEmbedding,
    query_user_id: params.userId,
    match_threshold: threshold,
    match_count: limit,
  })

  if (error) throw error
  if (!data || data.length === 0) return []

  const questionIds = data.map((row) => row.question_id)

  const { data: questions, error: qError } = await db
    .from('questions')
    .select('*')
    .in('id', questionIds)

  if (qError) throw qError
  if (!questions || questions.length === 0) return []

  const questionMap = new Map(questions.map((q) => [q.id, q]))

  return data
    .map((row) => {
      const question = questionMap.get(row.question_id)
      if (!question) return null
      return { question, similarity: row.similarity }
    })
    .filter((match): match is SemanticMatch => match !== null)
    .sort((a, b) => b.similarity - a.similarity)
}

// ────────────────────────────────────────────────────────────
// Return the best cached answer if similarity is above threshold
// Returns null if no sufficiently similar past question exists.
// ────────────────────────────────────────────────────────────

export async function getCachedAnswer(
  db: DB,
  params: {
    userId: string
    queryText: string
    threshold?: number
  }
): Promise<{ answer: string; similarity: number } | null> {
  const matches = await findSimilarQuestions(db, {
    ...params,
    limit: 1,
  })

  if (matches.length === 0) return null

  const best = matches[0]
  if (!best.question.ai_response) return null

  return {
    answer: best.question.ai_response,
    similarity: best.similarity,
  }
}

// ────────────────────────────────────────────────────────────
// Delete the embedding for a question
// ────────────────────────────────────────────────────────────

export async function deleteQuestionEmbedding(
  db: DB,
  questionId: string
): Promise<void> {
  const { error } = await db
    .from('question_embeddings')
    .delete()
    .eq('question_id', questionId)

  if (error) throw error
}
