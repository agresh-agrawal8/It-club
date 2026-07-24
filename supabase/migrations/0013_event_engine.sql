-- ============================================================================
-- Avinya Event Platform — Event Engine schema.
--
-- Every table is prefixed ev_ and is event-scoped by event_id. Nothing here
-- knows what CODE RED is: an event is a row, its capabilities are settings,
-- its content is seed data. See docs/EVENT-PLATFORM-ARCHITECTURE.md.
--
-- The only link into the club system is ev_profiles.user_id, which is
-- NULLABLE and ON DELETE SET NULL — participants do not need a club account,
-- and dropping the whole ev_* namespace never touches club data.
--
-- Idempotent: safe to re-run.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────────── ENUMS ───────────────────────────────

do $$ begin create type ev_event_status as enum
  ('draft','published','registration','live','judging','closed','archived');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_visibility as enum ('public','unlisted','private');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_role as enum
  ('guest','student','participant','team_leader','volunteer','judge','admin','super_admin');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_participant_status as enum
  ('pending','approved','rejected','waitlisted','checked_in','withdrawn','disqualified');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_team_status as enum
  ('forming','pending','active','submitted','disqualified','withdrawn');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_mission_status as enum ('draft','scheduled','open','closed');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_mission_state as enum
  ('locked','available','in_progress','submitted','under_review','completed','rejected');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_submission_status as enum
  ('draft','submitted','under_review','accepted','rejected');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_point_source as enum
  ('mission','badge','bonus','penalty','judge','manual','quiz','attendance');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_severity as enum ('info','success','warning','critical');
  exception when duplicate_object then null; end $$;

do $$ begin create type ev_schedule_kind as enum
  ('ceremony','session','deadline','break','challenge','judging');
  exception when duplicate_object then null; end $$;

-- ─────────────────────────── 1. EVENT REGISTRY ───────────────────────────

create table if not exists public.ev_events (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  name                text not null,
  tagline             text,
  summary             text,
  description         text,
  kind                text not null default 'hackathon',
  status              ev_event_status not null default 'draft',
  visibility          ev_visibility not null default 'public',
  starts_at           timestamptz,
  ends_at             timestamptz,
  register_opens_at   timestamptz,
  register_closes_at  timestamptz,
  venue               text,
  capacity            integer,
  team_min            integer not null default 1,
  team_max            integer not null default 5,
  cover_url           text,
  trailer_url         text,
  theme               jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  constraint ev_events_team_range check (team_min >= 1 and team_max >= team_min)
);

create table if not exists public.ev_event_settings (
  event_id   uuid not null references public.ev_events(id) on delete cascade,
  key        text not null,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (event_id, key)
);

-- ────────────────────────── 2. IDENTITY & ROLES ──────────────────────────

create table if not exists public.ev_profiles (
  id          uuid primary key default gen_random_uuid(),
  -- Nullable on purpose: a participant may have no club account at all.
  user_id     uuid unique references auth.users(id) on delete set null,
  full_name   text not null,
  email       text,
  phone       text,
  avatar_url  text,
  institution text,
  grade       text,
  created_at  timestamptz not null default now()
);

create unique index if not exists ev_profiles_email_uidx
  on public.ev_profiles (lower(email)) where email is not null;

create table if not exists public.ev_teams (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.ev_events(id) on delete cascade,
  name        text not null,
  slug        text,
  tagline     text,
  avatar_url  text,
  join_code   text unique,
  leader_id   uuid,                      -- FK added after ev_participants exists
  status      ev_team_status not null default 'forming',
  points      integer not null default 0,
  progress    integer not null default 0 check (progress between 0 and 100),
  approved_at timestamptz,
  created_at  timestamptz not null default now()
);

create unique index if not exists ev_teams_event_name_uidx
  on public.ev_teams (event_id, lower(name));

create table if not exists public.ev_participants (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.ev_events(id) on delete cascade,
  profile_id    uuid not null references public.ev_profiles(id) on delete cascade,
  role          ev_role not null default 'participant',
  -- Denormalised for RLS speed; kept in sync with ev_team_members by trigger.
  team_id       uuid references public.ev_teams(id) on delete set null,
  status        ev_participant_status not null default 'pending',
  points        integer not null default 0,
  display_name  text,
  registered_at timestamptz not null default now(),
  approved_at   timestamptz,
  unique (event_id, profile_id)
);

do $$ begin
  alter table public.ev_teams
    add constraint ev_teams_leader_fkey
    foreign key (leader_id) references public.ev_participants(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.ev_team_members (
  team_id        uuid not null references public.ev_teams(id) on delete cascade,
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  role_label     text,
  is_leader      boolean not null default false,
  joined_at      timestamptz not null default now(),
  primary key (team_id, participant_id)
);

-- A participant may hold extra roles (a volunteer who also judges) without
-- being duplicated as a second person — one row to grant, one row to revoke.
create table if not exists public.ev_participant_roles (
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  role           ev_role not null,
  granted_by     uuid references public.ev_participants(id) on delete set null,
  granted_at     timestamptz not null default now(),
  primary key (participant_id, role)
);

create table if not exists public.ev_sessions (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  kind           text not null default 'credential',
  issued_at      timestamptz not null default now(),
  expires_at     timestamptz not null,
  revoked_at     timestamptz,
  user_agent_hash text
);

-- Issued credentials (Path C). Password hashes never leave the database.
create table if not exists public.ev_credentials (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  subject_kind   text not null default 'team',   -- 'team' | 'participant'
  subject_id     uuid not null,
  login_code     text not null,
  password_hash  text not null,
  issued_at      timestamptz not null default now(),
  rotated_at     timestamptz,
  unique (event_id, login_code)
);

create table if not exists public.ev_login_attempts (
  id           bigserial primary key,
  event_id     uuid references public.ev_events(id) on delete cascade,
  login_code   text not null,
  succeeded    boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists ev_login_attempts_code_idx
  on public.ev_login_attempts (event_id, upper(login_code), attempted_at desc);

-- ─────────────────────────── 3. MISSION ENGINE ───────────────────────────

create table if not exists public.ev_mission_categories (
  id       uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.ev_events(id) on delete cascade,
  name     text not null,
  slug     text not null,
  colour   text,
  icon     text,
  position integer not null default 0,
  unique (event_id, slug)
);

create table if not exists public.ev_missions (
  id                    uuid primary key default gen_random_uuid(),
  event_id              uuid not null references public.ev_events(id) on delete cascade,
  category_id           uuid references public.ev_mission_categories(id) on delete set null,
  code                  text not null,
  title                 text not null,
  brief                 text,
  description           text,
  difficulty            text not null default 'medium',
  points                integer not null default 100,
  time_limit_s          integer,
  max_attempts          integer not null default 1,
  requires_verification boolean not null default false,
  verifier_role         ev_role not null default 'judge',
  -- Team missions score the team; otherwise the individual.
  is_team_mission       boolean not null default true,
  unlock_at             timestamptz,
  lock_at               timestamptz,
  status                ev_mission_status not null default 'draft',
  position              integer not null default 0,
  assets                jsonb not null default '{}',
  created_at            timestamptz not null default now(),
  unique (event_id, code)
);

create table if not exists public.ev_mission_deps (
  mission_id    uuid not null references public.ev_missions(id) on delete cascade,
  depends_on_id uuid not null references public.ev_missions(id) on delete cascade,
  primary key (mission_id, depends_on_id),
  constraint ev_mission_deps_no_self check (mission_id <> depends_on_id)
);

create table if not exists public.ev_mission_progress (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  mission_id     uuid not null references public.ev_missions(id) on delete cascade,
  participant_id uuid references public.ev_participants(id) on delete cascade,
  team_id        uuid references public.ev_teams(id) on delete cascade,
  state          ev_mission_state not null default 'available',
  attempts       integer not null default 0,
  score          numeric not null default 0,
  started_at     timestamptz,
  completed_at   timestamptz,
  verified_by    uuid references public.ev_participants(id) on delete set null,
  verified_at    timestamptz,
  -- Exactly one subject: a team mission or an individual one, never both.
  constraint ev_mission_progress_subject
    check (num_nonnulls(participant_id, team_id) = 1)
);

create unique index if not exists ev_mission_progress_team_uidx
  on public.ev_mission_progress (mission_id, team_id) where team_id is not null;
create unique index if not exists ev_mission_progress_participant_uidx
  on public.ev_mission_progress (mission_id, participant_id) where participant_id is not null;

create table if not exists public.ev_submissions (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  mission_id     uuid references public.ev_missions(id) on delete cascade,
  team_id        uuid references public.ev_teams(id) on delete cascade,
  participant_id uuid references public.ev_participants(id) on delete cascade,
  payload        jsonb not null default '{}',
  files          jsonb not null default '[]',
  status         ev_submission_status not null default 'draft',
  score          numeric,
  feedback       text,
  submitted_at   timestamptz,
  reviewed_by    uuid references public.ev_participants(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  constraint ev_submissions_subject
    check (num_nonnulls(participant_id, team_id) >= 1)
);

-- ────────────────────── 4. SCORING (append-only ledger) ──────────────────────

create table if not exists public.ev_points_history (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  participant_id uuid references public.ev_participants(id) on delete cascade,
  team_id        uuid references public.ev_teams(id) on delete cascade,
  delta          integer not null,
  reason         text not null,
  source         ev_point_source not null default 'manual',
  ref_id         uuid,
  awarded_by     uuid references public.ev_participants(id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint ev_points_subject check (num_nonnulls(participant_id, team_id) >= 1)
);

-- ─────────────────────── 5. ENGAGEMENT & OPERATIONS ───────────────────────

create table if not exists public.ev_badges (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.ev_events(id) on delete cascade,
  code        text not null,
  title       text not null,
  description text,
  icon        text,
  rarity      text not null default 'common',
  points      integer not null default 10,
  position    integer not null default 0,
  unique (event_id, code)
);

create table if not exists public.ev_participant_badges (
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  badge_id       uuid not null references public.ev_badges(id) on delete cascade,
  awarded_by     uuid references public.ev_participants(id) on delete set null,
  awarded_at     timestamptz not null default now(),
  primary key (participant_id, badge_id)
);

create table if not exists public.ev_inventory_items (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.ev_events(id) on delete cascade,
  code        text not null,
  title       text not null,
  description text,
  icon        text,
  kind        text not null default 'powerup',
  value       jsonb not null default '{}',
  unique (event_id, code)
);

create table if not exists public.ev_participant_items (
  id             uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  item_id        uuid not null references public.ev_inventory_items(id) on delete cascade,
  qty            integer not null default 1 check (qty >= 0),
  acquired_at    timestamptz not null default now(),
  consumed_at    timestamptz
);

create table if not exists public.ev_announcements (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.ev_events(id) on delete cascade,
  title        text not null,
  body         text,
  severity     ev_severity not null default 'info',
  pinned       boolean not null default false,
  audience     ev_role,               -- null = everyone
  published_at timestamptz not null default now(),
  created_by   uuid references public.ev_participants(id) on delete set null
);

create table if not exists public.ev_notifications (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  title          text not null,
  body           text,
  href           text,
  kind           text not null default 'info',
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists public.ev_schedule (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.ev_events(id) on delete cascade,
  title       text not null,
  description text,
  kind        ev_schedule_kind not null default 'session',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  location    text,
  position    integer not null default 0
);

create table if not exists public.ev_attendance (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  session_key    text not null,
  method         text not null default 'qr',
  recorded_by    uuid references public.ev_participants(id) on delete set null,
  recorded_at    timestamptz not null default now(),
  unique (participant_id, session_key)
);

-- Single-use, expiring: a photographed badge cannot be replayed.
create table if not exists public.ev_qr_tokens (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  participant_id uuid not null references public.ev_participants(id) on delete cascade,
  token          text not null unique,
  purpose        text not null default 'checkin',
  expires_at     timestamptz not null,
  consumed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create table if not exists public.ev_files (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.ev_events(id) on delete cascade,
  owner_id   uuid references public.ev_participants(id) on delete set null,
  bucket     text not null default 'event-files',
  path       text not null,
  mime       text,
  bytes      bigint,
  kind       text not null default 'attachment',
  created_at timestamptz not null default now()
);

create table if not exists public.ev_certificates (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.ev_events(id) on delete cascade,
  participant_id uuid references public.ev_participants(id) on delete cascade,
  team_id        uuid references public.ev_teams(id) on delete cascade,
  kind           text not null default 'participation',
  serial         text not null unique,
  issued_at      timestamptz not null default now(),
  revoked_at     timestamptz
);

create table if not exists public.ev_audit_logs (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid references public.ev_events(id) on delete cascade,
  actor_id   uuid references public.ev_participants(id) on delete set null,
  actor_role ev_role,
  action     text not null,
  entity     text,
  entity_id  uuid,
  before     jsonb,
  after      jsonb,
  ip_hash    text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────── INDEXES ───────────────────────────────

create index if not exists ev_participants_event_role_idx  on public.ev_participants (event_id, role);
create index if not exists ev_participants_event_team_idx  on public.ev_participants (event_id, team_id);
create index if not exists ev_participants_profile_idx     on public.ev_participants (profile_id);
create index if not exists ev_teams_event_status_idx       on public.ev_teams (event_id, status);
create index if not exists ev_team_members_participant_idx on public.ev_team_members (participant_id);
create index if not exists ev_missions_event_status_idx    on public.ev_missions (event_id, status, position);
create index if not exists ev_missions_category_idx        on public.ev_missions (category_id);
create index if not exists ev_mission_progress_team_idx    on public.ev_mission_progress (team_id);
create index if not exists ev_mission_progress_part_idx    on public.ev_mission_progress (participant_id);
create index if not exists ev_submissions_event_status_idx on public.ev_submissions (event_id, status);
create index if not exists ev_submissions_mission_idx      on public.ev_submissions (mission_id, status);
create index if not exists ev_points_event_created_idx     on public.ev_points_history (event_id, created_at desc);
create index if not exists ev_points_participant_idx       on public.ev_points_history (participant_id);
create index if not exists ev_points_team_idx              on public.ev_points_history (team_id);
create index if not exists ev_notifications_unread_idx     on public.ev_notifications (participant_id) where read_at is null;
create index if not exists ev_schedule_event_starts_idx    on public.ev_schedule (event_id, starts_at);
create index if not exists ev_audit_event_created_idx      on public.ev_audit_logs (event_id, created_at desc);
create index if not exists ev_sessions_participant_idx     on public.ev_sessions (participant_id, expires_at desc);

-- ──────────────────── TRIGGERS: keep caches honest ────────────────────
-- ev_points_history is the source of truth. These triggers maintain the
-- denormalised point caches; a reconciliation query in the admin panel can
-- always rebuild them from the ledger.

create or replace function public.ev_apply_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.participant_id is not null then
    update public.ev_participants
    set points = points + new.delta
    where id = new.participant_id;
  end if;

  if new.team_id is not null then
    update public.ev_teams
    set points = points + new.delta
    where id = new.team_id;
  end if;

  return new;
end;
$$;

drop trigger if exists ev_points_apply on public.ev_points_history;
create trigger ev_points_apply
  after insert on public.ev_points_history
  for each row execute function public.ev_apply_points();

-- Keep ev_participants.team_id in step with ev_team_members.
create or replace function public.ev_sync_team_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.ev_participants
    set team_id = null
    where id = old.participant_id and team_id = old.team_id;
    return old;
  end if;

  update public.ev_participants
  set team_id = new.team_id
  where id = new.participant_id;
  return new;
end;
$$;

drop trigger if exists ev_team_member_sync on public.ev_team_members;
create trigger ev_team_member_sync
  after insert or update or delete on public.ev_team_members
  for each row execute function public.ev_sync_team_member();

-- ──────────────────────────── LEADERBOARD ────────────────────────────
-- Individual, team, daily and overall boards are all this one query with a
-- different filter. Refreshed on award rather than computed per request.

drop materialized view if exists public.ev_leaderboard;
create materialized view public.ev_leaderboard as
  select
    t.event_id,
    t.id                                   as subject_id,
    'team'::text                           as subject_kind,
    t.name                                 as display_name,
    t.avatar_url,
    t.points,
    (select count(*) from public.ev_mission_progress mp
      where mp.team_id = t.id and mp.state = 'completed') as missions_done,
    (select max(ph.created_at) from public.ev_points_history ph
      where ph.team_id = t.id)             as last_award_at,
    rank() over (partition by t.event_id order by t.points desc, t.created_at asc) as rank
  from public.ev_teams t
  where t.status not in ('disqualified','withdrawn')
  union all
  select
    p.event_id,
    p.id,
    'participant',
    coalesce(p.display_name, pr.full_name),
    pr.avatar_url,
    p.points,
    (select count(*) from public.ev_mission_progress mp
      where mp.participant_id = p.id and mp.state = 'completed'),
    (select max(ph.created_at) from public.ev_points_history ph
      where ph.participant_id = p.id),
    rank() over (partition by p.event_id order by p.points desc, p.registered_at asc)
  from public.ev_participants p
  join public.ev_profiles pr on pr.id = p.profile_id
  where p.status not in ('disqualified','withdrawn','rejected');

create unique index if not exists ev_leaderboard_uidx
  on public.ev_leaderboard (event_id, subject_kind, subject_id);
create index if not exists ev_leaderboard_rank_idx
  on public.ev_leaderboard (event_id, subject_kind, rank);

create or replace function public.ev_refresh_leaderboard()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  refresh materialized view concurrently public.ev_leaderboard;
exception when others then
  -- CONCURRENTLY needs a populated view; fall back on first run.
  refresh materialized view public.ev_leaderboard;
end;
$$;

select 'event engine schema ready' as status;
