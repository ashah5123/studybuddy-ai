-- ============================================================
-- StudyBuddy AI - Initial Database Schema
-- ============================================================
-- Safe to re-run: IF NOT EXISTS tables/indexes, DROP TRIGGER/POLICY IF EXISTS.
-- Run in Supabase → SQL Editor.
--
-- Fixes for Auth signup:
-- - public.handle_new_user() uses SECURITY DEFINER + SET search_path = public
--   so the trigger reliably inserts into public.profiles (Supabase-recommended).
-- - Drop trigger before create so you can re-run the auth hook section.
-- ============================================================

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- TABLE: profiles
-- Stores public user profile data, linked 1:1 to auth.users.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT        UNIQUE NOT NULL,
  full_name        TEXT,
  avatar_url       TEXT,
  subscription_tier TEXT       NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Hosted Supabase: allow Auth admin to touch profiles during user lifecycle (optional but safe)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin;

-- Auto-create a profile row whenever a new user signs up.
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TABLE: courses
-- Organizes a user's subjects/classes for grouping content.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.courses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#3B82F6',
  emoji      TEXT        NOT NULL DEFAULT '📚',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- TABLE: assignments
-- Tracks homework, exams, projects, and quizzes with due dates.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  type        TEXT        CHECK (type IN ('homework', 'exam', 'project', 'quiz')),
  due_date    TIMESTAMPTZ,
  completed   BOOLEAN     NOT NULL DEFAULT false,
  priority    TEXT        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_user_id   ON public.assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);

DROP TRIGGER IF EXISTS trg_assignments_updated_at ON public.assignments;
CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- TABLE: conversations
-- Groups AI chat messages into named sessions by subject.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  subject    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

DROP TRIGGER IF EXISTS trg_conversations_updated_at ON public.conversations;
CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- TABLE: messages
-- Stores individual AI chat messages within a conversation.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);


-- ============================================================
-- TABLE: notes
-- Rich-text notes, optionally linked to a course or YouTube video.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id  UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  title      TEXT        NOT NULL,
  content    JSONB,
  source     TEXT        NOT NULL CHECK (source IN ('manual', 'ai-generated')),
  video_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id   ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_course_id ON public.notes(course_id);

DROP TRIGGER IF EXISTS trg_notes_updated_at ON public.notes;
CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- TABLE: flashcard_decks
-- Named collections of flashcards, optionally tied to a course.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcard_decks_user_id ON public.flashcard_decks(user_id);

DROP TRIGGER IF EXISTS trg_flashcard_decks_updated_at ON public.flashcard_decks;
CREATE TRIGGER trg_flashcard_decks_updated_at
  BEFORE UPDATE ON public.flashcard_decks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- TABLE: flashcards
-- Individual Q&A cards with spaced-repetition metadata.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.flashcards (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id      UUID        NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  question     TEXT        NOT NULL,
  answer       TEXT        NOT NULL,
  difficulty   TEXT        NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  next_review  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review_count INTEGER     NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);

DROP TRIGGER IF EXISTS trg_flashcards_updated_at ON public.flashcards;
CREATE TRIGGER trg_flashcards_updated_at
  BEFORE UPDATE ON public.flashcards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- TABLE: study_sessions
-- Records completed study sessions for analytics and streaks.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.study_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id        UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  duration_minutes INTEGER     NOT NULL,
  session_type     TEXT        NOT NULL CHECK (session_type IN ('homework', 'flashcards', 'reading', 'video')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);


-- ============================================================
-- TABLE: usage_tracking
-- One row per user per day; tracks AI feature usage for limits.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID    NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date                     DATE    NOT NULL DEFAULT CURRENT_DATE,
  ai_questions_count       INTEGER NOT NULL DEFAULT 0,
  video_conversions_count  INTEGER NOT NULL DEFAULT 0,
  flashcards_created_count INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id_date ON public.usage_tracking(user_id, date);

DROP TRIGGER IF EXISTS trg_usage_tracking_updated_at ON public.usage_tracking;
CREATE TRIGGER trg_usage_tracking_updated_at
  BEFORE UPDATE ON public.usage_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking  ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (id = auth.uid());

-- courses
DROP POLICY IF EXISTS "courses_select" ON public.courses;
DROP POLICY IF EXISTS "courses_insert" ON public.courses;
DROP POLICY IF EXISTS "courses_update" ON public.courses;
DROP POLICY IF EXISTS "courses_delete" ON public.courses;
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "courses_insert" ON public.courses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "courses_update" ON public.courses FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "courses_delete" ON public.courses FOR DELETE USING (user_id = auth.uid());

-- assignments
DROP POLICY IF EXISTS "assignments_select" ON public.assignments;
DROP POLICY IF EXISTS "assignments_insert" ON public.assignments;
DROP POLICY IF EXISTS "assignments_update" ON public.assignments;
DROP POLICY IF EXISTS "assignments_delete" ON public.assignments;
CREATE POLICY "assignments_select" ON public.assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "assignments_insert" ON public.assignments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignments_update" ON public.assignments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignments_delete" ON public.assignments FOR DELETE USING (user_id = auth.uid());

-- conversations
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;
DROP POLICY IF EXISTS "conversations_delete" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_delete" ON public.conversations FOR DELETE USING (user_id = auth.uid());

-- messages: access is gated on owning the parent conversation
DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;
DROP POLICY IF EXISTS "messages_delete" ON public.messages;
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE public.conversations.id = public.messages.conversation_id
        AND public.conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE public.conversations.id = public.messages.conversation_id
        AND public.conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_update" ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE public.conversations.id = public.messages.conversation_id
        AND public.conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_delete" ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE public.conversations.id = public.messages.conversation_id
        AND public.conversations.user_id = auth.uid()
    )
  );

-- notes
DROP POLICY IF EXISTS "notes_select" ON public.notes;
DROP POLICY IF EXISTS "notes_insert" ON public.notes;
DROP POLICY IF EXISTS "notes_update" ON public.notes;
DROP POLICY IF EXISTS "notes_delete" ON public.notes;
CREATE POLICY "notes_select" ON public.notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notes_insert" ON public.notes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes_update" ON public.notes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes_delete" ON public.notes FOR DELETE USING (user_id = auth.uid());

-- flashcard_decks
DROP POLICY IF EXISTS "flashcard_decks_select" ON public.flashcard_decks;
DROP POLICY IF EXISTS "flashcard_decks_insert" ON public.flashcard_decks;
DROP POLICY IF EXISTS "flashcard_decks_update" ON public.flashcard_decks;
DROP POLICY IF EXISTS "flashcard_decks_delete" ON public.flashcard_decks;
CREATE POLICY "flashcard_decks_select" ON public.flashcard_decks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "flashcard_decks_insert" ON public.flashcard_decks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "flashcard_decks_update" ON public.flashcard_decks FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "flashcard_decks_delete" ON public.flashcard_decks FOR DELETE USING (user_id = auth.uid());

-- flashcards: access is gated on owning the parent deck
DROP POLICY IF EXISTS "flashcards_select" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_insert" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_update" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_delete" ON public.flashcards;
CREATE POLICY "flashcards_select" ON public.flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE public.flashcard_decks.id = public.flashcards.deck_id
        AND public.flashcard_decks.user_id = auth.uid()
    )
  );
CREATE POLICY "flashcards_insert" ON public.flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE public.flashcard_decks.id = public.flashcards.deck_id
        AND public.flashcard_decks.user_id = auth.uid()
    )
  );
CREATE POLICY "flashcards_update" ON public.flashcards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE public.flashcard_decks.id = public.flashcards.deck_id
        AND public.flashcard_decks.user_id = auth.uid()
    )
  );
CREATE POLICY "flashcards_delete" ON public.flashcards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.flashcard_decks
      WHERE public.flashcard_decks.id = public.flashcards.deck_id
        AND public.flashcard_decks.user_id = auth.uid()
    )
  );

-- study_sessions
DROP POLICY IF EXISTS "study_sessions_select" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_insert" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_update" ON public.study_sessions;
DROP POLICY IF EXISTS "study_sessions_delete" ON public.study_sessions;
CREATE POLICY "study_sessions_select" ON public.study_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "study_sessions_insert" ON public.study_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "study_sessions_update" ON public.study_sessions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "study_sessions_delete" ON public.study_sessions FOR DELETE USING (user_id = auth.uid());

-- usage_tracking
DROP POLICY IF EXISTS "usage_tracking_select" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_insert" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_update" ON public.usage_tracking;
DROP POLICY IF EXISTS "usage_tracking_delete" ON public.usage_tracking;
CREATE POLICY "usage_tracking_select" ON public.usage_tracking FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "usage_tracking_insert" ON public.usage_tracking FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "usage_tracking_update" ON public.usage_tracking FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "usage_tracking_delete" ON public.usage_tracking FOR DELETE USING (user_id = auth.uid());
