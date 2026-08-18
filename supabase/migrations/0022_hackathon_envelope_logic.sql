-- ═══════════════════════════════════════════════════════════════════════════
-- 0022 — Infinium: envelope allocation logic
--
-- Assignment used to be a bare UPDATE whose error was thrown away. When the
-- unique index rejected an already-taken envelope the organiser saw nothing:
-- the page simply re-rendered with the change missing. There was also no way
-- to swap two teams, and nothing serialised concurrent assignment.
--
-- Both operations now live in SECURITY DEFINER functions that take an
-- advisory lock, so the whole allocation is decided one caller at a time and
-- every outcome comes back as a value the UI can show.
-- ═══════════════════════════════════════════════════════════════════════════

begin;

-- ── Assign / swap / clear one team ────────────────────────────────────────
create or replace function public.hack_assign_envelope(
  p_team_id     uuid,
  p_envelope_no int
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current     int;
  v_team_name   text;
  v_holder      uuid;
  v_holder_name text;
begin
  -- One allocation decision at a time. Twenty teams, so contention is a
  -- non-issue, and it removes the check-then-write race entirely.
  perform pg_advisory_xact_lock(hashtext('infinium_envelopes'));

  select envelope_no, name into v_current, v_team_name
  from hack_teams where id = p_team_id;
  if not found then
    raise exception 'That team no longer exists.';
  end if;

  -- Clear
  if p_envelope_no is null then
    update hack_teams set envelope_no = null where id = p_team_id;
    return jsonb_build_object('action', 'cleared', 'team', v_team_name);
  end if;

  if p_envelope_no < 1 or p_envelope_no > 20 then
    raise exception 'Envelope must be between 1 and 20.';
  end if;

  -- Already where it should be
  if v_current is not distinct from p_envelope_no then
    return jsonb_build_object('action', 'unchanged', 'team', v_team_name);
  end if;

  select id, name into v_holder, v_holder_name
  from hack_teams
  where envelope_no = p_envelope_no and id <> p_team_id;

  -- Free: straight assignment
  if v_holder is null then
    update hack_teams set envelope_no = p_envelope_no where id = p_team_id;
    return jsonb_build_object('action', 'assigned', 'team', v_team_name);
  end if;

  -- Taken, and this team holds nothing to trade. Refuse rather than silently
  -- stripping the other team of its envelope.
  if v_current is null then
    raise exception 'Envelope % is already held by %. Clear it first, or pick a free one.',
      p_envelope_no, v_holder_name;
  end if;

  -- Taken, and both teams hold one: swap them. The mover is emptied first so
  -- the unique index never sees two rows on the same number.
  update hack_teams set envelope_no = null      where id = p_team_id;
  update hack_teams set envelope_no = v_current where id = v_holder;
  update hack_teams set envelope_no = p_envelope_no where id = p_team_id;

  return jsonb_build_object(
    'action', 'swapped', 'team', v_team_name, 'with', v_holder_name
  );
end;
$$;

-- ── Draw the remaining envelopes at random ────────────────────────────────
-- The real-world operation on briefing day: every team without an envelope
-- gets one, drawn fairly from whatever is still free.
create or replace function public.hack_draw_envelopes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team    uuid;
  v_no      int;
  v_count   int := 0;
  v_skipped int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('infinium_envelopes'));

  for v_team in
    select id from hack_teams where envelope_no is null order by team_no
  loop
    select g into v_no
    from generate_series(1, 20) g
    where g not in (
      select envelope_no from hack_teams where envelope_no is not null
    )
    order by random()
    limit 1;

    if v_no is null then
      v_skipped := v_skipped + 1;   -- more teams than envelopes
      continue;
    end if;

    update hack_teams set envelope_no = v_no where id = v_team;
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('assigned', v_count, 'skipped', v_skipped);
end;
$$;

-- ── Clear every assignment ────────────────────────────────────────────────
create or replace function public.hack_clear_envelopes()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtext('infinium_envelopes'));
  update hack_teams set envelope_no = null where envelope_no is not null;
  get diagnostics v_count = row_count;
  return jsonb_build_object('cleared', v_count);
end;
$$;

-- Trusted server code only — never callable from a browser.
revoke all on function public.hack_assign_envelope(uuid, int) from public, anon, authenticated;
revoke all on function public.hack_draw_envelopes()            from public, anon, authenticated;
revoke all on function public.hack_clear_envelopes()           from public, anon, authenticated;

grant execute on function public.hack_assign_envelope(uuid, int) to service_role;
grant execute on function public.hack_draw_envelopes()           to service_role;
grant execute on function public.hack_clear_envelopes()          to service_role;

commit;

notify pgrst, 'reload schema';
