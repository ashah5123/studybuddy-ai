-- AI Smart Study Scheduler tables.

CREATE TABLE IF NOT EXISTS public.study_plans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT study_plans_dates_valid CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.study_plan_tasks (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID        NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
  date              DATE        NOT NULL,
  course_id         UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  topic             TEXT        NOT NULL,
  duration_minutes  INTEGER     NOT NULL CHECK (duration_minutes > 0),
  completed         BOOLEAN     NOT NULL DEFAULT FALSE,
  priority          TEXT        NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user_dates
  ON public.study_plans (user_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_study_plan_tasks_plan_date
  ON public.study_plan_tasks (plan_id, date);

DROP TRIGGER IF EXISTS trg_study_plans_updated_at ON public.study_plans;
CREATE TRIGGER trg_study_plans_updated_at
  BEFORE UPDATE ON public.study_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_study_plan_tasks_updated_at ON public.study_plan_tasks;
CREATE TRIGGER trg_study_plan_tasks_updated_at
  BEFORE UPDATE ON public.study_plan_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_plans_select" ON public.study_plans;
DROP POLICY IF EXISTS "study_plans_insert" ON public.study_plans;
DROP POLICY IF EXISTS "study_plans_update" ON public.study_plans;
DROP POLICY IF EXISTS "study_plans_delete" ON public.study_plans;

CREATE POLICY "study_plans_select"
  ON public.study_plans
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "study_plans_insert"
  ON public.study_plans
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "study_plans_update"
  ON public.study_plans
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "study_plans_delete"
  ON public.study_plans
  FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "study_plan_tasks_select" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "study_plan_tasks_insert" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "study_plan_tasks_update" ON public.study_plan_tasks;
DROP POLICY IF EXISTS "study_plan_tasks_delete" ON public.study_plan_tasks;

CREATE POLICY "study_plan_tasks_select"
  ON public.study_plan_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_plans p
      WHERE p.id = plan_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "study_plan_tasks_insert"
  ON public.study_plan_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.study_plans p
      WHERE p.id = plan_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "study_plan_tasks_update"
  ON public.study_plan_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_plans p
      WHERE p.id = plan_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.study_plans p
      WHERE p.id = plan_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "study_plan_tasks_delete"
  ON public.study_plan_tasks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.study_plans p
      WHERE p.id = plan_id
        AND p.user_id = auth.uid()
    )
  );

