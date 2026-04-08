-- ============================================================
-- StudyBuddy AI - Initial Database Schema
-- ============================================================

-- ============================================================
-- UTILITY: updated_at trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
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

CREATE TABLE profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT        UNIQUE NOT NULL,
  full_name        TEXT,
  avatar_url       TEXT,
  subscription_tier TEXT       NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create a profile row whenever a new user signs up.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- TABLE: courses
-- Organizes a user's subjects/classes for grouping content.
-- ============================================================

CREATE TABLE courses (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  color      TEXT        NOT NULL DEFAULT '#3B82F6',
  emoji      TEXT        NOT NULL DEFAULT '📚',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_courses_user_id ON courses(user_id);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: assignments
-- Tracks homework, exams, projects, and quizzes with due dates.
-- ============================================================

CREATE TABLE assignments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id   UUID        REFERENCES courses(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  type        TEXT        CHECK (type IN ('homework', 'exam', 'project', 'quiz')),
  due_date    TIMESTAMPTZ,
  completed   BOOLEAN     NOT NULL DEFAULT false,
  priority    TEXT        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assignments_user_id   ON assignments(user_id);
CREATE INDEX idx_assignments_course_id ON assignments(course_id);

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: conversations
-- Groups AI chat messages into named sessions by subject.
-- ============================================================

CREATE TABLE conversations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  subject    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: messages
-- Stores individual AI chat messages within a conversation.
-- ============================================================

CREATE TABLE messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);


-- ============================================================
-- TABLE: notes
-- Rich-text notes, optionally linked to a course or YouTube video.
-- ============================================================

CREATE TABLE notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id  UUID        REFERENCES courses(id) ON DELETE SET NULL,
  title      TEXT        NOT NULL,
  content    JSONB,
  source     TEXT        NOT NULL CHECK (source IN ('manual', 'ai-generated')),
  video_url  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id   ON notes(user_id);
CREATE INDEX idx_notes_course_id ON notes(course_id);

CREATE TRIGGER trg_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: flashcard_decks
-- Named collections of flashcards, optionally tied to a course.
-- ============================================================

CREATE TABLE flashcard_decks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id   UUID        REFERENCES courses(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcard_decks_user_id ON flashcard_decks(user_id);

CREATE TRIGGER trg_flashcard_decks_updated_at
  BEFORE UPDATE ON flashcard_decks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: flashcards
-- Individual Q&A cards with spaced-repetition metadata.
-- ============================================================

CREATE TABLE flashcards (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id      UUID        NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  question     TEXT        NOT NULL,
  answer       TEXT        NOT NULL,
  difficulty   TEXT        NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  next_review  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  review_count INTEGER     NOT NULL DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);

CREATE TRIGGER trg_flashcards_updated_at
  BEFORE UPDATE ON flashcards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- TABLE: study_sessions
-- Records completed study sessions for analytics and streaks.
-- ============================================================

CREATE TABLE study_sessions (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id        UUID        REFERENCES courses(id) ON DELETE SET NULL,
  duration_minutes INTEGER     NOT NULL,
  session_type     TEXT        NOT NULL CHECK (session_type IN ('homework', 'flashcards', 'reading', 'video')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_study_sessions_user_id ON study_sessions(user_id);


-- ============================================================
-- TABLE: usage_tracking
-- One row per user per day; tracks AI feature usage for limits.
-- ============================================================

CREATE TABLE usage_tracking (
  id                       UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date                     DATE    NOT NULL DEFAULT CURRENT_DATE,
  ai_questions_count       INTEGER NOT NULL DEFAULT 0,
  video_conversions_count  INTEGER NOT NULL DEFAULT 0,
  flashcards_created_count INTEGER NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, date)
);

CREATE INDEX idx_usage_tracking_user_id_date ON usage_tracking(user_id, date);

CREATE TRIGGER trg_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking  ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (id = auth.uid());

-- courses
CREATE POLICY "courses_select" ON courses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "courses_insert" ON courses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "courses_update" ON courses FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "courses_delete" ON courses FOR DELETE USING (user_id = auth.uid());

-- assignments
CREATE POLICY "assignments_select" ON assignments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "assignments_insert" ON assignments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignments_update" ON assignments FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "assignments_delete" ON assignments FOR DELETE USING (user_id = auth.uid());

-- conversations
CREATE POLICY "conversations_select" ON conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_update" ON conversations FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "conversations_delete" ON conversations FOR DELETE USING (user_id = auth.uid());

-- messages: access is gated on owning the parent conversation
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_update" ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );
CREATE POLICY "messages_delete" ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.user_id = auth.uid()
    )
  );

-- notes
CREATE POLICY "notes_select" ON notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notes_insert" ON notes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes_update" ON notes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notes_delete" ON notes FOR DELETE USING (user_id = auth.uid());

-- flashcard_decks
CREATE POLICY "flashcard_decks_select" ON flashcard_decks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "flashcard_decks_insert" ON flashcard_decks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "flashcard_decks_update" ON flashcard_decks FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "flashcard_decks_delete" ON flashcard_decks FOR DELETE USING (user_id = auth.uid());

-- flashcards: access is gated on owning the parent deck
CREATE POLICY "flashcards_select" ON flashcards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
        AND flashcard_decks.user_id = auth.uid()
    )
  );
CREATE POLICY "flashcards_insert" ON flashcards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
        AND flashcard_decks.user_id = auth.uid()
    )
  );
CREATE POLICY "flashcards_update" ON flashcards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
        AND flashcard_decks.user_id = auth.uid()
    )
  );
CREATE POLICY "flashcards_delete" ON flashcards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks
      WHERE flashcard_decks.id = flashcards.deck_id
        AND flashcard_decks.user_id = auth.uid()
    )
  );

-- study_sessions
CREATE POLICY "study_sessions_select" ON study_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "study_sessions_insert" ON study_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "study_sessions_update" ON study_sessions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "study_sessions_delete" ON study_sessions FOR DELETE USING (user_id = auth.uid());

-- usage_tracking
CREATE POLICY "usage_tracking_select" ON usage_tracking FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "usage_tracking_insert" ON usage_tracking FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "usage_tracking_update" ON usage_tracking FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "usage_tracking_delete" ON usage_tracking FOR DELETE USING (user_id = auth.uid());
