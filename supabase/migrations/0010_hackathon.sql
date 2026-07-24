-- ============================================================================
-- Infinium Hackathon — STANDALONE module schema.
-- Every table is prefixed hack_ and has NO foreign keys into the club tables
-- (profiles / auth.users). It can be dropped wholesale without touching the
-- IT-Club system. Auth is intentionally NOT wired yet: reads are public and
-- writes go through server actions using the service-role client.
-- ============================================================================

create extension if not exists "pgcrypto";

do $$ begin create type hack_role as enum ('student','judge','organizer','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type hack_team_status as enum ('forming','active','submitted','disqualified'); exception when duplicate_object then null; end $$;
do $$ begin create type hack_submission_status as enum ('draft','submitted'); exception when duplicate_object then null; end $$;
do $$ begin create type hack_schedule_kind as enum ('ceremony','session','deadline','break','challenge'); exception when duplicate_object then null; end $$;

-- Event configuration (single-row key/value)
create table if not exists public.hack_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Participants (own identity — not linked to club members yet)
create table if not exists public.hack_participants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text unique,
  role        hack_role not null default 'student',
  avatar_url  text,
  institution text,
  points      integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Problem statements / tracks
create table if not exists public.hack_problems (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  title       text not null,
  track       text,
  summary     text,
  description text,
  pdf_url     text,
  difficulty  text default 'medium',
  released    boolean not null default false,
  release_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Teams
create table if not exists public.hack_teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  tagline     text,
  captain_id  uuid references public.hack_participants(id) on delete set null,
  problem_id  uuid references public.hack_problems(id) on delete set null,
  github_url  text,
  demo_url    text,
  docs_url    text,
  progress    integer not null default 0 check (progress between 0 and 100),
  status      hack_team_status not null default 'forming',
  join_code   text unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.hack_team_members (
  team_id       uuid not null references public.hack_teams(id) on delete cascade,
  participant_id uuid not null references public.hack_participants(id) on delete cascade,
  is_captain    boolean not null default false,
  joined_at     timestamptz not null default now(),
  primary key (team_id, participant_id)
);

create table if not exists public.hack_invites (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.hack_teams(id) on delete cascade,
  email      text not null,
  status     text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Submissions
create table if not exists public.hack_submissions (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.hack_teams(id) on delete cascade,
  problem_id      uuid references public.hack_problems(id) on delete set null,
  github_url      text,
  demo_url        text,
  presentation_url text,
  docs_url        text,
  notes           text,
  status          hack_submission_status not null default 'draft',
  submitted_at    timestamptz,
  created_at      timestamptz not null default now(),
  unique (team_id)
);

-- Judge scoring (criteria stored as jsonb: {innovation, execution, impact, presentation})
create table if not exists public.hack_scores (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.hack_teams(id) on delete cascade,
  judge_id   uuid references public.hack_participants(id) on delete set null,
  criteria   jsonb not null default '{}',
  total      numeric not null default 0,
  comments   text,
  created_at timestamptz not null default now(),
  unique (team_id, judge_id)
);

-- Achievement passport
create table if not exists public.hack_achievements (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  title       text not null,
  description text,
  icon        text,
  points      integer not null default 10,
  position    integer not null default 0
);

create table if not exists public.hack_participant_achievements (
  participant_id uuid not null references public.hack_participants(id) on delete cascade,
  achievement_id uuid not null references public.hack_achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (participant_id, achievement_id)
);

-- Announcements
create table if not exists public.hack_announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  pinned     boolean not null default false,
  created_at timestamptz not null default now()
);

-- Schedule
create table if not exists public.hack_schedule (
  id          uuid primary key default gen_random_uuid(),
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  title       text not null,
  description text,
  kind        hack_schedule_kind not null default 'session',
  position    integer not null default 0
);

-- Quizzes
create table if not exists public.hack_quizzes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  active      boolean not null default true,
  points      integer not null default 10,
  created_at  timestamptz not null default now()
);
create table if not exists public.hack_quiz_questions (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.hack_quizzes(id) on delete cascade,
  question     text not null,
  options      jsonb not null default '[]',
  answer_index integer not null default 0,
  position     integer not null default 0
);
create table if not exists public.hack_quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.hack_quizzes(id) on delete cascade,
  participant_id uuid references public.hack_participants(id) on delete set null,
  score         integer not null default 0,
  created_at    timestamptz not null default now()
);

-- QR attendance
create table if not exists public.hack_attendance (
  id            uuid primary key default gen_random_uuid(),
  participant_id uuid references public.hack_participants(id) on delete set null,
  session       text not null,
  method        text not null default 'qr',
  checked_in_at timestamptz not null default now()
);

-- Certificates
create table if not exists public.hack_certificates (
  id            uuid primary key default gen_random_uuid(),
  participant_id uuid references public.hack_participants(id) on delete set null,
  team_id       uuid references public.hack_teams(id) on delete set null,
  kind          text not null default 'participation',
  code          text unique not null,
  issued_at     timestamptz not null default now()
);

-- Surprise challenges
create table if not exists public.hack_challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  points      integer not null default 25,
  reveal_at   timestamptz,
  active      boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists hack_team_members_participant_idx on public.hack_team_members(participant_id);
create index if not exists hack_scores_team_idx on public.hack_scores(team_id);
create index if not exists hack_schedule_starts_idx on public.hack_schedule(starts_at);

-- ── RLS: public read (standalone dashboard); writes via service role only ──
do $$
declare t text;
begin
  foreach t in array array[
    'hack_settings','hack_participants','hack_problems','hack_teams','hack_team_members',
    'hack_invites','hack_submissions','hack_scores','hack_achievements',
    'hack_participant_achievements','hack_announcements','hack_schedule','hack_quizzes',
    'hack_quiz_questions','hack_quiz_attempts','hack_attendance','hack_certificates','hack_challenges'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "hack public read" on public.%I', t);
    execute format('create policy "hack public read" on public.%I for select using (true)', t);
  end loop;
end $$;

select 'infinium hackathon schema ready' as status;
