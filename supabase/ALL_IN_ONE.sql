-- ============================================================================
-- Avinya — IT & AI Club Platform · ALL-IN-ONE SETUP
-- Paste this whole file into the Supabase SQL Editor and run once.
-- (Already applied to project mfvpgzdmkcehciyiddmk on 2026-07-02 — keep this
--  file for re-creating the database from scratch on a new project.)
-- Includes: extensions, enums, tables, indexes, triggers, RLS policies,
-- storage buckets, seed content, and the first core-team admin.
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ── Enums ───────────────────────────────────────────────────
do $$ begin
  create type user_role as enum ('visitor', 'member', 'admin', 'super_admin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type project_status as enum ('draft', 'in_progress', 'completed', 'archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type task_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;
do $$ begin
  create type task_status as enum ('todo', 'in_progress', 'blocked', 'done');
exception when duplicate_object then null; end $$;
do $$ begin
  create type event_status as enum ('upcoming', 'ongoing', 'past', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type media_kind as enum ('image', 'video', 'file');
exception when duplicate_object then null; end $$;
do $$ begin
  create type notification_type as enum ('info', 'task', 'event', 'project', 'achievement', 'system');
exception when duplicate_object then null; end $$;
do $$ begin
  create type subscribe_channel as enum ('email', 'whatsapp');
exception when duplicate_object then null; end $$;

-- ── Tables ──────────────────────────────────────────────────
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  member_id      text unique,
  full_name      text not null default '',
  role           user_role not null default 'member',
  avatar_url     text,
  bio            text,
  headline       text,
  grade          text,
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

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title         text not null,
  summary       text,
  description   text,
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
create index if not exists projects_owner_idx  on public.projects(owner_id);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_tags_idx   on public.projects using gin(tags);
create index if not exists projects_search_idx on public.projects using gin(
  (title || ' ' || coalesce(summary,'') || ' ' || coalesce(description,'')) gin_trgm_ops
);

create table if not exists public.project_authors (
  project_id uuid not null references public.projects(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role       text,
  created_at timestamptz not null default now(),
  primary key (project_id, profile_id)
);
create index if not exists project_authors_profile_idx on public.project_authors(profile_id);

create table if not exists public.project_media (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind       media_kind not null,
  url        text not null,
  title      text,
  size_bytes bigint,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists project_media_project_idx on public.project_media(project_id);

create table if not exists public.events (
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
  schedule          jsonb not null default '[]',
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events(starts_at);
create index if not exists events_status_idx on public.events(status);

create table if not exists public.event_media (
  id         uuid primary key default gen_random_uuid(),
  event_id   uuid not null references public.events(id) on delete cascade,
  kind       media_kind not null default 'image',
  url        text not null,
  title      text,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists event_media_event_idx on public.event_media(event_id);

create table if not exists public.competitions (
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
  result        text,
  status        event_status not null default 'upcoming',
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists competitions_starts_idx on public.competitions(starts_at);

create table if not exists public.competition_participants (
  competition_id uuid not null references public.competitions(id) on delete cascade,
  profile_id     uuid not null references public.profiles(id) on delete cascade,
  primary key (competition_id, profile_id)
);

create table if not exists public.gallery_items (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  caption     text,
  image_url   text not null,
  album       text,
  tags        text[] not null default '{}',
  position    integer not null default 0,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists gallery_album_idx on public.gallery_items(album);

create table if not exists public.achievements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  image_url    text,
  awarded_on   date,
  category     text,
  profile_id   uuid references public.profiles(id) on delete set null,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists achievements_profile_idx on public.achievements(profile_id);

create table if not exists public.tasks (
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
create index if not exists tasks_assignee_idx on public.tasks(assignee_id);
create index if not exists tasks_status_idx   on public.tasks(status);

create table if not exists public.task_attachments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  url        text not null,
  title      text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type        notification_type not null default 'info',
  title       text not null,
  body        text,
  link        text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists notifications_recipient_idx on public.notifications(recipient_id, read);

create table if not exists public.subscribers (
  id          uuid primary key default gen_random_uuid(),
  channel     subscribe_channel not null,
  contact     text not null,
  verified    boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (channel, contact)
);

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id         bigint generated always as identity primary key,
  path       text not null,
  session_id text,
  created_at timestamptz not null default now()
);
create index if not exists page_views_created_idx on public.page_views(created_at);

-- ── Helper functions + triggers ─────────────────────────────
create or replace function public.auth_role()
returns user_role language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid(); $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select coalesce((select role in ('admin', 'super_admin') from public.profiles where id = auth.uid()), false); $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch     before update on public.profiles     for each row execute function public.touch_updated_at();
drop trigger if exists trg_projects_touch on public.projects;
create trigger trg_projects_touch     before update on public.projects     for each row execute function public.touch_updated_at();
drop trigger if exists trg_events_touch on public.events;
create trigger trg_events_touch       before update on public.events       for each row execute function public.touch_updated_at();
drop trigger if exists trg_competitions_touch on public.competitions;
create trigger trg_competitions_touch before update on public.competitions for each row execute function public.touch_updated_at();
drop trigger if exists trg_tasks_touch on public.tasks;
create trigger trg_tasks_touch        before update on public.tasks        for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.add_owner_as_author()
returns trigger language plpgsql as $$
begin
  insert into public.project_authors (project_id, profile_id, role)
  values (new.id, new.owner_id, 'Owner')
  on conflict do nothing;
  return new;
end; $$;

drop trigger if exists trg_project_owner_author on public.projects;
create trigger trg_project_owner_author
  after insert on public.projects
  for each row execute function public.add_owner_as_author();

-- ── Row Level Security ──────────────────────────────────────
alter table public.profiles                 enable row level security;
alter table public.projects                  enable row level security;
alter table public.project_authors           enable row level security;
alter table public.project_media             enable row level security;
alter table public.events                     enable row level security;
alter table public.event_media               enable row level security;
alter table public.competitions               enable row level security;
alter table public.competition_participants   enable row level security;
alter table public.gallery_items              enable row level security;
alter table public.achievements               enable row level security;
alter table public.tasks                      enable row level security;
alter table public.task_attachments           enable row level security;
alter table public.notifications              enable row level security;
alter table public.subscribers                enable row level security;
alter table public.contact_messages           enable row level security;
alter table public.settings                    enable row level security;
alter table public.page_views                  enable row level security;

do $$ begin
  create policy "profiles readable by everyone" on public.profiles for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "users update own profile" on public.profiles for update
    using (id = auth.uid()) with check (id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins manage profiles" on public.profiles for all
    using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "projects public read" on public.projects for select
    using (status <> 'draft' or owner_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members insert own projects" on public.projects for insert
    with check (owner_id = auth.uid() and public.auth_role() in ('member','admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "owners update own projects" on public.projects for update
    using (owner_id = auth.uid() or public.is_admin())
    with check (owner_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "owners delete own projects" on public.projects for delete
    using (owner_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "project_authors read" on public.project_authors for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "project_authors manage by owner" on public.project_authors for all
    using (public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
    with check (public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "project_media read" on public.project_media for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "project_media manage by owner" on public.project_media for all
    using (public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
    with check (public.is_admin() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "events public read" on public.events for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "events admin write" on public.events for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "event_media public read" on public.event_media for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "event_media admin write" on public.event_media for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "competitions public read" on public.competitions for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "competitions admin write" on public.competitions for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "comp_participants read" on public.competition_participants for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "comp_participants admin" on public.competition_participants for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "gallery public read" on public.gallery_items for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "gallery admin write" on public.gallery_items for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "achievements public read" on public.achievements for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "achievements admin write" on public.achievements for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "tasks read by assignee or admin" on public.tasks for select
    using (assignee_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "tasks update progress by assignee" on public.tasks for update
    using (assignee_id = auth.uid() or public.is_admin())
    with check (assignee_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "tasks admin write" on public.tasks for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "task_attachments read" on public.task_attachments for select
    using (public.is_admin() or exists (select 1 from public.tasks t where t.id = task_id and t.assignee_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "task_attachments admin write" on public.task_attachments for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notifications read own" on public.notifications for select
    using (recipient_id = auth.uid() or public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notifications update own" on public.notifications for update
    using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "notifications admin write" on public.notifications for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "subscribers insert anyone" on public.subscribers for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "subscribers admin read" on public.subscribers for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "subscribers admin write" on public.subscribers for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "contact insert anyone" on public.contact_messages for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "contact admin read" on public.contact_messages for select using (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "contact admin write" on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "settings public read" on public.settings for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "settings admin write" on public.settings for all using (public.is_admin()) with check (public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "page_views insert anyone" on public.page_views for insert with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "page_views admin read" on public.page_views for select using (public.is_admin());
exception when duplicate_object then null; end $$;

-- ── Storage buckets + policies ──────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('avatars',  'avatars',  true),
  ('projects', 'projects', true),
  ('events',   'events',   true),
  ('gallery',  'gallery',  true),
  ('tasks',    'tasks',    true)
on conflict (id) do nothing;

do $$ begin
  create policy "public read storage" on storage.objects for select
    using (bucket_id in ('avatars','projects','events','gallery','tasks'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members upload avatars" on storage.objects for insert
    with check (bucket_id = 'avatars' and auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members update own avatars" on storage.objects for update
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "members upload project media" on storage.objects for insert
    with check (bucket_id = 'projects' and public.auth_role() in ('member','admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "owner or admin manage project media" on storage.objects for update
    using (bucket_id = 'projects' and public.auth_role() in ('member','admin'));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins write events bucket" on storage.objects for insert
    with check (bucket_id = 'events' and public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins write gallery bucket" on storage.objects for insert
    with check (bucket_id = 'gallery' and public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins write tasks bucket" on storage.objects for insert
    with check (bucket_id = 'tasks' and public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins manage privileged buckets" on storage.objects for update
    using (bucket_id in ('events','gallery','tasks') and public.is_admin());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "admins delete privileged buckets" on storage.objects for delete
    using (bucket_id in ('events','gallery','tasks') and public.is_admin());
exception when duplicate_object then null; end $$;

-- ── Seed: homepage + contact settings ───────────────────────
insert into public.settings (key, value) values
  ('homepage', jsonb_build_object(
    'hero_eyebrow', 'Avinya · Emerald Heights International School',
    'hero_title', 'Where ideas compile into reality',
    'hero_subtitle', 'Avinya is the official IT & AI Club of Emerald Heights — projects, events, competitions and a community of student makers.',
    'primary_cta_label', 'Explore projects',
    'primary_cta_href', '/projects',
    'secondary_cta_label', 'Meet the team',
    'secondary_cta_href', '/team'
  )),
  ('contact', jsonb_build_object(
    'email', 'agresh@agreshagrawal.com',
    'location', 'Emerald Heights International School, Indore',
    'instagram', '',
    'github', 'https://github.com/agresh-agrawal8/It-club'
  ))
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── admin_create_member(): provision members without the service key ──
create or replace function public.admin_create_member(
  p_email text, p_password text, p_full_name text, p_member_id text, p_role text default 'member'
) returns json language plpgsql security definer set search_path = auth, public, extensions as $$
declare new_id uuid := gen_random_uuid();
begin
  if not public.is_admin() then raise exception 'Not authorized — admins only'; end if;
  if p_role not in ('member', 'admin') then raise exception 'Invalid role'; end if;
  if length(coalesce(p_password, '')) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  if exists (select 1 from auth.users where email = lower(p_email)) then raise exception 'An account with that Member ID already exists'; end if;
  if exists (select 1 from public.profiles where member_id = p_member_id) then raise exception 'That Member ID is already taken'; end if;
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    lower(p_email), crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'member_id', p_member_id, 'role', p_role),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), new_id, new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', lower(p_email), 'email_verified', true),
    'email', now(), now(), now());
  insert into public.profiles (id, full_name, member_id, role)
  values (new_id, p_full_name, p_member_id, p_role::user_role)
  on conflict (id) do update set full_name = excluded.full_name, member_id = excluded.member_id, role = excluded.role;
  return json_build_object('id', new_id, 'email', lower(p_email));
end; $$;
revoke all on function public.admin_create_member(text, text, text, text, text) from public, anon;
grant execute on function public.admin_create_member(text, text, text, text, text) to authenticated;

-- ── First core-team admin: agresh@agreshagrawal.com ─────────
-- IMPORTANT: replace CHANGE-ME-STRONG-PASSWORD with a real password
-- before running. Never commit a real password to git.
do $$
declare uid uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'agresh@agreshagrawal.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'agresh@agreshagrawal.com', crypt('CHANGE-ME-STRONG-PASSWORD', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Agresh Agrawal","member_id":"SOCH-0001","role":"admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', 'agresh@agreshagrawal.com', 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );
  end if;
end $$;

update public.profiles
set role = 'super_admin', member_id = 'SOCH-0001', full_name = 'Agresh Agrawal', headline = 'Core Team'
where id = (select id from auth.users where email = 'agresh@agreshagrawal.com');

-- ── Second super admin: vrindaagr26@gmail.com ────────────────
do $$
declare uid uuid := gen_random_uuid();
begin
  if not exists (select 1 from auth.users where email = 'vrindaagr26@gmail.com') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated',
      'vrindaagr26@gmail.com', crypt('CHANGE-ME-STRONG-PASSWORD', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Vrinda Agrawal","member_id":"SOCH-0002","role":"admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), uid, uid::text,
      jsonb_build_object('sub', uid::text, 'email', 'vrindaagr26@gmail.com', 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    );
  end if;
end $$;

update public.profiles
set role = 'super_admin', member_id = 'SOCH-0002', full_name = 'Vrinda Agrawal', headline = 'Core Team'
where id = (select id from auth.users where email = 'vrindaagr26@gmail.com');
