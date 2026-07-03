-- ============================================================================
-- Seed data — homepage content + settings. Safe to run repeatedly.
-- Member/admin accounts are created via Supabase Auth (see README), which
-- fires the handle_new_user() trigger to populate public.profiles.
-- ============================================================================

insert into public.settings (key, value) values
  ('homepage', jsonb_build_object(
    'hero_eyebrow', 'soch.exe · Emerald Heights International School',
    'hero_title', 'Where ideas compile into reality',
    'hero_subtitle', 'soch.exe is the official IT Club of Emerald Heights — projects, events, competitions and a community of student makers.',
    'primary_cta_label', 'Explore projects',
    'primary_cta_href', '/projects',
    'secondary_cta_label', 'Meet the team',
    'secondary_cta_href', '/team'
  )),
  ('contact', jsonb_build_object(
    'email', 'agresh@agreshagrawal.com',
    'location', 'Emerald Heights International School, Indore',
    'instagram', '',
    'github', 'https://github.com/agresh-agrawal8/It-club'
  ))
on conflict (key) do update set value = excluded.value, updated_at = now();
