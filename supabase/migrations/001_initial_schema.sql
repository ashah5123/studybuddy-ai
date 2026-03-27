-- ============================================================
-- 001_initial_schema.sql
-- Initial database schema for StudyBuddy
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Extensions
-- ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- users
-- ────────────────────────────────────────────────────────────
create table public.users (
  id            uuid        primary key references auth.users (id) on delete cascade,
  email         text        not null unique,
  name          text,
  avatar_url    text,
  plan          text        not null default 'free' check (plan in ('free', 'pro')),
  questions_today int       not null default 0,
  streak        int         not null default 0,
  last_active   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: select own row"
  on public.users for select
  using (id = auth.uid());

create policy "users: insert own row"
  on public.users for insert
  with check (id = auth.uid());

create policy "users: update own row"
  on public.users for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users: delete own row"
  on public.users for delete
  using (id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- questions
-- ────────────────────────────────────────────────────────────
create table public.questions (
  id            uuid        primary key default uuid_generate_v4(),
  user_id       uuid        not null references public.users (id) on delete cascade,
  subject       text        not null,
  question_text text        not null,
  has_image     boolean     not null default false,
  image_url     text,
  ai_response   text,
  created_at    timestamptz not null default now()
);

create index questions_user_id_idx on public.questions (user_id);
create index questions_created_at_idx on public.questions (created_at desc);

alter table public.questions enable row level security;

create policy "questions: select own rows"
  on public.questions for select
  using (user_id = auth.uid());

create policy "questions: insert own rows"
  on public.questions for insert
  with check (user_id = auth.uid());

create policy "questions: update own rows"
  on public.questions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "questions: delete own rows"
  on public.questions for delete
  using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- quizzes
-- ────────────────────────────────────────────────────────────
create table public.quizzes (
  id           uuid        primary key default uuid_generate_v4(),
  question_id  uuid        not null references public.questions (id) on delete cascade,
  user_id      uuid        not null references public.users (id) on delete cascade,
  quiz_data    jsonb       not null default '{}',
  score        int,
  completed_at timestamptz
);

create index quizzes_user_id_idx on public.quizzes (user_id);
create index quizzes_question_id_idx on public.quizzes (question_id);

alter table public.quizzes enable row level security;

create policy "quizzes: select own rows"
  on public.quizzes for select
  using (user_id = auth.uid());

create policy "quizzes: insert own rows"
  on public.quizzes for insert
  with check (user_id = auth.uid());

create policy "quizzes: update own rows"
  on public.quizzes for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "quizzes: delete own rows"
  on public.quizzes for delete
  using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- subscriptions
-- ────────────────────────────────────────────────────────────
create table public.subscriptions (
  id                     uuid        primary key default uuid_generate_v4(),
  user_id                uuid        not null references public.users (id) on delete cascade,
  stripe_customer_id     text        not null unique,
  stripe_subscription_id text        unique,
  plan                   text        not null default 'free' check (plan in ('free', 'pro')),
  status                 text        not null default 'inactive',
  current_period_end     timestamptz
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions: select own rows"
  on public.subscriptions for select
  using (user_id = auth.uid());

create policy "subscriptions: insert own rows"
  on public.subscriptions for insert
  with check (user_id = auth.uid());

create policy "subscriptions: update own rows"
  on public.subscriptions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "subscriptions: delete own rows"
  on public.subscriptions for delete
  using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Trigger: auto-create user profile on sign-up
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ────────────────────────────────────────────────────────────
-- Trigger: reset questions_today at midnight (UTC)
-- Call this via a Supabase cron job:
--   select cron.schedule('reset-daily-questions', '0 0 * * *',
--     'update public.users set questions_today = 0');
-- ────────────────────────────────────────────────────────────
