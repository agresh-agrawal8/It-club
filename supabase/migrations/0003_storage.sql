-- ============================================================================
-- Storage buckets + policies
-- Buckets are public-read (for showcasing) but write-gated by role.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars',  'avatars',  true),
  ('projects', 'projects', true),
  ('events',   'events',   true),
  ('gallery',  'gallery',  true),
  ('tasks',    'tasks',    true)
on conflict (id) do nothing;

-- Public read for all showcase buckets.
create policy "public read storage"
  on storage.objects for select
  using (bucket_id in ('avatars','projects','events','gallery','tasks'));

-- Members may upload to their own avatar folder (path prefixed with their uid).
create policy "members upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "members update own avatars"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Members (and admins) may upload project media.
create policy "members upload project media"
  on storage.objects for insert
  with check (
    bucket_id = 'projects'
    and public.auth_role() in ('member','admin')
  );
create policy "owner or admin manage project media"
  on storage.objects for update
  using (bucket_id = 'projects' and public.auth_role() in ('member','admin'));

-- Admin-only buckets: events, gallery, tasks.
create policy "admins write events bucket"
  on storage.objects for insert with check (bucket_id = 'events' and public.is_admin());
create policy "admins write gallery bucket"
  on storage.objects for insert with check (bucket_id = 'gallery' and public.is_admin());
create policy "admins write tasks bucket"
  on storage.objects for insert with check (bucket_id = 'tasks' and public.is_admin());
create policy "admins manage privileged buckets"
  on storage.objects for update
  using (bucket_id in ('events','gallery','tasks') and public.is_admin());
create policy "admins delete privileged buckets"
  on storage.objects for delete
  using (bucket_id in ('events','gallery','tasks') and public.is_admin());
