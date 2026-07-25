-- ============================================================================
-- Fix: the public "N / capacity places claimed" figure was always 0.
--
-- ev_participants is intentionally NOT public-read (it joins to ev_profiles,
-- which holds email/phone/grade). The landing and registration pages counted
-- rows through the anon client, so RLS correctly returned nothing and the
-- count rendered as 0 no matter how many teams had registered.
--
-- Capacity itself was never at risk — ev_register_team enforces it inside the
-- transaction — but the number shown to students was wrong, and the client-side
-- "registration open" check could not see a full event.
--
-- The fix exposes ONLY the aggregate through a SECURITY DEFINER function. A
-- count of registrations is already implied by the public leaderboard and team
-- list; no per-person row is readable through it.
--
-- Idempotent.
-- ============================================================================

create or replace function public.ev_registered_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.ev_participants
  where event_id = p_event_id
    and status not in ('rejected', 'withdrawn')
$$;

/** Team count for the same purpose (public team list already exposes names). */
create or replace function public.ev_team_count(p_event_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.ev_teams
  where event_id = p_event_id
    and status not in ('disqualified', 'withdrawn')
$$;

revoke all on function public.ev_registered_count(uuid) from public;
grant execute on function public.ev_registered_count(uuid) to anon, authenticated, service_role;

revoke all on function public.ev_team_count(uuid) from public;
grant execute on function public.ev_team_count(uuid) to anon, authenticated, service_role;

select 'event public counts ready' as status;
