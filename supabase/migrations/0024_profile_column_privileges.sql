-- ============================================================================
-- 0024 — Stop anonymous visitors reading private profile columns.
--
-- The `profiles readable by everyone` policy is USING (true), which is what
-- the public team page needs. But RLS is row-level: it decides *which rows*
-- a caller sees, never which columns. So an anonymous caller holding the
-- publishable key could ask PostgREST for `select=*` and get back `phone`,
-- `must_change_password`, `is_active` and the activity timestamps along with
-- the name and headline the page actually displays.
--
-- Column privileges are the right tool for that half of the problem. The
-- policy still says "all rows are public"; the grant now says "these columns
-- are public". Application code already selects an explicit column list, but
-- that is a convention — this makes it an invariant enforced by Postgres,
-- and it holds for anyone querying the REST API directly.
--
-- `authenticated` keeps full column access: club members can see each other's
-- contact details, which is what a club roster is for. Only the anonymous
-- public is narrowed.
-- ============================================================================

begin;

revoke select on public.profiles from anon;

grant select (
  id,
  full_name,
  role,
  avatar_url,
  headline,
  bio,
  grade,
  skills,
  github_url,
  linkedin_url,
  website_url,
  -- Needed because the public team query filters on it; it carries no more
  -- information than the member's presence on the page already does.
  is_active
) on public.profiles to anon;

commit;
