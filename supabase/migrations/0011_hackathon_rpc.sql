-- ============================================================================
-- Infinium Hackathon RPC repair.
--
-- These functions let public team registration/login/submission work while RLS
-- remains public-read only. They are idempotent so they can be run safely on the
-- existing production database.
-- ============================================================================

create extension if not exists "pgcrypto";

alter table public.hack_teams
  add column if not exists school text,
  add column if not exists reg_status text not null default 'pending',
  add column if not exists team_no integer,
  add column if not exists team_code text unique,
  add column if not exists password_hash text,
  add column if not exists approved_at timestamptz;

alter table public.hack_participants
  add column if not exists class_section text,
  add column if not exists member_role text,
  add column if not exists is_quiz_rep boolean not null default false,
  add column if not exists team_id uuid references public.hack_teams(id) on delete cascade;

alter table public.hack_scores
  add column if not exists innovation numeric not null default 0,
  add column if not exists practicality numeric not null default 0,
  add column if not exists uiux numeric not null default 0,
  add column if not exists working_demo numeric not null default 0,
  add column if not exists problem_solving numeric not null default 0,
  add column if not exists presentation numeric not null default 0,
  add column if not exists task_completion numeric not null default 0,
  add column if not exists code_quality numeric not null default 0,
  add column if not exists speed_bonus numeric not null default 0,
  add column if not exists bonus_challenge numeric not null default 0,
  add column if not exists penalties numeric not null default 0,
  add column if not exists notes text,
  add column if not exists submitted boolean not null default false;

create table if not exists public.hack_team_cards (
  team_id uuid not null references public.hack_teams(id) on delete cascade,
  achievement_id uuid not null references public.hack_achievements(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (team_id, achievement_id)
);

alter table public.hack_team_cards enable row level security;
drop policy if exists "hack public read" on public.hack_team_cards;
create policy "hack public read" on public.hack_team_cards for select using (true);

create or replace function public.hack_register_team(
  p_team_name text,
  p_school text,
  p_tagline text,
  p_members jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_member jsonb;
  v_count integer;
  v_name text := btrim(coalesce(p_team_name, ''));
  v_key text;
  v_keys text[] := '{}';
begin
  if length(v_name) < 3 then
    raise exception 'Give your team a name (3+ characters).';
  end if;

  if jsonb_typeof(p_members) <> 'array' or jsonb_array_length(p_members) < 2 then
    raise exception 'A team needs at least 2 members.';
  end if;

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

  insert into public.hack_teams (name, tagline, school, reg_status, status)
  values (
    v_name,
    nullif(btrim(coalesce(p_tagline, '')), ''),
    nullif(btrim(coalesce(p_school, '')), ''),
    'pending',
    'forming'
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

  return v_team_id;
end;
$$;

create or replace function public.hack_team_salt(p_code text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select split_part(password_hash, ':', 1)
  from public.hack_teams
  where upper(team_code) = upper(btrim(p_code))
    and password_hash like '%:%'
  limit 1
$$;

create or replace function public.hack_team_login(p_code text, p_password_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_team public.hack_teams%rowtype;
begin
  select * into v_team
  from public.hack_teams
  where upper(team_code) = upper(btrim(p_code))
  limit 1;

  if v_team.id is null or v_team.password_hash is distinct from p_password_hash then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  if coalesce(v_team.reg_status, 'pending') <> 'approved' then
    return jsonb_build_object('ok', false, 'reason', 'pending');
  end if;

  return jsonb_build_object('ok', true, 'team_id', v_team.id);
end;
$$;

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
    github_url = excluded.github_url,
    demo_url = excluded.demo_url,
    presentation_url = excluded.presentation_url,
    docs_url = excluded.docs_url,
    notes = excluded.notes,
    status = excluded.status,
    submitted_at = excluded.submitted_at;

  update public.hack_teams
  set
    github_url = nullif(btrim(coalesce(p_github, '')), ''),
    demo_url = nullif(btrim(coalesce(p_demo, '')), ''),
    status = case when p_finalize then 'submitted'::hack_team_status else status end,
    progress = case when p_finalize then 100 else progress end
  where id = p_team_id;
end;
$$;

grant execute on function public.hack_register_team(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.hack_team_salt(text) to anon, authenticated;
grant execute on function public.hack_team_login(text, text) to anon, authenticated;
grant execute on function public.hack_save_submission(uuid, text, text, text, text, text, boolean) to anon, authenticated;
