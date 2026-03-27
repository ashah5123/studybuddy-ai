// ─── User & Auth ─────────────────────────────────────────────────────────────
export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

// ─── Study Sets ───────────────────────────────────────────────────────────────
export type StudySet = {
  id: string
  user_id: string
  title: string
  description: string | null
  subject: string | null
  created_at: string
  updated_at: string
  _count?: { flashcards: number }
}

// ─── Flashcards ───────────────────────────────────────────────────────────────
export type Flashcard = {
  id: string
  study_set_id: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard' | null
  created_at: string
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation: string | null
}

export type QuizResult = {
  id: string
  user_id: string
  study_set_id: string
  score: number
  total: number
  completed_at: string
}

// ─── Billing ──────────────────────────────────────────────────────────────────
export type Plan = 'free' | 'pro'

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
