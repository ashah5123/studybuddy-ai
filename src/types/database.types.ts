// ──────────────────────────────────────────────────────────────
// Enums
// ──────────────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro'

export type AssignmentType = 'homework' | 'exam' | 'project' | 'quiz'

export type Priority = 'low' | 'medium' | 'high'

export type MessageRole = 'user' | 'assistant'

export type NoteSource = 'manual' | 'ai-generated'

export type FlashcardDifficulty = 'easy' | 'medium' | 'hard'

export type SessionType = 'homework' | 'flashcards' | 'reading' | 'video'

// ──────────────────────────────────────────────────────────────
// Table row types
// ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string                  // UUID, references auth.users
  email: string
  full_name: string | null
  avatar_url: string | null
  subscription_tier: SubscriptionTier
  created_at: string          // ISO 8601 timestamp
  updated_at: string
}

export interface Course {
  id: string
  user_id: string             // references profiles.id
  name: string
  color: string
  emoji: string
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  user_id: string             // references profiles.id
  course_id: string | null    // references courses.id
  title: string
  description: string | null
  type: AssignmentType | null
  due_date: string | null
  completed: boolean
  priority: Priority
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  user_id: string             // references profiles.id
  title: string
  subject: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string     // references conversations.id
  role: MessageRole
  content: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string             // references profiles.id
  course_id: string | null    // references courses.id
  title: string
  content: Record<string, unknown> | null   // Tiptap JSON (JSONB)
  source: NoteSource
  video_url: string | null
  created_at: string
  updated_at: string
}

export interface FlashcardDeck {
  id: string
  user_id: string             // references profiles.id
  course_id: string | null    // references courses.id
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Flashcard {
  id: string
  deck_id: string             // references flashcard_decks.id
  question: string
  answer: string
  difficulty: FlashcardDifficulty
  next_review: string
  review_count: number
  last_reviewed: string | null
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  user_id: string             // references profiles.id
  course_id: string | null    // references courses.id
  duration_minutes: number
  session_type: SessionType
  created_at: string
}

export interface UsageTracking {
  id: string
  user_id: string             // references profiles.id
  date: string                // ISO 8601 date (YYYY-MM-DD)
  ai_questions_count: number
  video_conversions_count: number
  flashcards_created_count: number
  created_at: string
  updated_at: string
}

// ──────────────────────────────────────────────────────────────
// Database shape (passed as the generic to createClient)
// ──────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'> &
          Partial<Pick<Profile, 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Profile, 'id'>>
      }
      courses: {
        Row: Course
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Course, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Course, 'id'>>
      }
      assignments: {
        Row: Assignment
        Insert: Omit<Assignment, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Assignment, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Assignment, 'id'>>
      }
      conversations: {
        Row: Conversation
        Insert: Omit<Conversation, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Conversation, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Conversation, 'id'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'> &
          Partial<Pick<Message, 'id' | 'created_at'>>
        Update: Partial<Omit<Message, 'id'>>
      }
      notes: {
        Row: Note
        Insert: Omit<Note, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Note, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Note, 'id'>>
      }
      flashcard_decks: {
        Row: FlashcardDeck
        Insert: Omit<FlashcardDeck, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<FlashcardDeck, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<FlashcardDeck, 'id'>>
      }
      flashcards: {
        Row: Flashcard
        Insert: Omit<Flashcard, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<Flashcard, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<Flashcard, 'id'>>
      }
      study_sessions: {
        Row: StudySession
        Insert: Omit<StudySession, 'id' | 'created_at'> &
          Partial<Pick<StudySession, 'id' | 'created_at'>>
        Update: Partial<Omit<StudySession, 'id'>>
      }
      usage_tracking: {
        Row: UsageTracking
        Insert: Omit<UsageTracking, 'id' | 'created_at' | 'updated_at'> &
          Partial<Pick<UsageTracking, 'id' | 'created_at' | 'updated_at'>>
        Update: Partial<Omit<UsageTracking, 'id'>>
      }
    }
  }
}
