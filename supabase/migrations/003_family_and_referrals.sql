-- ============================================================
-- 003_family_and_referrals.sql
-- Family plan member linking and referral tracking
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Expand plan check constraints to include 'family'
-- ────────────────────────────────────────────────────────────
alter table public.users
  drop constraint if exists users_plan_check,
  add constraint users_plan_check check (plan in ('free', 'pro', 'family'));

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check,
  add constraint subscriptions_plan_check check (plan in ('free', 'pro', 'family'));

alter table public.analytics_events
  drop constraint if exists analytics_events_plan_check,
  add constraint analytics_events_plan_check check (plan in ('free', 'pro', 'family'));

-- ────────────────────────────────────────────────────────────
-- Add referral columns to users
-- ────────────────────────────────────────────────────────────
alter table public.users
  add column if not exists referral_code        text unique,
  add column if not exists referral_pro_expires_at timestamptz,
  add column if not exists welcome_email_sent   boolean not null default false;

create index if not exists users_referral_code_idx
  on public.users (referral_code)
  where referral_code is not null;

-- ────────────────────────────────────────────────────────────
-- referrals
-- ────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id               uuid        primary key default uuid_generate_v4(),
  referrer_id      uuid        not null references public.users (id) on delete cascade,
  referred_email   text,
  referred_user_id uuid        references public.users (id) on delete set null,
  status           text        not null default 'pending'
                               check (status in ('pending', 'completed')),
  created_at       timestamptz not null default now(),
  completed_at     timestamptz
);

create index if not exists referrals_referrer_id_idx  on public.referrals (referrer_id);
create index if not exists referrals_referred_user_idx on public.referrals (referred_user_id)
  where referred_user_id is not null;

alter table public.referrals enable row level security;

create policy "referrals: select own"
  on public.referrals for select
  using (referrer_id = auth.uid() or referred_user_id = auth.uid());

create policy "referrals: insert own"
  on public.referrals for insert
  with check (referrer_id = auth.uid());

create policy "referrals: update own"
  on public.referrals for update
  using (referrer_id = auth.uid() or referred_user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- family_members
-- ────────────────────────────────────────────────────────────
create table if not exists public.family_members (
  id            uuid        primary key default uuid_generate_v4(),
  owner_id      uuid        not null references public.users (id) on delete cascade,
  member_id     uuid        references public.users (id) on delete set null,
  invited_email text        not null,
  status        text        not null default 'pending'
                            check (status in ('pending', 'active', 'removed')),
  invited_at    timestamptz not null default now(),
  joined_at     timestamptz
);

create index if not exists family_members_owner_id_idx  on public.family_members (owner_id);
create index if not exists family_members_member_id_idx on public.family_members (member_id)
  where member_id is not null;
create index if not exists family_members_email_idx     on public.family_members (invited_email);

alter table public.family_members enable row level security;

create policy "family_members: owner can select"
  on public.family_members for select
  using (owner_id = auth.uid() or member_id = auth.uid());

create policy "family_members: owner can insert"
  on public.family_members for insert
  with check (owner_id = auth.uid());

create policy "family_members: owner can update"
  on public.family_members for update
  using (owner_id = auth.uid());

create policy "family_members: owner can delete"
  on public.family_members for delete
  using (owner_id = auth.uid());
