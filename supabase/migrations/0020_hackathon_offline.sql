-- ═══════════════════════════════════════════════════════════════════════════
-- 0020 — Infinium: offline evaluation rebuild
--
-- The event moved to a fully offline judging model: judges mark on paper, the
-- quiz is run away from this site, and nothing is submitted through the web.
-- This migration deletes everything that existed to support the old online
-- workflow and reduces the module to what it actually needs:
--
--   hack_teams        the 20 teams
--   hack_participants their members
--   hack_results      the final score + scan of the paper evaluation sheet
--   hack_announcements organiser notices
--
-- The fixed event content (20 envelopes, 20 achievement cards, the schedule,
-- the rules, event settings) now lives in `src/lib/hackathon/content.ts` — it
-- never changes per visitor, so serving it from Postgres cost four round-trips
-- per page load for nothing.
--
-- Safe to run: every table dropped here was verified empty of real data before
-- this migration was written (only seed rows existed).
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── 1. Dead functions ─────────────────────────────────────────────────────
-- Password login, online submissions, live score recalculation.
drop function if exists public.hack_team_login(text, text);
drop function if exists public.hack_team_salt(text);
drop function if exists public.hack_recalc_team(uuid);
drop function if exists public.hack_recalc_score() cascade;
drop function if exists public.hack_save_submission(uuid, text, text, text, text, text, boolean);
drop function if exists public.hack_set_progress(uuid, integer);
drop function if exists public.hack_register_team(text, text, text, jsonb);
drop function if exists public.hack_register_team_v2(text, text, text, jsonb, text, text);

-- ── 2. Tables for removed features ────────────────────────────────────────
-- Online judging / scoring
drop table if exists public.hack_scores cascade;
drop table if exists public.hack_team_cards cascade;
drop table if exists public.hack_participant_achievements cascade;

-- Quiz (now run off-site, marks recorded on the paper sheet)
drop table if exists public.hack_quiz_attempts cascade;
drop table if exists public.hack_quiz_questions cascade;
drop table if exists public.hack_quizzes cascade;

-- Online submission portal (projects are handed over on USB at the desk)
drop table if exists public.hack_submissions cascade;

-- Never built, and not described anywhere in the official guide
drop table if exists public.hack_certificates cascade;
drop table if exists public.hack_attendance cascade;
drop table if exists public.hack_challenges cascade;
drop table if exists public.hack_invites cascade;

-- Superseded: membership is hack_participants.team_id
drop table if exists public.hack_team_members cascade;

-- Password-login rate limiting — there is no password any more
drop table if exists public.hack_login_attempts cascade;

-- Static content, now compiled into the app
drop table if exists public.hack_problems cascade;
drop table if exists public.hack_achievements cascade;
drop table if exists public.hack_schedule cascade;
drop table if exists public.hack_settings cascade;

-- ── 3. Trim hack_teams ────────────────────────────────────────────────────
alter table public.hack_teams
  drop column if exists password_hash,   -- portal is team-name only now
  drop column if exists join_code,       -- held the plaintext password
  drop column if exists github_url,
  drop column if exists demo_url,
  drop column if exists docs_url,
  drop column if exists progress,
  drop column if exists captain_id,
  drop column if exists approved_at,
  drop column if exists reg_status,      -- registration is instant
  drop column if exists problem_id;      -- replaced by envelope_no

alter table public.hack_teams
  add column if not exists envelope_no smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'hack_teams_envelope_range'
  ) then
    alter table public.hack_teams
      add constraint hack_teams_envelope_range
      check (envelope_no is null or (envelope_no between 1 and 20));
  end if;
end $$;

-- Each envelope is unique to one team — that is the point of the format.
create unique index if not exists hack_teams_envelope_uniq
  on public.hack_teams (envelope_no) where envelope_no is not null;

-- The portal resolves a team by its exact name, so names must be unique.
create unique index if not exists hack_teams_name_uniq
  on public.hack_teams (lower(name));

create unique index if not exists hack_teams_team_no_uniq
  on public.hack_teams (team_no) where team_no is not null;

-- ── 4. Trim hack_participants ─────────────────────────────────────────────
-- `role` was the hack_role enum, whose only interesting value was 'judge'.
alter table public.hack_participants
  drop column if exists email,
  drop column if exists avatar_url,
  drop column if exists institution,
  drop column if exists points,
  drop column if exists role;

-- ── 5. Results: the Achievement Card ──────────────────────────────────────
-- One row per team, written only by the core team after the event.
create table if not exists public.hack_results (
  team_id     uuid primary key references public.hack_teams(id) on delete cascade,
  final_score numeric(6,2),
  remarks     text,
  -- Object path inside the private `hack-sheets` bucket. Served to the owning
  -- team as a short-lived signed URL, never as a public URL.
  sheet_path  text,
  published   boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- ── 6. Enums with no remaining columns ────────────────────────────────────
drop type if exists public.hack_reg_status;
drop type if exists public.hack_role;
drop type if exists public.hack_schedule_kind;
drop type if exists public.hack_submission_status;

-- ── 7. Lock the module down ───────────────────────────────────────────────
-- Every hackathon read now happens in server code through the service-role
-- client (see src/lib/hackathon/data.ts) and is cached by Next.js, so the
-- browser never talks to PostgREST for hack_* data at all. With no anon or
-- authenticated grant there is no way to enumerate teams, envelope
-- assignments or unpublished results from outside the server.
alter table public.hack_teams          enable row level security;
alter table public.hack_participants   enable row level security;
alter table public.hack_announcements  enable row level security;
alter table public.hack_results        enable row level security;

drop policy if exists "hack public read"  on public.hack_teams;
drop policy if exists "hack admin write"  on public.hack_teams;
drop policy if exists "hack public read"  on public.hack_participants;
drop policy if exists "hack admin write"  on public.hack_participants;
drop policy if exists "hack public read"  on public.hack_announcements;
drop policy if exists "hack admin write"  on public.hack_announcements;

-- RLS on with zero policies denies anon and authenticated outright;
-- service_role bypasses RLS by design.
revoke all on public.hack_teams         from anon, authenticated;
revoke all on public.hack_participants  from anon, authenticated;
revoke all on public.hack_announcements from anon, authenticated;
revoke all on public.hack_results       from anon, authenticated;

-- ── 8. Registration ───────────────────────────────────────────────────────
-- Kept as one transaction so capacity, duplicate-name and duplicate-student
-- checks cannot race two simultaneous submissions, and so a failed member
-- insert rolls the team back instead of leaving an orphan.
--
-- Unlike v2 this issues no credentials: teams open their portal by name.
create or replace function public.hack_register_team_v3(
  p_team_name text,
  p_school    text,
  p_tagline   text,
  p_members   jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count   int;
  v_no      int;
  v_code    text;
  v_team    uuid;
  v_member  jsonb;
  v_name    text;
  v_class   text;
begin
  if length(coalesce(trim(p_team_name), '')) < 3 then
    raise exception 'Give your team a name (3+ characters).';
  end if;

  -- Serialise the whole registration; 20 teams, so contention is irrelevant.
  perform pg_advisory_xact_lock(hashtext('infinium_register'));

  select count(*) into v_count from hack_teams;
  if v_count >= 20 then
    raise exception 'Registration is full — all 20 team places have been taken.';
  end if;

  if exists (select 1 from hack_teams where lower(name) = lower(trim(p_team_name))) then
    raise exception 'A team with that name already exists. Pick another.';
  end if;

  -- One student, one team. Identity is name + class/section.
  for v_member in select * from jsonb_array_elements(p_members) loop
    v_name  := trim(v_member->>'name');
    v_class := trim(v_member->>'class_section');
    if exists (
      select 1 from hack_participants
      where lower(name) = lower(v_name)
        and lower(coalesce(class_section, '')) = lower(v_class)
        and team_id is not null
    ) then
      raise exception '% (%) is already registered with another team.', v_name, v_class;
    end if;
  end loop;

  select coalesce(max(team_no), 0) + 1 into v_no from hack_teams;
  v_code := 'INF-T' || lpad(v_no::text, 2, '0');

  insert into hack_teams (name, tagline, school, status, team_no, team_code)
  values (
    trim(p_team_name),
    nullif(trim(coalesce(p_tagline, '')), ''),
    nullif(trim(coalesce(p_school, '')), ''),
    'active'::hack_team_status,
    v_no,
    v_code
  )
  returning id into v_team;

  insert into hack_participants (name, class_section, member_role, is_quiz_rep, team_id)
  select
    trim(m->>'name'),
    trim(m->>'class_section'),
    (m->>'role')::hack_member_role,
    coalesce((m->>'quiz')::boolean, false),
    v_team
  from jsonb_array_elements(p_members) m;

  return jsonb_build_object('team_code', v_code, 'team_id', v_team, 'team_no', v_no);
end;
$$;

-- Callable only by trusted server code, never from a browser.
revoke all on function public.hack_register_team_v3(text, text, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.hack_register_team_v3(text, text, text, jsonb)
  to service_role;

-- ── 9. Private bucket for scanned evaluation sheets ───────────────────────
insert into storage.buckets (id, name, public)
values ('hack-sheets', 'hack-sheets', false)
on conflict (id) do update set public = false;

-- Only the service role touches this bucket; teams receive signed URLs.
drop policy if exists "hack sheets service" on storage.objects;

commit;
