-- ============================================================
-- 002_analytics_and_embeddings.sql
-- Analytics event tracking and vector embeddings for semantic search
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Extensions
-- ────────────────────────────────────────────────────────────
create extension if not exists vector;

-- ────────────────────────────────────────────────────────────
-- analytics_events
-- ────────────────────────────────────────────────────────────
create table public.analytics_events (
  id                  uuid           primary key default uuid_generate_v4(),
  user_id             uuid           not null references public.users (id) on delete cascade,
  event_type          text           not null,
  subject             text,
  plan                text           not null default 'free' check (plan in ('free', 'pro')),
  session_id          text,
  input_tokens        int,
  output_tokens       int,
  estimated_cost_usd  numeric(10, 8),
  metadata            jsonb          not null default '{}',
  created_at          timestamptz    not null default now()
);

create index analytics_events_user_id_idx    on public.analytics_events (user_id);
create index analytics_events_event_type_idx on public.analytics_events (event_type);
create index analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index analytics_events_subject_idx    on public.analytics_events (subject) where subject is not null;

alter table public.analytics_events enable row level security;

create policy "analytics_events: select own rows"
  on public.analytics_events for select
  using (user_id = auth.uid());

create policy "analytics_events: insert own rows"
  on public.analytics_events for insert
  with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- question_embeddings
-- text-embedding-004 produces 768-dimensional vectors
-- ────────────────────────────────────────────────────────────
create table public.question_embeddings (
  id          uuid        primary key default uuid_generate_v4(),
  question_id uuid        not null unique references public.questions (id) on delete cascade,
  user_id     uuid        not null references public.users (id) on delete cascade,
  embedding   vector(768) not null,
  created_at  timestamptz not null default now()
);

create index question_embeddings_user_id_idx     on public.question_embeddings (user_id);
create index question_embeddings_embedding_idx
  on public.question_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

alter table public.question_embeddings enable row level security;

create policy "question_embeddings: select own rows"
  on public.question_embeddings for select
  using (user_id = auth.uid());

create policy "question_embeddings: insert own rows"
  on public.question_embeddings for insert
  with check (user_id = auth.uid());

create policy "question_embeddings: delete own rows"
  on public.question_embeddings for delete
  using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- Similarity search function
-- Returns question_ids whose cosine similarity to the query
-- vector exceeds match_threshold, ordered closest first.
-- ────────────────────────────────────────────────────────────
create or replace function match_question_embeddings(
  query_embedding  vector(768),
  query_user_id    uuid,
  match_threshold  float   default 0.85,
  match_count      int     default 5
)
returns table (
  question_id  uuid,
  similarity   float
)
language sql stable security definer set search_path = public
as $$
  select
    qe.question_id,
    1 - (qe.embedding <=> query_embedding) as similarity
  from public.question_embeddings qe
  where
    qe.user_id = query_user_id
    and 1 - (qe.embedding <=> query_embedding) >= match_threshold
  order by qe.embedding <=> query_embedding
  limit match_count;
$$;
