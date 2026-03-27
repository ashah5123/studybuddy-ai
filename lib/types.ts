// ────────────────────────────────────────────────────────────
// Domain types
// ────────────────────────────────────────────────────────────

export type Subject = 'Math' | 'Science' | 'Coding' | 'History' | 'English' | 'Other'

export type AnalyticsEventType =
  | 'question_asked'
  | 'quiz_generated'
  | 'embedding_generated'
  | 'semantic_search'

// ────────────────────────────────────────────────────────────
// Database row types
// ────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro'

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
  | 'inactive'

export interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  plan: Plan
  questions_today: number
  streak: number
  last_active: string | null
  created_at: string
}

export interface Question {
  id: string
  user_id: string
  subject: string
  question_text: string
  has_image: boolean
  image_url: string | null
  ai_response: string | null
  created_at: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_index: number
  explanation?: string
}

export interface QuizData {
  questions: QuizQuestion[]
  subject: string
}

export interface Quiz {
  id: string
  question_id: string
  user_id: string
  quiz_data: QuizData
  score: number | null
  completed_at: string | null
}

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string
  stripe_subscription_id: string | null
  plan: Plan
  status: SubscriptionStatus
  current_period_end: string | null
}

// ────────────────────────────────────────────────────────────
// Insert / update payloads (omit server-generated fields)
// ────────────────────────────────────────────────────────────

export type UserInsert = Omit<User, 'questions_today' | 'streak' | 'created_at'> & {
  questions_today?: number
  streak?: number
}

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>

export type QuestionInsert = Omit<Question, 'id' | 'created_at'> & {
  id?: string
}

export type QuestionUpdate = Partial<Omit<Question, 'id' | 'user_id' | 'created_at'>>

export type QuizInsert = Omit<Quiz, 'id'>

export type QuizUpdate = Partial<Omit<Quiz, 'id' | 'user_id' | 'question_id'>>

export type SubscriptionInsert = Omit<Subscription, 'id'>

export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'user_id' | 'stripe_customer_id'>>

// ────────────────────────────────────────────────────────────
// Analytics
// ────────────────────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string
  user_id: string
  event_type: AnalyticsEventType
  subject: string | null
  plan: Plan
  session_id: string | null
  input_tokens: number | null
  output_tokens: number | null
  estimated_cost_usd: number | null
  metadata: Record<string, unknown>
  created_at: string
}

export type AnalyticsEventInsert = Omit<AnalyticsEvent, 'id' | 'created_at'> & {
  metadata?: Record<string, unknown>
}

export interface DailyQuestionStat {
  date: string
  count: number
}

export interface SubjectStat {
  subject: string
  count: number
}

export interface CostSummary {
  total_input_tokens: number
  total_output_tokens: number
  estimated_cost_usd: number
  api_calls: number
}

// ────────────────────────────────────────────────────────────
// Embeddings / semantic search
// ────────────────────────────────────────────────────────────

export interface QuestionEmbedding {
  id: string
  question_id: string
  user_id: string
  embedding: number[]
  created_at: string
}

export type QuestionEmbeddingInsert = Omit<QuestionEmbedding, 'id' | 'created_at'>

export interface SimilarQuestion {
  question_id: string
  similarity: number
}

export interface SemanticMatch {
  question: Question
  similarity: number
}

// ────────────────────────────────────────────────────────────
// Supabase database schema type (for createClient generic)
// ────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      questions: {
        Row: Question
        Insert: QuestionInsert
        Update: QuestionUpdate
      }
      quizzes: {
        Row: Quiz
        Insert: QuizInsert
        Update: QuizUpdate
      }
      subscriptions: {
        Row: Subscription
        Insert: SubscriptionInsert
        Update: SubscriptionUpdate
      }
      analytics_events: {
        Row: AnalyticsEvent
        Insert: AnalyticsEventInsert
        Update: Partial<AnalyticsEventInsert>
      }
      question_embeddings: {
        Row: QuestionEmbedding
        Insert: QuestionEmbeddingInsert
        Update: Partial<QuestionEmbeddingInsert>
      }
    }
    Functions: {
      match_question_embeddings: {
        Args: {
          query_embedding: number[]
          query_user_id: string
          match_threshold: number
          match_count: number
        }
        Returns: SimilarQuestion[]
      }
    }
  }
}
