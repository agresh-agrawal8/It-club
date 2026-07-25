-- ============================================================================
-- Fix: hack_register_team_v2 failed with
--   column "member_role" is of type hack_member_role but expression is of type text
--
-- The live database has enum columns where the repo migrations assumed text
-- (hack_participants.member_role → hack_member_role, hack_teams.reg_status →
-- hack_reg_status, hack_teams.status → hack_team_status). PostgREST casts JSON
-- strings to enums implicitly, which is why the older table-level writes worked
-- and only this plpgsql INSERT broke.
--
-- Rather than hard-code either shape, the inserts now resolve each column's
-- actual type at runtime and cast to it. That makes the function correct on
-- both the drifted production schema and a fresh one built from 0010/0011.
--
-- Idempotent.
-- ============================================================================

create or replace function public.hack_register_team_v2(
  p_team_name      text,
  p_school         text,
  p_tagline        text,
  p_members        jsonb,
  p_password_hash  text,
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
  -- Actual column types, so the casts below fit whatever this database has.
  v_t_reg     text;
  v_t_status  text;
  v_t_mrole   text;
  v_t_prole   text;
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

  select udt_name into v_t_reg    from information_schema.columns
    where table_schema='public' and table_name='hack_teams' and column_name='reg_status';
  select udt_name into v_t_status from information_schema.columns
    where table_schema='public' and table_name='hack_teams' and column_name='status';
  select udt_name into v_t_mrole  from information_schema.columns
    where table_schema='public' and table_name='hack_participants' and column_name='member_role';
  select udt_name into v_t_prole  from information_schema.columns
    where table_schema='public' and table_name='hack_participants' and column_name='role';

  v_t_reg    := coalesce(v_t_reg, 'text');
  v_t_status := coalesce(v_t_status, 'text');
  v_t_mrole  := coalesce(v_t_mrole, 'text');
  v_t_prole  := coalesce(v_t_prole, 'text');

  -- Serialise registrations so capacity, name clashes and team-number
  -- allocation cannot race two simultaneous submissions.
  perform pg_advisory_xact_lock(hashtext('hack_register_team'));

  select count(*) into v_count
  from public.hack_teams
  where coalesce(reg_status::text, 'pending') <> 'rejected';

  if v_count >= 10 then
    raise exception 'Registration is full - the maximum of 10 teams has been reached.';
  end if;

  if exists (select 1 from public.hack_teams where lower(name) = lower(v_name)) then
    raise exception 'A team with that name already exists. Pick another.';
  end if;

  -- Validate every member before writing anything.
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

  select coalesce(max(team_no), 0) + 1 into v_next_no from public.hack_teams;
  v_code := 'INF-T' || lpad(v_next_no::text, 2, '0');

  execute format(
    'insert into public.hack_teams
       (name, tagline, school, reg_status, status, team_no, team_code,
        password_hash, join_code, approved_at)
     values ($1, $2, $3, $4::%s, $5::%s, $6, $7, $8, $9, now())
     returning id',
    v_t_reg, v_t_status
  )
  using
    v_name,
    nullif(btrim(coalesce(p_tagline, '')), ''),
    nullif(btrim(coalesce(p_school, '')), ''),
    'approved',        -- credentials are live immediately
    'active',
    v_next_no,
    v_code,
    p_password_hash,
    p_password_plain   -- plain, so the core team can re-issue it once
  into v_team_id;

  for v_member in select * from jsonb_array_elements(p_members)
  loop
    execute format(
      'insert into public.hack_participants
         (name, class_section, member_role, is_quiz_rep, role, team_id)
       values ($1, $2, $3::%s, $4, $5::%s, $6)',
      v_t_mrole, v_t_prole
    )
    using
      btrim(coalesce(v_member->>'name', '')),
      btrim(coalesce(v_member->>'class_section', '')),
      btrim(coalesce(v_member->>'role', '')),
      coalesce((v_member->>'quiz')::boolean, false),
      'student',
      v_team_id;
  end loop;

  return jsonb_build_object(
    'team_id',   v_team_id,
    'team_code', v_code,
    'team_no',   v_next_no
  );
end;
$$;

revoke all on function public.hack_register_team_v2(text, text, text, jsonb, text, text)
  from public;
grant execute on function public.hack_register_team_v2(text, text, text, jsonb, text, text)
  to anon, authenticated, service_role;

select 'hackathon registration enum fix applied' as status;
