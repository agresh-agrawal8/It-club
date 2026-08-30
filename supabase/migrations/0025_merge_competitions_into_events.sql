-- ============================================================================
-- 0025 — Fold competitions into events.
--
-- The club had two near-identical content types: `events` (workshops, hack
-- nights, talks) and `competitions` (the same thing, plus an organiser and a
-- result). Two tables, two admin pages, two public routes and two nav items
-- for what a visitor reads as one list of "things the club is doing".
--
-- A competition IS an event, so `events` becomes the single table and gains
-- the two columns competitions had that it lacked. Which kind an entry is
-- becomes a field, not a schema.
--
-- Both tables are empty, so there is nothing to migrate — but the merge is
-- written as an INSERT ... SELECT anyway so it stays correct if this is ever
-- applied to a database that does hold competition rows.
-- ============================================================================

begin;

create type public.event_kind as enum ('workshop', 'competition', 'hackathon', 'talk', 'other');

alter table public.events
  add column if not exists kind public.event_kind not null default 'workshop',
  -- Who is running it, when that is not the club itself.
  add column if not exists organizer text,
  -- How it went. Only meaningful once the entry is in the past.
  add column if not exists result text;

create index if not exists events_kind_idx on public.events (kind);

-- Carry over any competition rows as events of kind 'competition'.
insert into public.events (
  slug, title, description, banner_url, starts_at, ends_at, venue,
  registration_url, status, kind, organizer, result, created_by, created_at, updated_at
)
select
  c.slug,
  c.title,
  c.description,
  c.banner_url,
  -- events.starts_at is NOT NULL; competitions allowed it to be null.
  coalesce(c.starts_at, c.created_at),
  c.ends_at,
  c.location,
  c.registration_url,
  c.status,
  'competition',
  c.organizer,
  c.result,
  c.created_by,
  c.created_at,
  c.updated_at
from public.competitions c
on conflict (slug) do nothing;

drop table if exists public.competition_participants cascade;
drop table if exists public.competitions cascade;

commit;
