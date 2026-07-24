-- ============================================================================
-- CODE RED — seeded entirely as DATA on the Event Engine.
--
-- There is no CODE RED code anywhere in the application. This file is the
-- whole module: an event row, its capability flags, its theme, its mission
-- tree, its schedule and its badges. Deleting this row leaves a platform that
-- still builds and still serves /events.
--
-- Idempotent: re-running updates the event in place rather than duplicating.
-- ============================================================================

do $$
declare
  v_event uuid;
  v_recon uuid;
  v_build uuid;
  v_defend uuid;
  v_m1 uuid; v_m2 uuid; v_m3 uuid; v_m4 uuid; v_m5 uuid; v_m6 uuid;
begin

  -- ─────────────────────────── THE EVENT ───────────────────────────

  insert into public.ev_events (
    slug, name, tagline, summary, description, kind, status, visibility,
    starts_at, ends_at, register_opens_at, register_closes_at,
    venue, capacity, team_min, team_max, theme
  ) values (
    'code-red',
    'CODE RED',
    'When the system fails, who do you call?',
    'A 48-hour crisis-response hackathon. Teams take on escalating missions '
    || 'under live conditions — build, defend, and ship before the clock runs out.',
    'CODE RED puts your team inside a simulated incident. Missions unlock in '
    || 'sequence, each one raising the stakes: reconnaissance, rapid build, and '
    || 'a final defence round judged live. Points are awarded continuously and '
    || 'the leaderboard never stops moving.',
    'hackathon',
    'published',
    'public',
    now() + interval '30 days',
    now() + interval '32 days',
    now() - interval '1 day',
    now() + interval '25 days',
    'Emerald Heights International School — Innovation Lab',
    60, 2, 5,
    jsonb_build_object(
      'accent',      '#ff2d55',
      'accentSoft',  '#ff6b81',
      'surface',     '#0a0a0c',
      'grid',        'rgba(255,45,85,0.08)',
      'mode',        'mission-control',
      'motion',      'high',
      'codename',    'CR'
    )
  )
  on conflict (slug) do update set
    name               = excluded.name,
    tagline            = excluded.tagline,
    summary            = excluded.summary,
    description        = excluded.description,
    status             = excluded.status,
    visibility         = excluded.visibility,
    venue              = excluded.venue,
    capacity           = excluded.capacity,
    team_min           = excluded.team_min,
    team_max           = excluded.team_max,
    theme              = excluded.theme
  returning id into v_event;

  -- ───────────────────── CAPABILITIES (feature flags) ─────────────────────
  -- Turning any of these off changes what the platform renders, with no deploy.

  insert into public.ev_event_settings (event_id, key, value) values
    (v_event, 'registration_mode',      '"review"'::jsonb),
    (v_event, 'teams_enabled',          'true'::jsonb),
    (v_event, 'missions_enabled',       'true'::jsonb),
    (v_event, 'qr_enabled',             'true'::jsonb),
    (v_event, 'certificates_enabled',   'true'::jsonb),
    (v_event, 'inventory_enabled',      'true'::jsonb),
    (v_event, 'badges_enabled',         'true'::jsonb),
    (v_event, 'gallery_enabled',        'true'::jsonb),
    (v_event, 'leaderboard_visibility', '"public"'::jsonb),
    (v_event, 'leaderboard_subject',    '"team"'::jsonb),
    (v_event, 'ai_assistant_enabled',   'true'::jsonb),
    -- 'private.' keys never leave the staff boundary (see 0014 RLS).
    (v_event, 'private.rubric', jsonb_build_object(
        'innovation', 10, 'execution', 10, 'impact', 10,
        'presentation', 10, 'defence', 20))
  on conflict (event_id, key) do update set
    value = excluded.value, updated_at = now();

  -- ─────────────────────── MISSION CATEGORIES ───────────────────────

  insert into public.ev_mission_categories (event_id, name, slug, colour, icon, position)
  values
    (v_event, 'Recon',   'recon',   '#38bdf8', 'radar',  1),
    (v_event, 'Build',   'build',   '#ff2d55', 'hammer', 2),
    (v_event, 'Defend',  'defend',  '#f59e0b', 'shield', 3)
  on conflict (event_id, slug) do update set
    name = excluded.name, colour = excluded.colour,
    icon = excluded.icon, position = excluded.position;

  select id into v_recon  from public.ev_mission_categories where event_id = v_event and slug = 'recon';
  select id into v_build  from public.ev_mission_categories where event_id = v_event and slug = 'build';
  select id into v_defend from public.ev_mission_categories where event_id = v_event and slug = 'defend';

  -- ───────────────────────── MISSION TREE ─────────────────────────

  insert into public.ev_missions (
    event_id, category_id, code, title, brief, description, difficulty,
    points, time_limit_s, max_attempts, requires_verification, verifier_role,
    is_team_mission, status, position
  ) values
    (v_event, v_recon, 'CR-01', 'First Contact',
     'Establish your team and claim your incident file.',
     'Register your team, assign roles, and open the sealed incident brief. '
     || 'Submit your team charter to confirm you are operational.',
     'easy', 100, null, 1, true, 'volunteer', true, 'open', 1),

    (v_event, v_recon, 'CR-02', 'Signal Trace',
     'Identify the failure in the provided system.',
     'You are given a broken service and its logs. Find the root cause and '
     || 'submit a written incident analysis. Precision beats speed here.',
     'medium', 150, 5400, 2, true, 'judge', true, 'open', 2),

    (v_event, v_build, 'CR-03', 'Rapid Response',
     'Ship a working fix under time pressure.',
     'Build and deploy a working remediation for the fault you traced. '
     || 'A live demo URL and repository are both required.',
     'hard', 250, 14400, 1, true, 'judge', true, 'open', 3),

    (v_event, v_build, 'CR-04', 'Hardening Pass',
     'Make it survive contact with reality.',
     'Add tests, error handling and observability. Your submission must show '
     || 'the system recovering from a failure you introduce yourself.',
     'hard', 200, 10800, 1, true, 'judge', true, 'open', 4),

    (v_event, v_defend, 'CR-05', 'Blackout Drill',
     'A surprise constraint lands mid-build.',
     'Revealed live during the event. Teams adapt their build to a new '
     || 'constraint within the window or forfeit the points.',
     'hard', 200, 3600, 1, true, 'judge', true, 'scheduled', 5),

    (v_event, v_defend, 'CR-06', 'Final Defence',
     'Present, defend, and survive the judges.',
     'A live pitch followed by open questioning from the judging panel. '
     || 'Scored against the published rubric.',
     'legendary', 300, 900, 1, true, 'judge', true, 'scheduled', 6)
  on conflict (event_id, code) do update set
    title = excluded.title, brief = excluded.brief,
    description = excluded.description, difficulty = excluded.difficulty,
    points = excluded.points, time_limit_s = excluded.time_limit_s,
    status = excluded.status, position = excluded.position,
    category_id = excluded.category_id;

  select id into v_m1 from public.ev_missions where event_id = v_event and code = 'CR-01';
  select id into v_m2 from public.ev_missions where event_id = v_event and code = 'CR-02';
  select id into v_m3 from public.ev_missions where event_id = v_event and code = 'CR-03';
  select id into v_m4 from public.ev_missions where event_id = v_event and code = 'CR-04';
  select id into v_m5 from public.ev_missions where event_id = v_event and code = 'CR-05';
  select id into v_m6 from public.ev_missions where event_id = v_event and code = 'CR-06';

  -- Dependency chain. Enforced in Postgres, so a locked mission cannot be
  -- started by calling the API directly.
  insert into public.ev_mission_deps (mission_id, depends_on_id) values
    (v_m2, v_m1), (v_m3, v_m2), (v_m4, v_m3), (v_m6, v_m3)
  on conflict do nothing;

  -- ─────────────────────────── SCHEDULE ───────────────────────────

  delete from public.ev_schedule where event_id = v_event;
  insert into public.ev_schedule (event_id, title, description, kind, starts_at, ends_at, location, position)
  values
    (v_event, 'Orientation & Team Check-in', 'Roll call, kit handout, rules briefing.',
     'ceremony', now() + interval '30 days', now() + interval '30 days 1 hour', 'Main Hall', 1),
    (v_event, 'Incident Declared', 'Missions CR-01 and CR-02 unlock.',
     'session', now() + interval '30 days 1 hour', now() + interval '30 days 3 hours', 'Innovation Lab', 2),
    (v_event, 'Build Window', 'CR-03 and CR-04 open. Mentors on the floor.',
     'session', now() + interval '30 days 3 hours', now() + interval '31 days 12 hours', 'Innovation Lab', 3),
    (v_event, 'Blackout Drill', 'Surprise constraint revealed. One hour to adapt.',
     'challenge', now() + interval '31 days 14 hours', now() + interval '31 days 15 hours', 'Innovation Lab', 4),
    (v_event, 'Submission Deadline', 'All repositories and demos frozen.',
     'deadline', now() + interval '32 days 2 hours', null, null, 5),
    (v_event, 'Final Defence', 'Live pitches and judging panel.',
     'judging', now() + interval '32 days 3 hours', now() + interval '32 days 6 hours', 'Main Hall', 6),
    (v_event, 'Results & Closing', 'Leaderboard reveal, certificates, wrap.',
     'ceremony', now() + interval '32 days 7 hours', now() + interval '32 days 8 hours', 'Main Hall', 7);

  -- ──────────────────────────── BADGES ────────────────────────────

  insert into public.ev_badges (event_id, code, title, description, icon, rarity, points, position)
  values
    (v_event, 'FIRST_BLOOD',  'First Blood',      'First team to clear a mission.',        'zap',      'rare',      50, 1),
    (v_event, 'CLEAN_TRACE',  'Clean Trace',      'Root cause identified on first attempt.','search',   'rare',      40, 2),
    (v_event, 'SHIPPED',      'Shipped It',       'Live demo reachable at judging.',        'rocket',   'epic',      60, 3),
    (v_event, 'RESILIENT',    'Resilient',        'Survived the Blackout Drill intact.',    'shield',   'epic',      60, 4),
    (v_event, 'FULL_SWEEP',   'Full Sweep',       'Every mission completed.',               'trophy',   'legendary', 100, 5),
    (v_event, 'JUDGES_CHOICE','Judges'' Choice',  'Panel''s standout team.',                'crown',    'legendary', 100, 6)
  on conflict (event_id, code) do update set
    title = excluded.title, description = excluded.description,
    icon = excluded.icon, rarity = excluded.rarity,
    points = excluded.points, position = excluded.position;

  -- ─────────────────────────── INVENTORY ───────────────────────────

  insert into public.ev_inventory_items (event_id, code, title, description, icon, kind, value)
  values
    (v_event, 'HINT_TOKEN',  'Hint Token',   'Redeem for one mentor hint on any mission.', 'lightbulb', 'powerup',
     jsonb_build_object('effect','hint')),
    (v_event, 'TIME_EXT',    'Time Extension','Adds 15 minutes to one timed mission.',      'clock',     'powerup',
     jsonb_build_object('effect','extend_time','seconds',900)),
    (v_event, 'RETRY_PASS',  'Retry Pass',   'One extra attempt on a failed mission.',      'refresh',   'powerup',
     jsonb_build_object('effect','extra_attempt'))
  on conflict (event_id, code) do update set
    title = excluded.title, description = excluded.description, value = excluded.value;

  raise notice 'CODE RED seeded as event %', v_event;
end $$;

select 'code red seeded' as status;
