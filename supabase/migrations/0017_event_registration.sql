-- ============================================================================
-- Event Engine: public team registration + credential login.
--
-- Anonymous visitors cannot insert into ev_profiles / ev_participants /
-- ev_teams (RLS denies it, correctly). Registration therefore runs through a
-- SECURITY DEFINER RPC that validates the event's own rules — window open,
-- capacity, team size, unique name — in one transaction, then issues the
-- team's login credentials.
--
-- As with the hackathon module, password hashing lives in the application
-- (salted SHA-256, "salt:hash") so there is one implementation; the database
-- receives only the finished hash. The plain password is stored alongside so
-- organisers can re-read it once for a team that loses it.
--
-- Idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- The plain-password column mirrors hack_teams.join_code's purpose.
alter table public.ev_credentials
  add column if not exists password_plain text;

/* ─────────────────────────── REGISTRATION ─────────────────────────── */

create or replace function public.ev_register_team(
  p_event_slug     text,
  p_team_name      text,
  p_tagline        text,
  p_members        jsonb,
  p_login_code     text,
  p_password_hash  text,
  p_password_plain text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event      public.ev_events%rowtype;
  v_team_id    uuid;
  v_profile_id uuid;
  v_part_id    uuid;
  v_leader_id  uuid;
  v_member     jsonb;
  v_name       text := btrim(coalesce(p_team_name, ''));
  v_email      text;
  v_full_name  text;
  v_count      integer;
  v_size       integer;
  v_idx        integer := 0;
  v_mode       text;
  v_keys       text[] := '{}';
  v_key        text;
begin
  select * into v_event from public.ev_events where slug = p_event_slug;
  if v_event.id is null then
    raise exception 'Unknown event.';
  end if;

  if length(v_name) < 3 then
    raise exception 'Give your team a name (3+ characters).';
  end if;

  if jsonb_typeof(p_members) <> 'array' then
    raise exception 'Add your team members.';
  end if;

  v_size := jsonb_array_length(p_members);
  if v_size < v_event.team_min then
    raise exception 'A team needs at least % member(s).', v_event.team_min;
  end if;
  if v_size > v_event.team_max then
    raise exception 'A team can have at most % members.', v_event.team_max;
  end if;

  -- Registration must actually be open.
  select value #>> '{}' into v_mode
  from public.ev_event_settings
  where event_id = v_event.id and key = 'registration_mode';

  if coalesce(v_mode, 'closed') = 'closed' then
    raise exception 'Registration is closed for this event.';
  end if;
  if v_event.status in ('draft','archived','live','judging','closed') then
    raise exception 'Registration for this event has ended.';
  end if;
  if v_event.register_opens_at is not null and now() < v_event.register_opens_at then
    raise exception 'Registration has not opened yet.';
  end if;
  if v_event.register_closes_at is not null and now() > v_event.register_closes_at then
    raise exception 'Registration has closed.';
  end if;

  -- Serialise so capacity and name checks cannot race.
  perform pg_advisory_xact_lock(hashtext('ev_register_team' || v_event.id::text));

  if v_event.capacity is not null then
    select count(*) into v_count
    from public.ev_participants
    where event_id = v_event.id and status not in ('rejected','withdrawn');

    if v_count + v_size > v_event.capacity then
      raise exception 'This event is full (% places).', v_event.capacity;
    end if;
  end if;

  if exists (
    select 1 from public.ev_teams
    where event_id = v_event.id and lower(name) = lower(v_name)
  ) then
    raise exception 'A team with that name already exists. Pick another.';
  end if;

  -- Validate members up front so nothing is written on a bad payload.
  for v_member in select * from jsonb_array_elements(p_members)
  loop
    v_full_name := btrim(coalesce(v_member->>'full_name', ''));
    v_email     := lower(btrim(coalesce(v_member->>'email', '')));

    if length(v_full_name) < 2 then
      raise exception 'Every member needs a full name.';
    end if;

    v_key := lower(v_full_name) || '|' || v_email;
    if v_key = any(v_keys) then
      raise exception 'The same person is listed twice.';
    end if;
    v_keys := array_append(v_keys, v_key);

    -- One event, one team per person (matched on email when given).
    if v_email <> '' and exists (
      select 1
      from public.ev_participants pa
      join public.ev_profiles pr on pr.id = pa.profile_id
      where pa.event_id = v_event.id
        and lower(coalesce(pr.email,'')) = v_email
        and pa.status not in ('rejected','withdrawn')
    ) then
      raise exception '% is already registered for this event.', v_email;
    end if;
  end loop;

  insert into public.ev_teams (event_id, name, tagline, slug, status, approved_at)
  values (
    v_event.id,
    v_name,
    nullif(btrim(coalesce(p_tagline,'')), ''),
    lower(regexp_replace(v_name, '[^a-zA-Z0-9]+', '-', 'g')),
    'active',
    now()
  )
  returning id into v_team_id;

  for v_member in select * from jsonb_array_elements(p_members)
  loop
    v_full_name := btrim(coalesce(v_member->>'full_name',''));
    v_email     := nullif(lower(btrim(coalesce(v_member->>'email',''))), '');

    -- Reuse an existing profile when the email matches, so a returning
    -- participant keeps one identity across events.
    v_profile_id := null;
    if v_email is not null then
      select id into v_profile_id from public.ev_profiles where lower(email) = v_email limit 1;
    end if;

    if v_profile_id is null then
      insert into public.ev_profiles (full_name, email, institution, grade)
      values (
        v_full_name,
        v_email,
        nullif(btrim(coalesce(v_member->>'institution','')), ''),
        nullif(btrim(coalesce(v_member->>'grade','')), '')
      )
      returning id into v_profile_id;
    end if;

    insert into public.ev_participants (
      event_id, profile_id, role, team_id, status, display_name, approved_at
    ) values (
      v_event.id,
      v_profile_id,
      case when v_idx = 0 then 'team_leader'::ev_role else 'participant'::ev_role end,
      v_team_id,
      'approved',
      v_full_name,
      now()
    )
    returning id into v_part_id;

    insert into public.ev_team_members (team_id, participant_id, role_label, is_leader)
    values (
      v_team_id,
      v_part_id,
      nullif(btrim(coalesce(v_member->>'role_label','')), ''),
      v_idx = 0
    );

    if v_idx = 0 then
      v_leader_id := v_part_id;
    end if;
    v_idx := v_idx + 1;
  end loop;

  update public.ev_teams set leader_id = v_leader_id where id = v_team_id;

  insert into public.ev_credentials (
    event_id, subject_kind, subject_id, login_code, password_hash, password_plain
  ) values (
    v_event.id, 'team', v_team_id, upper(btrim(p_login_code)), p_password_hash, p_password_plain
  );

  return jsonb_build_object(
    'team_id',    v_team_id,
    'leader_id',  v_leader_id,
    'login_code', upper(btrim(p_login_code))
  );
end;
$$;

/* ───────────────────────────── LOGIN ───────────────────────────── */

-- Returns only the salt, so the app can hash the attempt with it; the stored
-- hash never leaves the database.
create or replace function public.ev_credential_salt(p_event_slug text, p_login_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select split_part(c.password_hash, ':', 1)
  from public.ev_credentials c
  join public.ev_events e on e.id = c.event_id
  where e.slug = p_event_slug
    and upper(c.login_code) = upper(btrim(p_login_code))
    and c.password_hash like '%:%'
  limit 1
$$;

create or replace function public.ev_team_login(
  p_event_slug    text,
  p_login_code    text,
  p_password_hash text
) returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_cred     public.ev_credentials%rowtype;
  v_code     text := upper(btrim(coalesce(p_login_code,'')));
  v_recent   integer;
  v_leader   uuid;
begin
  select id into v_event_id from public.ev_events where slug = p_event_slug;
  if v_event_id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  -- Throttle: issued passwords have a small keyspace, so brute force must be
  -- rate limited rather than merely discouraged.
  select count(*) into v_recent
  from public.ev_login_attempts
  where event_id = v_event_id
    and upper(login_code) = v_code
    and succeeded = false
    and attempted_at > now() - interval '15 minutes';

  if v_recent >= 10 then
    return jsonb_build_object('ok', false, 'reason', 'locked');
  end if;

  select * into v_cred
  from public.ev_credentials
  where event_id = v_event_id and upper(login_code) = v_code
  limit 1;

  if v_cred.id is null or v_cred.password_hash is distinct from p_password_hash then
    insert into public.ev_login_attempts (event_id, login_code, succeeded)
    values (v_event_id, v_code, false);
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select leader_id into v_leader from public.ev_teams where id = v_cred.subject_id;
  if v_leader is null then
    insert into public.ev_login_attempts (event_id, login_code, succeeded)
    values (v_event_id, v_code, false);
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  insert into public.ev_login_attempts (event_id, login_code, succeeded)
  values (v_event_id, v_code, true);

  return jsonb_build_object('ok', true, 'participant_id', v_leader, 'team_id', v_cred.subject_id);
end;
$$;

/* ──────────────────── Read helper for the dashboard ──────────────────── */
-- The participant session is a signed cookie, not a Postgres JWT claim, so
-- ev_current_participant() cannot see it. The app authorises the caller and
-- then reads the team through this definer function.

create or replace function public.ev_team_overview(p_team_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'team', to_jsonb(t) - 'leader_id',
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', pa.id,
        'name', coalesce(pa.display_name, pr.full_name),
        'role', pa.role,
        'role_label', tm.role_label,
        'is_leader', tm.is_leader,
        'points', pa.points
      ) order by tm.is_leader desc, pr.full_name)
      from public.ev_team_members tm
      join public.ev_participants pa on pa.id = tm.participant_id
      join public.ev_profiles pr on pr.id = pa.profile_id
      where tm.team_id = t.id
    ), '[]'::jsonb),
    'progress', coalesce((
      select jsonb_agg(jsonb_build_object(
        'mission_id', mp.mission_id,
        'state', mp.state,
        'score', mp.score,
        'attempts', mp.attempts,
        'started_at', mp.started_at
      ))
      from public.ev_mission_progress mp
      where mp.team_id = t.id
    ), '[]'::jsonb)
  )
  from public.ev_teams t
  where t.id = p_team_id
$$;

revoke all on function public.ev_register_team(text, text, text, jsonb, text, text, text) from public;
grant execute on function public.ev_register_team(text, text, text, jsonb, text, text, text)
  to anon, authenticated, service_role;

revoke all on function public.ev_credential_salt(text, text) from public;
grant execute on function public.ev_credential_salt(text, text) to anon, authenticated, service_role;

revoke all on function public.ev_team_login(text, text, text) from public;
grant execute on function public.ev_team_login(text, text, text) to anon, authenticated, service_role;

-- Server-side only: the app gates this behind a verified session cookie.
revoke all on function public.ev_team_overview(uuid) from public, anon, authenticated;
grant execute on function public.ev_team_overview(uuid) to service_role;

-- CODE RED issues credentials on submit, so registration is self-serve.
update public.ev_event_settings
set value = '"auto"'::jsonb, updated_at = now()
where key = 'registration_mode'
  and event_id in (select id from public.ev_events where slug = 'code-red');

select 'event registration ready' as status;
