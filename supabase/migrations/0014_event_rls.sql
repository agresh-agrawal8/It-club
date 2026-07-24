-- ============================================================================
-- Avinya Event Platform — Row Level Security.
--
-- RLS is the security boundary. The application is a convenience layer on top
-- of it, never the thing that keeps data safe. Every ev_* table is deny-by-
-- default; access is granted explicitly, per table.
--
-- Identity resolution, in order:
--   1. auth.uid()  → ev_profiles.user_id → participant   (club SSO, Google, OTP)
--   2. JWT claim 'participant_id'                        (issued credentials)
--   3. public.is_admin()                                 (club core team = staff
--                                                         everywhere, so the
--                                                         admin panel works)
--
-- Helpers are SECURITY DEFINER so they bypass RLS on the tables they read —
-- otherwise a policy on ev_participants that queries ev_participants recurses.
-- ============================================================================

-- ─────────────────────────── HELPER FUNCTIONS ───────────────────────────

/** The participant id for the caller in a given event, or null. */
create or replace function public.ev_current_participant(p_event_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_claim text;
  v_id    uuid;
begin
  -- Path C: a minted event JWT carries the participant id directly.
  begin
    v_claim := nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'participant_id', '');
  exception when others then
    v_claim := null;
  end;

  if v_claim is not null then
    select p.id into v_id
    from public.ev_participants p
    where p.id = v_claim::uuid and p.event_id = p_event_id;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  -- Paths A/B: a normal Supabase Auth user linked to an event profile.
  if auth.uid() is null then
    return null;
  end if;

  select p.id into v_id
  from public.ev_participants p
  join public.ev_profiles pr on pr.id = p.profile_id
  where pr.user_id = auth.uid() and p.event_id = p_event_id
  limit 1;

  return v_id;
end;
$$;

/** Every role the caller holds in this event (primary + granted extras). */
create or replace function public.ev_roles(p_event_id uuid)
returns ev_role[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(distinct r),
    '{}'::ev_role[]
  )
  from (
    select p.role as r
    from public.ev_participants p
    where p.id = public.ev_current_participant(p_event_id)
    union
    select pr.role
    from public.ev_participant_roles pr
    where pr.participant_id = public.ev_current_participant(p_event_id)
  ) s;
$$;

/** Volunteer, judge, admin or super_admin in this event — or club core team. */
create or replace function public.ev_is_event_staff(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or public.ev_roles(p_event_id)
         && array['volunteer','judge','admin','super_admin']::ev_role[];
$$;

create or replace function public.ev_is_event_admin(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or public.ev_roles(p_event_id) && array['admin','super_admin']::ev_role[];
$$;

create or replace function public.ev_is_event_judge(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or public.ev_roles(p_event_id) && array['judge','admin','super_admin']::ev_role[];
$$;

/** The caller's team in this event, or null. */
create or replace function public.ev_my_team(p_event_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.team_id
  from public.ev_participants p
  where p.id = public.ev_current_participant(p_event_id);
$$;

/** Is this event visible to anonymous visitors? */
create or replace function public.ev_event_is_public(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.ev_events e
    where e.id = p_event_id
      and e.visibility = 'public'
      and e.status not in ('draft','archived')
  );
$$;

-- ─────────────────── ENABLE RLS ON EVERY ev_* TABLE ───────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'ev_events','ev_event_settings','ev_profiles','ev_participants','ev_participant_roles',
    'ev_teams','ev_team_members','ev_sessions','ev_credentials','ev_login_attempts',
    'ev_mission_categories','ev_missions','ev_mission_deps','ev_mission_progress',
    'ev_submissions','ev_points_history','ev_badges','ev_participant_badges',
    'ev_inventory_items','ev_participant_items','ev_announcements','ev_notifications',
    'ev_schedule','ev_attendance','ev_qr_tokens','ev_files','ev_certificates','ev_audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Helper to keep the policy definitions below readable and re-runnable.
create or replace function public.ev_policy(
  p_table text, p_name text, p_cmd text, p_using text, p_check text default null
) returns void
language plpgsql
as $$
begin
  execute format('drop policy if exists %I on public.%I', p_name, p_table);
  if p_check is null then
    execute format('create policy %I on public.%I for %s using (%s)',
                   p_name, p_table, p_cmd, p_using);
  else
    execute format('create policy %I on public.%I for %s using (%s) with check (%s)',
                   p_name, p_table, p_cmd, p_using, p_check);
  end if;
end;
$$;

-- ─────────────────────────── 1. EVENT REGISTRY ───────────────────────────

select public.ev_policy('ev_events', 'ev_events public read', 'select',
  $q$ visibility = 'public' and status not in ('draft','archived') $q$);

select public.ev_policy('ev_events', 'ev_events staff read', 'select',
  $q$ public.ev_is_event_staff(id) $q$);

select public.ev_policy('ev_events', 'ev_events admin write', 'all',
  $q$ public.ev_is_event_admin(id) $q$, $q$ public.ev_is_event_admin(id) $q$);

-- Public pages need capability flags. Keys prefixed 'private.' (rubrics,
-- integration config) never leave the staff boundary.
select public.ev_policy('ev_event_settings', 'ev_settings public read', 'select',
  $q$ key not like 'private.%' and public.ev_event_is_public(event_id) $q$);

select public.ev_policy('ev_event_settings', 'ev_settings staff read', 'select',
  $q$ public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_event_settings', 'ev_settings admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

-- ────────────────────────── 2. IDENTITY & ROLES ──────────────────────────
-- ev_profiles holds PII (email, phone, grade) and is never world-readable.

select public.ev_policy('ev_profiles', 'ev_profiles self read', 'select',
  $q$ user_id = auth.uid()
      or exists (select 1 from public.ev_participants p
                 where p.profile_id = ev_profiles.id
                   and public.ev_is_event_staff(p.event_id)) $q$);

select public.ev_policy('ev_profiles', 'ev_profiles self update', 'update',
  $q$ user_id = auth.uid() $q$, $q$ user_id = auth.uid() $q$);

select public.ev_policy('ev_participants', 'ev_participants read', 'select',
  $q$ id = public.ev_current_participant(event_id)
      or (team_id is not null and team_id = public.ev_my_team(event_id))
      or public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_participants', 'ev_participants admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_participant_roles', 'ev_roles read', 'select',
  $q$ participant_id = (select p.id from public.ev_participants p
                        where p.id = ev_participant_roles.participant_id
                          and p.id = public.ev_current_participant(p.event_id))
      or exists (select 1 from public.ev_participants p
                 where p.id = ev_participant_roles.participant_id
                   and public.ev_is_event_staff(p.event_id)) $q$);

select public.ev_policy('ev_participant_roles', 'ev_roles admin write', 'all',
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_roles.participant_id
                and public.ev_is_event_admin(p.event_id)) $q$,
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_roles.participant_id
                and public.ev_is_event_admin(p.event_id)) $q$);

-- Team names and avatars are public (leaderboard, team pages). No PII here.
select public.ev_policy('ev_teams', 'ev_teams public read', 'select',
  $q$ public.ev_event_is_public(event_id) or public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_teams', 'ev_teams leader update', 'update',
  $q$ id = public.ev_my_team(event_id) and leader_id = public.ev_current_participant(event_id) $q$,
  $q$ id = public.ev_my_team(event_id) and leader_id = public.ev_current_participant(event_id) $q$);

select public.ev_policy('ev_teams', 'ev_teams admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_team_members', 'ev_team_members read', 'select',
  $q$ exists (select 1 from public.ev_teams t
              where t.id = ev_team_members.team_id
                and (t.id = public.ev_my_team(t.event_id)
                     or public.ev_is_event_staff(t.event_id))) $q$);

select public.ev_policy('ev_team_members', 'ev_team_members admin write', 'all',
  $q$ exists (select 1 from public.ev_teams t
              where t.id = ev_team_members.team_id and public.ev_is_event_admin(t.event_id)) $q$,
  $q$ exists (select 1 from public.ev_teams t
              where t.id = ev_team_members.team_id and public.ev_is_event_admin(t.event_id)) $q$);

-- Sessions: readable by their owner so a participant can see/kill their devices.
select public.ev_policy('ev_sessions', 'ev_sessions self read', 'select',
  $q$ participant_id = public.ev_current_participant(event_id)
      or public.ev_is_event_admin(event_id) $q$);

-- ev_credentials, ev_login_attempts: NO policies at all.
-- RLS with zero policies denies anon and authenticated outright; only
-- service_role (which bypasses RLS) can touch password hashes and the
-- brute-force audit trail.

-- ─────────────────────────── 3. MISSION ENGINE ───────────────────────────
-- Categories are public (the landing page advertises tracks). Mission content
-- is NOT: it must not leak before release.

select public.ev_policy('ev_mission_categories', 'ev_categories public read', 'select',
  $q$ public.ev_event_is_public(event_id) or public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_mission_categories', 'ev_categories admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_missions', 'ev_missions participant read', 'select',
  $q$ public.ev_is_event_staff(event_id)
      or (public.ev_current_participant(event_id) is not null
          and status = 'open'
          and (unlock_at is null or unlock_at <= now())) $q$);

select public.ev_policy('ev_missions', 'ev_missions admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_mission_deps', 'ev_deps read', 'select',
  $q$ exists (select 1 from public.ev_missions m
              where m.id = ev_mission_deps.mission_id
                and (public.ev_is_event_staff(m.event_id)
                     or public.ev_current_participant(m.event_id) is not null)) $q$);

select public.ev_policy('ev_mission_deps', 'ev_deps admin write', 'all',
  $q$ exists (select 1 from public.ev_missions m
              where m.id = ev_mission_deps.mission_id and public.ev_is_event_admin(m.event_id)) $q$,
  $q$ exists (select 1 from public.ev_missions m
              where m.id = ev_mission_deps.mission_id and public.ev_is_event_admin(m.event_id)) $q$);

select public.ev_policy('ev_mission_progress', 'ev_progress read', 'select',
  $q$ participant_id = public.ev_current_participant(event_id)
      or (team_id is not null and team_id = public.ev_my_team(event_id))
      or public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_mission_progress', 'ev_progress staff write', 'all',
  $q$ public.ev_is_event_staff(event_id) $q$, $q$ public.ev_is_event_staff(event_id) $q$);

-- Submissions are NOT public: rival teams must not read each other's work,
-- and judges' feedback is not published until the organisers decide it is.
select public.ev_policy('ev_submissions', 'ev_submissions read', 'select',
  $q$ participant_id = public.ev_current_participant(event_id)
      or (team_id is not null and team_id = public.ev_my_team(event_id))
      or public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_submissions', 'ev_submissions judge write', 'all',
  $q$ public.ev_is_event_judge(event_id) $q$, $q$ public.ev_is_event_judge(event_id) $q$);

-- ─────────────────────────────── 4. SCORING ───────────────────────────────
-- The ledger is append-only by policy: no UPDATE, no DELETE for anyone.
-- A wrong award is reversed with a compensating row, never edited away.

select public.ev_policy('ev_points_history', 'ev_points read', 'select',
  $q$ participant_id = public.ev_current_participant(event_id)
      or (team_id is not null and team_id = public.ev_my_team(event_id))
      or public.ev_is_event_staff(event_id) $q$);

drop policy if exists "ev_points judge insert" on public.ev_points_history;
create policy "ev_points judge insert" on public.ev_points_history
  for insert with check (public.ev_is_event_judge(event_id));

-- ─────────────────────── 5. ENGAGEMENT & OPERATIONS ───────────────────────

select public.ev_policy('ev_badges', 'ev_badges public read', 'select',
  $q$ public.ev_event_is_public(event_id) or public.ev_is_event_staff(event_id) $q$);
select public.ev_policy('ev_badges', 'ev_badges admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_participant_badges', 'ev_pbadges read', 'select',
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_badges.participant_id
                and (p.id = public.ev_current_participant(p.event_id)
                     or p.team_id = public.ev_my_team(p.event_id)
                     or public.ev_is_event_staff(p.event_id))) $q$);
select public.ev_policy('ev_participant_badges', 'ev_pbadges staff write', 'all',
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_badges.participant_id
                and public.ev_is_event_staff(p.event_id)) $q$,
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_badges.participant_id
                and public.ev_is_event_staff(p.event_id)) $q$);

select public.ev_policy('ev_inventory_items', 'ev_items public read', 'select',
  $q$ public.ev_event_is_public(event_id) or public.ev_is_event_staff(event_id) $q$);
select public.ev_policy('ev_inventory_items', 'ev_items admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_participant_items', 'ev_pitems read', 'select',
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_items.participant_id
                and (p.id = public.ev_current_participant(p.event_id)
                     or public.ev_is_event_staff(p.event_id))) $q$);
select public.ev_policy('ev_participant_items', 'ev_pitems staff write', 'all',
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_items.participant_id
                and public.ev_is_event_staff(p.event_id)) $q$,
  $q$ exists (select 1 from public.ev_participants p
              where p.id = ev_participant_items.participant_id
                and public.ev_is_event_staff(p.event_id)) $q$);

select public.ev_policy('ev_announcements', 'ev_announcements read', 'select',
  $q$ (published_at <= now()
       and (audience is null or audience = any(public.ev_roles(event_id)))
       and (public.ev_event_is_public(event_id)
            or public.ev_current_participant(event_id) is not null))
      or public.ev_is_event_staff(event_id) $q$);
select public.ev_policy('ev_announcements', 'ev_announcements admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_notifications', 'ev_notifications own', 'select',
  $q$ participant_id = public.ev_current_participant(event_id) $q$);
select public.ev_policy('ev_notifications', 'ev_notifications own update', 'update',
  $q$ participant_id = public.ev_current_participant(event_id) $q$,
  $q$ participant_id = public.ev_current_participant(event_id) $q$);

select public.ev_policy('ev_schedule', 'ev_schedule public read', 'select',
  $q$ public.ev_event_is_public(event_id) or public.ev_is_event_staff(event_id) $q$);
select public.ev_policy('ev_schedule', 'ev_schedule admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

select public.ev_policy('ev_attendance', 'ev_attendance read', 'select',
  $q$ participant_id = public.ev_current_participant(event_id)
      or public.ev_is_event_staff(event_id) $q$);
select public.ev_policy('ev_attendance', 'ev_attendance staff write', 'all',
  $q$ public.ev_is_event_staff(event_id) $q$, $q$ public.ev_is_event_staff(event_id) $q$);

-- QR tokens are single-use secrets: owner may read their own to render it,
-- staff may read to scan. Nobody may forge one (writes are service_role only).
select public.ev_policy('ev_qr_tokens', 'ev_qr read', 'select',
  $q$ participant_id = public.ev_current_participant(event_id)
      or public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_files', 'ev_files read', 'select',
  $q$ owner_id = public.ev_current_participant(event_id)
      or public.ev_is_event_staff(event_id) $q$);
select public.ev_policy('ev_files', 'ev_files staff write', 'all',
  $q$ public.ev_is_event_staff(event_id) $q$, $q$ public.ev_is_event_staff(event_id) $q$);

select public.ev_policy('ev_certificates', 'ev_certificates read', 'select',
  $q$ participant_id = public.ev_current_participant(event_id)
      or (team_id is not null and team_id = public.ev_my_team(event_id))
      or public.ev_is_event_staff(event_id) $q$);
select public.ev_policy('ev_certificates', 'ev_certificates admin write', 'all',
  $q$ public.ev_is_event_admin(event_id) $q$, $q$ public.ev_is_event_admin(event_id) $q$);

-- Audit log: readable by admins, never writable or deletable through the API.
select public.ev_policy('ev_audit_logs', 'ev_audit admin read', 'select',
  $q$ public.ev_is_event_admin(event_id) $q$);

-- ─────────────────────── LEADERBOARD EXPOSURE ───────────────────────
-- RLS does not apply to materialized views, so the matview itself is never
-- granted to anon/authenticated. Access goes through a security_invoker view
-- that filters to publicly visible events.

revoke all on public.ev_leaderboard from anon, authenticated;

create or replace view public.ev_leaderboard_public
with (security_invoker = false) as
  select l.*
  from public.ev_leaderboard l
  where public.ev_event_is_public(l.event_id);

grant select on public.ev_leaderboard_public to anon, authenticated;

-- ─────────────────────────── FUNCTION GRANTS ───────────────────────────

grant execute on function public.ev_current_participant(uuid) to anon, authenticated;
grant execute on function public.ev_roles(uuid)               to anon, authenticated;
grant execute on function public.ev_is_event_staff(uuid)      to anon, authenticated;
grant execute on function public.ev_is_event_admin(uuid)      to anon, authenticated;
grant execute on function public.ev_is_event_judge(uuid)      to anon, authenticated;
grant execute on function public.ev_my_team(uuid)             to anon, authenticated;
grant execute on function public.ev_event_is_public(uuid)     to anon, authenticated;

-- Mutating / privileged helpers stay server-side only.
revoke all on function public.ev_refresh_leaderboard()        from public, anon, authenticated;
grant execute on function public.ev_refresh_leaderboard()     to service_role;
revoke all on function public.ev_policy(text, text, text, text, text)
  from public, anon, authenticated;

select 'event engine RLS ready' as status;
