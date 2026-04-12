-- Quiz generator tables (user-owned).

CREATE TABLE IF NOT EXISTS public.quizzes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id        UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  title            TEXT        NOT NULL,
  source_file_url  TEXT,
  total_questions  INTEGER     NOT NULL DEFAULT 0 CHECK (total_questions >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id         UUID        NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text   TEXT        NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')),
  options         JSONB       NOT NULL DEFAULT '[]'::jsonb,
  correct_answer  TEXT        NOT NULL,
  explanation     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id            UUID        NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id            UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score              NUMERIC(5,2) NOT NULL DEFAULT 0,
  completed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_taken_seconds INTEGER     NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id   UUID        NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id  UUID        NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  user_answer  TEXT,
  is_correct   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_user ON public.quizzes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts (user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_attempt ON public.quiz_responses (attempt_id);

DROP TRIGGER IF EXISTS trg_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER trg_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quizzes_select" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_insert" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_update" ON public.quizzes;
DROP POLICY IF EXISTS "quizzes_delete" ON public.quizzes;

CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "quizzes_update" ON public.quizzes FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "quizzes_delete" ON public.quizzes FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "quiz_questions_select" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_insert" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_update" ON public.quiz_questions;
DROP POLICY IF EXISTS "quiz_questions_delete" ON public.quiz_questions;

CREATE POLICY "quiz_questions_select"
  ON public.quiz_questions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND q.user_id = auth.uid()
    )
  );
CREATE POLICY "quiz_questions_insert"
  ON public.quiz_questions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND q.user_id = auth.uid()
    )
  );
CREATE POLICY "quiz_questions_update"
  ON public.quiz_questions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND q.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND q.user_id = auth.uid()
    )
  );
CREATE POLICY "quiz_questions_delete"
  ON public.quiz_questions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      WHERE q.id = quiz_id
        AND q.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "quiz_attempts_select" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_insert" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_update" ON public.quiz_attempts;
DROP POLICY IF EXISTS "quiz_attempts_delete" ON public.quiz_attempts;

CREATE POLICY "quiz_attempts_select" ON public.quiz_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "quiz_attempts_insert" ON public.quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "quiz_attempts_update" ON public.quiz_attempts FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "quiz_attempts_delete" ON public.quiz_attempts FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "quiz_responses_select" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_insert" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_update" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_responses_delete" ON public.quiz_responses;

CREATE POLICY "quiz_responses_select"
  ON public.quiz_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.user_id = auth.uid()
    )
  );
CREATE POLICY "quiz_responses_insert"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.user_id = auth.uid()
    )
  );
CREATE POLICY "quiz_responses_update"
  ON public.quiz_responses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.user_id = auth.uid()
    )
  );
CREATE POLICY "quiz_responses_delete"
  ON public.quiz_responses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.quiz_attempts qa
      WHERE qa.id = attempt_id
        AND qa.user_id = auth.uid()
    )
  );

