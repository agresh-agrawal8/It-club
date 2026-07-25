-- ============================================================================
-- Infinium: issue Team ID + password AT REGISTRATION.
--
-- Previous flow: register → reg_status 'pending' → core team approves → only
-- then were a Team ID and password generated. Teams therefore left the
-- registration page with no way to sign in, and had to wait for a human.
--
-- New flow: the team number, Team ID (INF-Tnn) and password are allocated in
-- the same transaction that creates the team, and returned to the caller so
-- the page can show them once. The core team keeps oversight through
-- /hackathon/manage (reject, disqualify, reset password, assign envelope).
--
-- Password hashing stays in the application (salted SHA-256, "salt:hash", see
-- src/lib/hackathon/team-auth.ts) so there is exactly ONE hashing
-- implementation; the caller passes the finished hash in. The plain password
-- is stored in join_code so the core team can re-read it for a student who
-- loses it — same as the old approve step did.
--
-- Idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

create or replace function public.hack_register_team_v2(
  p_team_name     text,
  p_school        text,
  p_tagline       text,
  p_members       jsonb,
  p_password_hash text,
  p_password_plain text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_member  jsonb;
  v_count   integer;
  v_name    text := btrim(coalesce(p_team_name, ''));
  v_key     text;
  v_keys    text[] := '{}';
  v_next_no integer;
  v_code    text;
begin
  if length(v_name) < 3 then
    raise exception 'Give your team a name (3+ characters).';
  end if;

  if jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) < 2 then
    raise exception 'A team needs at least 2 members.';
  end if;

  if coalesce(btrim(p_password_hash), '') = '' then
    raise exception 'Missing credentials.';
  end if;

  -- Serialise registrations so capacity, name clashes and team-number
  -- allocation cannot race two simultaneous submissions.
  perform pg_advisory_xact_lock(hashtext('hack_register_team'));

  select count(*) into v_count
  from public.hack_teams
  where coalesce(reg_status, 'pending') <> 'rejected';

  if v_count >= 10 then
    raise exception 'Registration is full - the maximum of 10 teams has been reached.';
  end if;

  if exists (select 1 from public.hack_teams where lower(name) = lower(v_name)) then
    raise exception 'A team with that name already exists. Pick another.';
  end if;

  -- Validate every member before inserting anything.
  for v_member in select * from jsonb_array_elements(p_members)
  loop
    v_key :=
      lower(btrim(coalesce(v_member->>'name', ''))) || '|' ||
      lower(btrim(coalesce(v_member->>'class_section', '')));

    if v_key = '|' then
      raise exception 'Every member needs a name and class/section.';
    end if;

    if v_key = any(v_keys) then
      raise exception 'The same student is listed twice in this team.';
    end if;
    v_keys := array_append(v_keys, v_key);

    if exists (
      select 1
      from public.hack_participants hp
      where hp.team_id is not null
        and lower(hp.name) = lower(btrim(coalesce(v_member->>'name', '')))
        and lower(coalesce(hp.class_section, '')) = lower(btrim(coalesce(v_member->>'class_section', '')))
    ) then
      raise exception '% (%) is already registered with another team. Each student can only join one team.',
        btrim(coalesce(v_member->>'name', '')),
        btrim(coalesce(v_member->>'class_section', ''));
    end if;
  end loop;

  -- Allocate the next team number / Team ID.
  select coalesce(max(team_no), 0) + 1 into v_next_no from public.hack_teams;
  v_code := 'INF-T' || lpad(v_next_no::text, 2, '0');

  insert into public.hack_teams (
    name, tagline, school, reg_status, status,
    team_no, team_code, password_hash, join_code, approved_at
  )
  values (
    v_name,
    nullif(btrim(coalesce(p_tagline, '')), ''),
    nullif(btrim(coalesce(p_school, '')), ''),
    'approved',          -- credentials are live immediately
    'active',
    v_next_no,
    v_code,
    p_password_hash,
    p_password_plain,    -- plain, so the core team can re-issue it once
    now()
  )
  returning id into v_team_id;

  for v_member in select * from jsonb_array_elements(p_members)
  loop
    insert into public.hack_participants (
      name, class_section, member_role, is_quiz_rep, role, team_id
    ) values (
      btrim(coalesce(v_member->>'name', '')),
      btrim(coalesce(v_member->>'class_section', '')),
      btrim(coalesce(v_member->>'role', '')),
      coalesce((v_member->>'quiz')::boolean, false),
      'student',
      v_team_id
    );
  end loop;

  return jsonb_build_object(
    'team_id',   v_team_id,
    'team_code', v_code,
    'team_no',   v_next_no
  );
end;
$$;

-- Public registration stays callable by anonymous visitors; it carries its own
-- capacity and duplicate rules, and the caller supplies only a password hash.
revoke all on function public.hack_register_team_v2(text, text, text, jsonb, text, text)
  from public;
grant execute on function public.hack_register_team_v2(text, text, text, jsonb, text, text)
  to anon, authenticated, service_role;

select 'infinium instant credentials ready' as status;
