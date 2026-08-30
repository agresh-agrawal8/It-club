-- ============================================================================
-- 0023 — Two-role cleanup, identity simplification, module removal.
--
-- This migration is the schema half of the platform cleanup:
--   * Applications (join_requests), Messages (contact_messages) and Projects
--     are removed entirely — tables, columns and relations, not just the UI.
--   * The five-value role system collapses to exactly two: member | core_team.
--     Master Admin / Super Admin / Admin / Teacher / Visitor all disappear.
--   * The user model loses its external identifiers: `member_id` (the human
--     "SOCH-0001" handle) and the real email address. Identity is now
--     name + password + role. Supabase Auth still requires an email column,
--     so accounts carry a synthetic, internal-only address derived from the
--     name; it is never collected, displayed, or stored on the profile.
--   * Gallery items gain the metadata the public pages need for SEO, all of
--     which is derived server-side from the single title the uploader types.
--
-- `is_admin()` keeps its name on purpose: 33 RLS policies across the
-- hackathon and event-hub modules call it. Redefining the body (rather than
-- renaming the function) means those modules keep working untouched.
-- ============================================================================

begin;

-- ── 1. Remove the Projects module ───────────────────────────────────────────
alter table public.tasks drop column if exists project_id;
drop table if exists public.project_media cascade;
drop table if exists public.project_authors cascade;
drop table if exists public.projects cascade;

-- ── 2. Remove Applications and Messages ─────────────────────────────────────
drop table if exists public.join_requests cascade;
drop table if exists public.contact_messages cascade;

-- ── 3. Remove obsolete users ────────────────────────────────────────────────
-- Only Agresh Agrawal survives. profiles.id -> auth.users(id) is ON DELETE
-- CASCADE, so removing the auth rows removes the profiles and every
-- profile-owned row (notifications, push subscriptions) with them.
delete from auth.users
where id <> 'd39f6cb2-7eb5-4a5e-9c46-4ca8195c4ae2'::uuid;

-- ── 3b. Storage: retire the projects bucket and the auth_role() predicate ───
-- Three storage policies still type-reference `user_role` (via auth_role()),
-- which would block the enum swap below. Two of them guard the now-dead
-- `projects` bucket; the third only needed to say "a signed-in club account",
-- which auth.uid() expresses without naming any role at all.
drop policy if exists "members upload project media" on storage.objects;
drop policy if exists "owner or admin manage project media" on storage.objects;
drop policy if exists "members upload media" on storage.objects;

create policy "members upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and auth.uid() is not null);

drop policy if exists "public read storage" on storage.objects;
create policy "public read storage" on storage.objects
  for select using (bucket_id in ('avatars', 'events', 'gallery', 'tasks'));

-- The empty `projects` bucket itself is removed through the Storage API —
-- Supabase blocks direct DELETEs against storage.* to prevent orphaned objects.

drop function if exists public.auth_role();

-- ── 4. Collapse the role system to two values ───────────────────────────────
alter table public.profiles alter column role drop default;
alter type public.user_role rename to user_role_old;
create type public.user_role as enum ('member', 'core_team');

alter table public.profiles
  alter column role type public.user_role
  using (
    case when role::text in ('admin', 'super_admin') then 'core_team' else 'member' end
  )::public.user_role;

alter table public.profiles alter column role set default 'member'::public.user_role;
drop type public.user_role_old;

-- ── 5. Simplify the user identity ───────────────────────────────────────────
alter table public.profiles drop column if exists member_id;

-- Set when the core team resets someone's password: the next sign-in is
-- forced through the change-password screen before anything else is reachable.
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Name is the login identifier now, so it must be unique.
update public.profiles set full_name = btrim(full_name) where full_name <> btrim(full_name);
create unique index if not exists profiles_full_name_lower_key
  on public.profiles (lower(full_name));

-- ── 6. Role predicates ──────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select role = 'core_team' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- `is_staff()` existed only to give teachers read-only oversight. The teacher
-- role is gone, so the policies that used it now read as core-team-only and
-- the function itself is dropped rather than left as a dead alias.
-- (Two of the six were on join_requests / contact_messages, already dropped.)
drop policy if exists "submissions staff read" on public.submissions;
create policy "submissions core read" on public.submissions
  for select using (public.is_admin());

drop policy if exists "tasks staff read" on public.tasks;
create policy "tasks core read" on public.tasks
  for select using (public.is_admin());

drop policy if exists "page_views staff read" on public.page_views;
create policy "page_views core read" on public.page_views
  for select using (public.is_admin());

drop policy if exists "subscribers staff read" on public.subscribers;
create policy "subscribers core read" on public.subscribers
  for select using (public.is_admin());

drop function if exists public.is_staff();

-- ── 7. Account provisioning without member_id / real email ──────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- The old signature took p_email and p_member_id. Drop it outright so no
-- caller can keep provisioning accounts the old way.
drop function if exists public.admin_create_member(text, text, text, text, text);

-- Synthetic, internal-only auth address derived from the member's name.
-- Mirrors authEmailForName() in src/lib/identity.ts — the two must agree.
create or replace function public.auth_email_for_name(p_name text)
returns text language sql immutable as $$
  select btrim(regexp_replace(lower(btrim(p_name)), '[^a-z0-9]+', '.', 'g'), '.')
         || '@members.avinya.local';
$$;

create or replace function public.admin_create_member(
  p_full_name text,
  p_password text,
  p_role text default 'member'
)
returns json
language plpgsql
security definer
set search_path to 'auth', 'public', 'extensions'
as $$
declare
  new_id uuid := gen_random_uuid();
  v_email text := public.auth_email_for_name(p_full_name);
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_role not in ('member', 'core_team') then
    raise exception 'Invalid role';
  end if;
  if length(btrim(coalesce(p_full_name, ''))) < 2 then
    raise exception 'Enter the full name';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;
  if v_email = '@members.avinya.local' then
    raise exception 'That name cannot be used as a sign-in name';
  end if;
  if exists (select 1 from auth.users where email = v_email) then
    raise exception 'Someone with that name already has an account';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    v_email, crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', btrim(p_full_name), 'role', p_role),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), new_id, new_id::text,
    jsonb_build_object('sub', new_id::text, 'email', v_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- New accounts always start on a temporary credential.
  insert into public.profiles (id, full_name, role, must_change_password)
  values (new_id, btrim(p_full_name), p_role::user_role, true)
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role,
        must_change_password = true;

  return json_build_object('id', new_id);
end;
$$;

-- Core team resets a forgotten password. It sets a NEW temporary credential;
-- there is deliberately no way to read an existing one back out.
create or replace function public.admin_reset_member_password(
  p_profile_id uuid,
  p_password text
)
returns void
language plpgsql
security definer
set search_path to 'auth', 'public', 'extensions'
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;
  if length(coalesce(p_password, '')) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;
  if not exists (select 1 from public.profiles where id = p_profile_id) then
    raise exception 'No such member';
  end if;

  update auth.users
     set encrypted_password = crypt(p_password, gen_salt('bf')),
         updated_at = now()
   where id = p_profile_id;

  update public.profiles
     set must_change_password = true
   where id = p_profile_id;
end;
$$;

revoke all on function public.admin_create_member(text, text, text) from public, anon;
revoke all on function public.admin_reset_member_password(uuid, text) from public, anon;
grant execute on function public.admin_create_member(text, text, text) to authenticated;
grant execute on function public.admin_reset_member_password(uuid, text) to authenticated;

-- ── 8. Re-key the surviving account onto the new identity model ─────────────
-- Agresh Agrawal moves off the real email address onto the synthetic internal
-- one, and onto the supplied initial credential (bcrypt via pgcrypto — the
-- database stores only the hash).
update auth.users
   set email = public.auth_email_for_name('Agresh Agrawal'),
       encrypted_password = extensions.crypt('12345678', extensions.gen_salt('bf')),
       email_confirmed_at = coalesce(email_confirmed_at, now()),
       raw_user_meta_data =
         jsonb_build_object('full_name', 'Agresh Agrawal', 'role', 'core_team'),
       updated_at = now()
 where id = 'd39f6cb2-7eb5-4a5e-9c46-4ca8195c4ae2'::uuid;

update auth.identities
   set identity_data = jsonb_build_object(
         'sub', 'd39f6cb2-7eb5-4a5e-9c46-4ca8195c4ae2',
         'email', public.auth_email_for_name('Agresh Agrawal'),
         'email_verified', true
       ),
       updated_at = now()
 where user_id = 'd39f6cb2-7eb5-4a5e-9c46-4ca8195c4ae2'::uuid;

update public.profiles
   set role = 'core_team',
       is_active = true,
       must_change_password = false
 where id = 'd39f6cb2-7eb5-4a5e-9c46-4ca8195c4ae2'::uuid;

-- ── 9. Gallery: derived SEO metadata ────────────────────────────────────────
-- The uploader supplies an image and a title. Everything below is computed
-- server-side from those two inputs, so the form stays two fields wide.
alter table public.gallery_items drop column if exists album;
alter table public.gallery_items drop column if exists caption;
alter table public.gallery_items add column if not exists slug text;
alter table public.gallery_items add column if not exists alt_text text;
alter table public.gallery_items add column if not exists width integer;
alter table public.gallery_items add column if not exists height integer;

update public.gallery_items set slug = 'photo-' || left(id::text, 8) where slug is null;
alter table public.gallery_items alter column slug set not null;
create unique index if not exists gallery_items_slug_key on public.gallery_items (slug);

-- ── 10. Notification kinds: 'project' no longer exists ──────────────────────
alter type public.notification_type rename to notification_type_old;
create type public.notification_type as enum
  ('info', 'task', 'event', 'achievement', 'system');
alter table public.notifications alter column type drop default;
alter table public.notifications
  alter column type type public.notification_type
  using (
    case when type::text = 'project' then 'info' else type::text end
  )::public.notification_type;
alter table public.notifications
  alter column type set default 'info'::public.notification_type;
drop type public.notification_type_old;

commit;
