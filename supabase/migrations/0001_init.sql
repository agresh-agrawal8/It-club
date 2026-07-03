-- ============================================================================
-- Emerald Heights International School — IT Club Platform
-- Schema 0001: core tables, enums, indexes, helper functions, triggers.
-- RLS policies live in 0002_policies.sql; storage in 0003_storage.sql.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- fuzzy / global search

-- ─────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────
create type user_role        as enum ('visitor', 'member', 'admin', 'super_admin');
create type project_status    as enum ('draft', 'in_progress', 'completed', 'archived');
create type task_priority     as enum ('low', 'medium', 'high', 'urgent');
create type task_status       as enum ('todo', 'in_progress', 'blocked', 'done');
create type event_status      as enum ('upcoming', 'ongoing', 'past', 'cancelled');
create type media_kind        as enum ('image', 'video', 'file');
create type notification_type as enum ('info', 'task', 'event', 'project', 'achievement', 'system');
create type subscribe_channel as enum ('email', 'whatsapp');

-- ─────────────────────────────────────────────────────────────
-- Profiles — one row per auth.users row (1:1). Role lives here.
-- Member accounts are provisioned by admins (see admin server action).
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  member_id      text unique,                      -- human-friendly ID e.g. EHIS-IT-0007
  full_name      text not null default '',
  role           user_role not null default 'member',
  avatar_url     text,
  bio            text,
  headline       text,                             -- e.g. "Full-stack developer"
  grade          text,                             -- class/grade at school
  skills         text[] not null default '{}',
  github_url     text,
  linkedin_url   text,
  website_url    text,
  phone          text,
  phone_verified boolean not null default false,
  is_active      boolean not null default true,
  last_active_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
comment on table public.profiles is 'Club member & admin profiles, keyed to auth.users.';

-- ─────────────────────────────────────────────────────────────
-- Projects — created by members; no admin approval required.
-- ─────────────────────────────────────────────────────────────
create table public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  summary       text,                              -- short one-liner
  description   text,                              -- long / markdown
  cover_url     text,
  technologies  text[] not null default '{}',
  tags          text[] not null default '{}',
  github_url    text,
  demo_url      text,
  docs_url      text,
  status        project_status not null default 'draft',
  featured      boolean not null default false,
  view_count    integer not null default 0,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index projects_owner_idx   on public.projects(owner_id);
create index projects_status_idx  on public.projects(status);
create index projects_tags_idx    on public.projects using gin(tags);
create index projects_search_idx  on public.projects using gin(
  (title || ' ' || coalesce(summary,'') || ' ' || coalesce(description,'')) gin_trgm_ops
);

-- Many-to-many: a project can list multiple authors.
create table public.project_authors (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role       text,                                 -- e.g. "Lead", "Designer"
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);
create index project_authors_profile_idx on public.project_authors(profile_id);

-- Project media: images, videos, files (Supabase Storage paths).
create table public.project_media (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind       media_kind not null,
  url        text not null,                        -- public URL or storage path
  title      text,
  size_bytes bigint,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index project_media_project_idx on public.project_media(project_id);

-- ─────────────────────────────────────────────────────────────
-- Events
-- ─────────────────────────────────────────────────────────────
create table public.events (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  description       text,
  banner_url        text,
  starts_at         timestamptz not null,
  ends_at           timestamptz,
  venue             text,
  registration_url  text,
  status            event_status not null default 'upcoming',
  schedule          jsonb not null default '[]',   -- [{time,title,speaker}]
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index events_starts_idx on public.events(starts_at);
create index events_status_idx on public.events(status);

create table public.event_media (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  kind       media_kind not null default 'image',
  url        text not null,
  title      text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index event_media_event_idx on public.event_media(event_id);

-- ─────────────────────────────────────────────────────────────
-- Competitions
-- ─────────────────────────────────────────────────────────────
create table public.competitions (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  description   text,
  banner_url    text,
  organizer     text,
  location      text,
  starts_at     timestamptz,
  ends_at       timestamptz,
  registration_url text,
  result        text,                              -- outcome / placement summary
  status        event_status not null default 'upcoming',
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index competitions_starts_idx on public.competitions(starts_at);

-- Participants (members) linked to a competition.
create table public.competition_participants (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  primary key (competition_id, profile_id)
);

-- ─────────────────────────────────────────────────────────────
-- Gallery — admin managed only (see RLS)
-- ─────────────────────────────────────────────────────────────
create table public.gallery_items (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  caption     text,
  image_url   text not null,
  album       text,                                -- optional grouping
  tags        text[] not null default '{}',
  position    integer not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index gallery_album_idx on public.gallery_items(album);

-- ─────────────────────────────────────────────────────────────
-- Achievements
-- ─────────────────────────────────────────────────────────────
create table public.achievements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  image_url    text,
  awarded_on   date,
  category     text,                               -- e.g. "Hackathon", "Olympiad"
  profile_id   uuid references public.profiles(id) on delete set null, -- optional owner
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index achievements_profile_idx on public.achievements(profile_id);

-- ─────────────────────────────────────────────────────────────
-- Tasks — admins assign to members
-- ─────────────────────────────────────────────────────────────
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  priority     task_priority not null default 'medium',
  status       task_status not null default 'todo',
  progress     integer not null default 0 check (progress between 0 and 100),
  deadline     timestamptz,
  assignee_id  uuid references public.profiles(id) on delete set null,
  assigned_by  uuid references public.profiles(id) on delete set null,
  project_id   uuid references public.projects(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tasks_assignee_idx on public.tasks(assignee_id);
create index tasks_status_idx   on public.tasks(status);

create table public.task_attachments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  url        text not null,
  title      text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Notifications — website (persisted). Email/WhatsApp fan-out
-- handled by an edge function reading these rows.
-- ─────────────────────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type        notification_type not null default 'info',
  title       text not null,
  body        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notifications_recipient_idx on public.notifications(recipient_id, read);

-- ─────────────────────────────────────────────────────────────
-- Public subscribers (visitors) — email / whatsapp opt-in
-- ─────────────────────────────────────────────────────────────
create table public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  channel     subscribe_channel not null,
  contact     text not null,                       -- email address or phone
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (channel, contact)
);

-- Contact form messages
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Site settings (single-row key/value) + homepage content
-- ─────────────────────────────────────────────────────────────
create table public.settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Lightweight visitor analytics (page views)
create table public.page_views (
  id         bigint generated always as identity primary key,
  path       text not null,
  session_id text,
  created_at timestamptz not null default now()
);
create index page_views_created_idx on public.page_views(created_at);

-- ─────────────────────────────────────────────────────────────
-- Helper functions
-- ─────────────────────────────────────────────────────────────

-- Current user's role, security-definer to avoid RLS recursion.
create or replace function public.auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()), false);
$$;

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_touch     before update on public.profiles     for each row execute function public.touch_updated_at();
create trigger trg_projects_touch     before update on public.projects     for each row execute function public.touch_updated_at();
create trigger trg_events_touch       before update on public.events       for each row execute function public.touch_updated_at();
create trigger trg_competitions_touch before update on public.competitions for each row execute function public.touch_updated_at();
create trigger trg_tasks_touch        before update on public.tasks        for each row execute function public.touch_updated_at();

-- Auto-create a profile row whenever an auth user is created.
-- Role + member_id are seeded from the admin-supplied user metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, member_id, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'member_id',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Add project owner as an author automatically.
create or replace function public.add_owner_as_author()
returns trigger
language plpgsql
as $$
begin
  insert into public.project_authors (project_id, profile_id, role)
  values (new.id, new.owner_id, 'Owner')
  on conflict do nothing;
  return new;
end;
$$;

create trigger trg_project_owner_author
  after insert on public.projects
  for each row execute function public.add_owner_as_author();
