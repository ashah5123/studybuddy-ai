-- Schedule planner: user-owned calendar blocks with custom highlight colors.

CREATE TABLE IF NOT EXISTS public.schedule_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id   UUID        REFERENCES public.courses(id) ON DELETE SET NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  starts_at   TIMESTAMPTZ NOT NULL,
  ends_at     TIMESTAMPTZ NOT NULL,
  color       TEXT        NOT NULL DEFAULT '#6366f1',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT schedule_events_ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_schedule_events_user_range
  ON public.schedule_events (user_id, starts_at);

DROP TRIGGER IF EXISTS trg_schedule_events_updated_at ON public.schedule_events;
CREATE TRIGGER trg_schedule_events_updated_at
  BEFORE UPDATE ON public.schedule_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "schedule_events_select" ON public.schedule_events;
DROP POLICY IF EXISTS "schedule_events_insert" ON public.schedule_events;
DROP POLICY IF EXISTS "schedule_events_update" ON public.schedule_events;
DROP POLICY IF EXISTS "schedule_events_delete" ON public.schedule_events;

CREATE POLICY "schedule_events_select" ON public.schedule_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "schedule_events_insert" ON public.schedule_events FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "schedule_events_update" ON public.schedule_events FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "schedule_events_delete" ON public.schedule_events FOR DELETE USING (user_id = auth.uid());
