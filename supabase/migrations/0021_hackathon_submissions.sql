-- ═══════════════════════════════════════════════════════════════════════════
-- 0021 — Infinium: project submission + day switches
--
-- Two additions on top of 0020:
--
--   hack_submissions  one row per team: the pitch deck and the code, handed in
--                     together through the portal.
--   hack_config       a single row of switches the core team flips on the day
--                     — when sealed briefs become readable in team portals,
--                     and when the submission window is open.
--
-- Everything stays server-only: no anon or authenticated grant, so the browser
-- still cannot reach any hack_* table directly.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── Submissions ───────────────────────────────────────────────────────────
create table if not exists public.hack_submissions (
  team_id      uuid primary key references public.hack_teams(id) on delete cascade,
  -- Object paths inside the private `hack-submissions` bucket.
  code_path    text,
  code_name    text,
  code_size    bigint,
  deck_path    text,
  deck_name    text,
  deck_size    bigint,
  repo_url     text,
  notes        text,
  -- 'draft' while the team is still editing, 'submitted' once handed in.
  status       text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  updated_at   timestamptz not null default now()
);

-- ── Day switches ──────────────────────────────────────────────────────────
-- One row, enforced by a primary key that can only ever hold `true`.
create table if not exists public.hack_config (
  id               boolean primary key default true check (id),
  -- Flipped at 9:20 AM: until then a team sees only its domain, never the brief.
  briefs_released  boolean not null default false,
  -- Closed at code freeze so nothing lands after 2:15 PM.
  submissions_open boolean not null default false,
  updated_at       timestamptz not null default now()
);

insert into public.hack_config (id) values (true) on conflict (id) do nothing;

-- ── Lock down ─────────────────────────────────────────────────────────────
alter table public.hack_submissions enable row level security;
alter table public.hack_config      enable row level security;

revoke all on public.hack_submissions from anon, authenticated;
revoke all on public.hack_config      from anon, authenticated;

-- ── Private bucket for handed-in work ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('hack-submissions', 'hack-submissions', false)
on conflict (id) do update set public = false;

commit;

-- PostgREST caches the schema; without this the new tables 404 until it
-- happens to reload on its own.
notify pgrst, 'reload schema';
