-- ============================================================================
-- Infinium Hackathon — security hardening + schema reconciliation.
--
-- Fixes found against the live database:
--   1. hack_save_submission / hack_recalc_team were EXECUTE-able by `anon`,
--      so anybody could overwrite any team's submission or force a rescore
--      by calling PostgREST directly. They are now service_role only; the
--      application authorises the caller first (signed team-session cookie).
--   2. hack_teams had no write policy at all, so every organiser action had to
--      run as service_role. Club admins now get real RLS write access via the
--      existing public.is_admin() helper, which means the admin panel works
--      under the signed-in user's own JWT and is audited by Postgres.
--   3. The deployed hack_save_submission had lost its "approved team" guard
--      (schema drift from the repo). Re-asserted here.
--   4. hack_team_login had no throttling: team passwords are word+4-digit
--      (~72k combinations), which is trivially brute-forceable over HTTP.
--      Failed attempts are now recorded and rate limited.
--
-- Idempotent — safe to re-run against production.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────── 1. Progress RPC ───────────────────────────
-- Replaces a direct service-role UPDATE from the app so the 0..100 clamp and
-- the "approved team" rule live next to the data.

create or replace function public.hack_set_progress(p_team_id uuid, p_progress integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.hack_teams
  set progress = greatest(0, least(100, coalesce(p_progress, 0)))
  where id = p_team_id
    and coalesce(reg_status, 'pending') = 'approved';
end;
$$;

-- ──────────────────── 2. Submission RPC: restore guard ────────────────────

create or replace function public.hack_save_submission(
  p_team_id uuid,
  p_github text,
  p_demo text,
  p_deck text,
  p_docs text,
  p_notes text,
  p_finalize boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Guard restored: an unknown or unapproved team can never create a row.
  if not exists (
    select 1
    from public.hack_teams
    where id = p_team_id
      and coalesce(reg_status, 'pending') = 'approved'
  ) then
    raise exception 'Missing or unapproved team.';
  end if;

  insert into public.hack_submissions (
    team_id, github_url, demo_url, presentation_url, docs_url, notes, status, submitted_at
  ) values (
    p_team_id,
    nullif(btrim(coalesce(p_github, '')), ''),
    nullif(btrim(coalesce(p_demo, '')), ''),
    nullif(btrim(coalesce(p_deck, '')), ''),
    nullif(btrim(coalesce(p_docs, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    case when p_finalize then 'submitted'::hack_submission_status else 'draft'::hack_submission_status end,
    case when p_finalize then now() else null end
  )
  on conflict (team_id) do update set
    github_url       = excluded.github_url,
    demo_url         = excluded.demo_url,
    presentation_url = excluded.presentation_url,
    docs_url         = excluded.docs_url,
    notes            = excluded.notes,
    status           = excluded.status,
    submitted_at     = coalesce(excluded.submitted_at, public.hack_submissions.submitted_at);

  update public.hack_teams
  set
    github_url = nullif(btrim(coalesce(p_github, '')), ''),
    demo_url   = nullif(btrim(coalesce(p_demo, '')), ''),
    status     = case when p_finalize then 'submitted'::hack_team_status else status end,
    progress   = case when p_finalize then 100 else progress end
  where id = p_team_id;
end;
$$;

-- ─────────────────── 3. Login throttling (brute-force) ───────────────────

create table if not exists public.hack_login_attempts (
  id          bigserial primary key,
  team_code   text not null,
  succeeded   boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists hack_login_attempts_code_idx
  on public.hack_login_attempts (upper(team_code), attempted_at desc);

alter table public.hack_login_attempts enable row level security;
-- No policy: the audit trail is readable/writable by service_role only.
-- (RLS with zero policies denies anon and authenticated outright.)

create or replace function public.hack_team_login(p_code text, p_password_hash text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_team    public.hack_teams%rowtype;
  v_code    text := upper(btrim(coalesce(p_code, '')));
  v_recent  integer;
begin
  -- Max 10 failures per team code per 15 minutes.
  select count(*) into v_recent
  from public.hack_login_attempts
  where upper(team_code) = v_code
    and succeeded = false
    and attempted_at > now() - interval '15 minutes';

  if v_recent >= 10 then
    return jsonb_build_object('ok', false, 'reason', 'locked');
  end if;

  select * into v_team
  from public.hack_teams
  where upper(team_code) = v_code
  limit 1;

  if v_team.id is null or v_team.password_hash is distinct from p_password_hash then
    insert into public.hack_login_attempts (team_code, succeeded) values (v_code, false);
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if coalesce(v_team.reg_status, 'pending') <> 'approved' then
    insert into public.hack_login_attempts (team_code, succeeded) values (v_code, false);
    return jsonb_build_object('ok', false, 'reason', 'pending');
  end if;

  insert into public.hack_login_attempts (team_code, succeeded) values (v_code, true);
  return jsonb_build_object('ok', true, 'team_id', v_team.id);
end;
$$;

-- ─────────────── 4. Lock down EXECUTE grants on write RPCs ───────────────
-- Public registration and login stay open (that is the point of them, and both
-- carry their own capacity / throttling rules). Everything that mutates an
-- existing team is service_role only — the Next.js server action verifies the
-- signed session cookie before it ever reaches Postgres.

revoke all on function public.hack_save_submission(uuid, text, text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.hack_save_submission(uuid, text, text, text, text, text, boolean)
  to service_role;

revoke all on function public.hack_set_progress(uuid, integer) from public, anon, authenticated;
grant execute on function public.hack_set_progress(uuid, integer) to service_role;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'hack_recalc_team'
  ) then
    execute 'revoke all on function public.hack_recalc_team(uuid) from public, anon, authenticated';
    execute 'grant execute on function public.hack_recalc_team(uuid) to service_role';
  end if;
end $$;

-- Registration + login remain callable by anonymous visitors.
grant execute on function public.hack_team_salt(text) to anon, authenticated;
grant execute on function public.hack_team_login(text, text) to anon, authenticated;

-- ──────────────── 5. Real RLS write access for club admins ────────────────
-- Removes the "everything needs the service-role key" single point of failure.
-- public.is_admin() is the same helper the club tables already use.

do $$
declare t text;
begin
  foreach t in array array[
    'hack_settings','hack_participants','hack_problems','hack_teams','hack_team_members',
    'hack_invites','hack_submissions','hack_scores','hack_achievements',
    'hack_participant_achievements','hack_announcements','hack_schedule','hack_quizzes',
    'hack_quiz_questions','hack_quiz_attempts','hack_attendance','hack_certificates',
    'hack_challenges','hack_team_cards'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    -- Public read stays (the leaderboard and landing page are open).
    execute format('drop policy if exists "hack public read" on public.%I', t);
    execute format('create policy "hack public read" on public.%I for select using (true)', t);

    -- Club admins get full write access under their own JWT.
    execute format('drop policy if exists "hack admin write" on public.%I', t);
    execute format(
      'create policy "hack admin write" on public.%I for all
         using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- ─────────────────────────── 6. Indexes ───────────────────────────

create index if not exists hack_participants_team_idx     on public.hack_participants (team_id);
create index if not exists hack_teams_reg_status_idx      on public.hack_teams (reg_status);
create unique index if not exists hack_teams_code_uidx    on public.hack_teams (upper(team_code))
  where team_code is not null;
create index if not exists hack_submissions_team_idx      on public.hack_submissions (team_id);
create index if not exists hack_team_cards_team_idx       on public.hack_team_cards (team_id);
create index if not exists hack_announcements_created_idx on public.hack_announcements (created_at desc);

select 'infinium hackathon security hardening applied' as status;
