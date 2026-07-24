# Avinya Event Platform — Architecture

**Status:** approved for implementation
**Scope:** turn the existing Emerald Heights IT Club site into a modular event platform. CODE RED is the first module on a reusable Event Engine, not a bespoke build.
**Non-goal:** redesigning the club site. Every existing club page keeps working, unchanged.

---

## 0. The one decision everything else follows from

> **Nothing in the platform knows what CODE RED is.**

CODE RED is a **row** in `ev_events` plus a **theme record** and a **seed file**. The engine renders any event from data. A second event (a workshop series, a quiz league, next year's CODE RED) is a new row and a new seed — no new routes, no new tables, no forked components.

The practical test: if you `delete from ev_events where slug = 'code-red'`, the platform must still build, still serve `/events`, and show an empty hub. That constraint is what keeps this a platform instead of a second website.

---

## 1. Overall architecture

Three isolated domains sharing one Next.js app, one Supabase project, and one design system.

```
┌────────────────────────────────────────────────────────────────┐
│                      Next.js 15 App Router                     │
├───────────────┬────────────────────┬───────────────────────────┤
│  CLUB DOMAIN  │   EVENT DOMAIN     │      LEGACY MODULE        │
│  (untouched)  │   (new)            │      (Infinium)           │
│               │                    │                           │
│  (public)/    │  (events)/events/  │  (hackathon)/hackathon/   │
│  (member)/    │    [event]/...     │                           │
│               │                    │                           │
│  tables:      │  tables: ev_*      │  tables: hack_*           │
│  profiles,    │                    │                           │
│  projects,    │  auth: ev_sessions │  auth: signed team cookie │
│  events, …    │  (3 credential     │                           │
│               │   paths)           │                           │
│  auth:        │                    │                           │
│  Supabase     │                    │                           │
│  Auth +       │                    │                           │
│  Member ID    │                    │                           │
├───────────────┴────────────────────┴───────────────────────────┤
│  SHARED: design tokens (globals.css), src/components/ui,       │
│  Supabase clients, utils, PWA shell, navbar/footer             │
└────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Supabase Postgres │
                    │  RLS is the only   │
                    │  security boundary │
                    └────────────────────┘
```

**Isolation rules (enforced, not aspirational):**

| Rule | Why |
|---|---|
| `ev_*` tables have **no FK into `profiles` / `auth.users`** except one **nullable** `ev_profiles.user_id` | The event system can be dropped wholesale; a participant does not need a club account |
| Event code never imports from `src/lib/data.ts` or `src/lib/actions/*` | Prevents the club domain leaking into the event domain |
| Club code never imports from `src/lib/events/*` | Prevents the reverse |
| Both import freely from `src/components/ui` and `src/lib/utils` | This is the shared ecosystem — one visual language |

**Why `ev_` and not a Postgres schema?** PostgREST exposes one schema by default; adding schemas means client config changes and breaks the existing `createClient()` helpers. A table prefix gives the same namespacing with zero infrastructure change, and `drop table ev_*` is just as clean.

---

## 2. Folder structure

```
src/
├── app/
│   ├── (public)/                  # ── CLUB. Untouched. Navbar + Footer layout.
│   ├── (member)/                  # ── CLUB. Untouched. Sidebar + requireUser.
│   ├── (hackathon)/               # ── LEGACY Infinium module. Untouched.
│   │
│   ├── (events)/                  # ── EVENT DOMAIN. Own layout, own chrome.
│   │   ├── layout.tsx             #    Event shell: no club navbar, event theming
│   │   └── events/
│   │       ├── page.tsx           #    Event Hub — all events, past + live + upcoming
│   │       └── [event]/           #    EVERYTHING below is event-generic
│   │           ├── layout.tsx     #    Loads event + theme + session → EventProvider
│   │           ├── page.tsx       #    Landing (cinematic, mission-control)
│   │           ├── about/         #    Details, rules, FAQ, sponsors
│   │           ├── register/      #    Registration funnel
│   │           ├── login/         #    Login (3 credential paths)
│   │           ├── join/[code]/   #    Team invite deep-link
│   │           ├── (participant)/ #    Auth-gated participant area
│   │           │   ├── layout.tsx #      requireParticipant()
│   │           │   ├── dashboard/
│   │           │   ├── missions/
│   │           │   │   └── [id]/  #      Mission detail + submission
│   │           │   ├── team/
│   │           │   ├── inventory/
│   │           │   ├── certificates/
│   │           │   └── profile/
│   │           ├── leaderboard/   #    Public, realtime
│   │           ├── schedule/      #    Public
│   │           ├── gallery/       #    Public
│   │           ├── (staff)/       #    Role-gated operational areas
│   │           │   ├── admin/     #      requireEventRole('admin','super_admin')
│   │           │   │   ├── page.tsx              # Ops dashboard + analytics
│   │           │   │   ├── registrations/
│   │           │   │   ├── participants/
│   │           │   │   ├── teams/
│   │           │   │   ├── missions/             # Mission Builder
│   │           │   │   ├── scores/
│   │           │   │   ├── announcements/
│   │           │   │   ├── broadcast/            # Emergency broadcast
│   │           │   │   ├── certificates/
│   │           │   │   ├── exports/
│   │           │   │   ├── logs/
│   │           │   │   └── settings/
│   │           │   ├── volunteer/ #      requireEventRole('volunteer', …)
│   │           │   │   ├── page.tsx              # Check-in desk
│   │           │   │   ├── scan/                 # QR scanner
│   │           │   │   ├── verify/               # Mission verification queue
│   │           │   │   └── issues/
│   │           │   └── judge/     #      requireEventRole('judge', …)
│   │           │       ├── page.tsx              # Assigned submissions
│   │           │       └── [submission]/
│   │           └── api/           #    Event-scoped Route Handlers
│   │
│   └── api/                       # ── Existing club APIs. Untouched.
│
├── components/
│   ├── ui/                        # ── SHARED primitives (existing). Extended, not forked.
│   ├── layout/                    # ── SHARED (existing navbar/footer/tabbar)
│   ├── features/                  # ── CLUB features (existing)
│   ├── hackathon/                 # ── LEGACY
│   └── events/                    # ── EVENT DOMAIN components
│       ├── shell/                 #    EventNav, EventFooter, EventProvider, RoleGate
│       ├── landing/               #    Hero, Countdown, Briefing, Trailer, FAQ, Sponsors
│       ├── mission/               #    MissionCard, MissionGrid, MissionTimer, UnlockReveal
│       ├── team/                  #    TeamCard, RosterEditor, InviteCode, TeamAvatar
│       ├── leaderboard/           #    LiveBoard, RankRow, RankDelta, PodiumScene
│       ├── dashboard/             #    StatTile, ProgressRing, NotificationFeed, Inventory
│       ├── admin/                 #    DataTable, MissionBuilder, ScoreManager, QrVerify
│       ├── ai/                    #    AssistantDock, TerminalOverlay, BriefingPlayer
│       └── fx/                    #    Particles, Radar, ScanLines, Typewriter, Glitch
│
├── lib/
│   ├── supabase/                  # ── SHARED clients (existing)
│   ├── auth.ts                    # ── CLUB auth (existing)
│   ├── data.ts, actions/          # ── CLUB (existing)
│   ├── hackathon/                 # ── LEGACY
│   └── events/                    # ── THE EVENT ENGINE
│       ├── engine.ts              #    getEvent, resolveTheme, event capability flags
│       ├── session.ts             #    signed cookie mint/verify (shared primitive)
│       ├── auth.ts                #    requireParticipant, requireEventRole, permissions
│       ├── queries.ts             #    all reads (RLS-aware, cached)
│       ├── actions/               #    server actions, one file per domain
│       │   ├── registration.ts
│       │   ├── teams.ts
│       │   ├── missions.ts
│       │   ├── scoring.ts
│       │   ├── attendance.ts
│       │   └── admin.ts
│       ├── scoring.ts             #    pure scoring/points rules (unit-testable)
│       ├── rules.ts               #    event rule evaluation (windows, caps, gates)
│       └── types.ts               #    domain types
│
├── stores/                        # ── Zustand: client-only ephemeral UI state
│   ├── ui.ts                      #    command palette, dock, overlays
│   └── mission-filter.ts
│
├── types/
│   ├── database.ts                # ── existing club types
│   └── events.ts                  # ── generated ev_* types
│
└── middleware.ts                  # ── extended with event route matchers

supabase/migrations/
├── 0001_init.sql … 0003_storage.sql   # club (untouched)
├── 0010_hackathon.sql … 0011_*.sql    # legacy (untouched)
├── 0012_hackathon_security.sql        # ✅ security hardening (this work)
├── 0013_event_engine.sql              # ev_* schema
├── 0014_event_rls.sql                 # ev_* policies + helper functions
└── 0015_seed_code_red.sql             # CODE RED as data

docs/
└── EVENT-PLATFORM-ARCHITECTURE.md     # this file
```

**Folder responsibilities**

| Folder | Owns | Must not |
|---|---|---|
| `app/(events)/events/[event]/` | Routing, layout, data fetching per page | Contain business rules — those live in `lib/events` |
| `components/events/` | Presentation + local interaction | Query Supabase directly; receives props |
| `lib/events/queries.ts` | Every read. One place to audit/cache | Mutate |
| `lib/events/actions/` | Every write. Each file authorises for itself | Be imported by client components other than via `useActionState` |
| `lib/events/scoring.ts`, `rules.ts` | Pure functions, no I/O | Import Supabase |
| `stores/` | Ephemeral client UI state | Hold server data (that's React Query / RSC) |

---

## 3. Database schema

23 tables. Everything is event-scoped by `event_id` — that single column is what makes the engine multi-event.

### 3.1 Core registry

```
ev_events              id, slug ᵁ, name, tagline, summary, status, kind,
                       starts_at, ends_at, register_opens_at, register_closes_at,
                       venue, capacity, team_min, team_max, cover_url, trailer_url,
                       theme jsonb, visibility, created_at
ev_event_settings      event_id, key, value jsonb              PK (event_id, key)
```

`ev_events.theme` holds the module's visual identity (accent ramp, hero treatment, motion profile). `ev_event_settings` holds behavioural flags — `registration_mode`, `missions_enabled`, `qr_enabled`, `certificates_enabled`, `leaderboard_visibility`. **Feature flags are data.** That is how one codebase serves a hackathon and a quiz league.

### 3.2 Identity & roles

```
ev_profiles            id, user_id ⇢ auth.users (NULLABLE), full_name, email,
                       phone, avatar_url, institution, grade, created_at
ev_participants        id, event_id ⇢ ev_events, profile_id ⇢ ev_profiles,
                       role ev_role, team_id ⇢ ev_teams (nullable),
                       status ev_participant_status, points int,
                       registered_at, approved_at
                       UNIQUE (event_id, profile_id)
ev_sessions            id, event_id, participant_id, kind, issued_at, expires_at,
                       revoked_at, user_agent_hash
```

`ev_role` enum: `guest | student | participant | team_leader | volunteer | judge | admin | super_admin`.

> **Design note — why not separate `admins` / `volunteers` / `judges` tables (as first sketched)?**
> Three tables means three places to add a person, three to revoke them, and a real chance of someone being a judge in one table and disabled in another. One `ev_participants.role` column is a single source of truth, one index, one RLS predicate. Multi-role (a volunteer who also judges) is handled by `ev_participant_roles` — a thin join table — rather than by duplicating the person. Revocation is then always one row.

```
ev_participant_roles   participant_id, role ev_role, granted_by, granted_at
                       PK (participant_id, role)
```

### 3.3 Teams

```
ev_teams               id, event_id, name, slug, tagline, avatar_url,
                       join_code ᵁ, leader_id ⇢ ev_participants,
                       status ev_team_status, points int, progress int,
                       approved_at, created_at
                       UNIQUE (event_id, lower(name))
ev_team_members        team_id, participant_id, role_label, is_leader, joined_at
                       PK (team_id, participant_id)
```

`ev_participants.team_id` is a denormalised convenience column kept in sync by trigger with `ev_team_members`; it makes the hot RLS predicate (`is this row mine?`) a single-table lookup instead of a join.

### 3.4 Mission engine

```
ev_mission_categories  id, event_id, name, slug, colour, icon, position
ev_missions            id, event_id, category_id, code ᵁ per event, title, brief,
                       description, difficulty, points, time_limit_s,
                       max_attempts, requires_verification, verifier_role,
                       unlock_at, lock_at, status, position, assets jsonb
ev_mission_deps        mission_id, depends_on_id      PK (mission_id, depends_on_id)
ev_mission_progress    id, mission_id, participant_id, team_id,
                       state ev_mission_state, attempts, started_at,
                       completed_at, verified_by, verified_at, score
                       UNIQUE (mission_id, COALESCE(team_id, participant_id))
ev_submissions         id, event_id, mission_id, team_id, participant_id,
                       payload jsonb, files jsonb, status, submitted_at,
                       reviewed_by, reviewed_at, feedback, score
```

`ev_mission_state`: `locked | available | in_progress | submitted | under_review | completed | rejected`.

**Dependency resolution runs in Postgres, not the client** (`ev_available_missions(event_id, subject_id)`), so a participant can never see or start a mission whose prerequisites are unmet — even by calling the API directly.

### 3.5 Scoring & leaderboard

```
ev_points_history      id, event_id, participant_id, team_id, delta int,
                       reason, source ev_point_source, ref_id,
                       awarded_by, created_at
ev_leaderboard         MATERIALIZED VIEW — event_id, subject_id, subject_kind,
                       display_name, avatar_url, points, missions_done,
                       last_award_at, rank
```

> **`ev_points_history` is the single source of truth for score.** `ev_participants.points` and `ev_teams.points` are trigger-maintained caches; the leaderboard is a materialised view refreshed on award. This is deliberate: an append-only ledger means a wrong award is *reversed* with a compensating row, never edited away, and the audit trail survives. It also makes "daily", "department" and "overall" boards the same query with a different `WHERE`.

### 3.6 Engagement & operations

```
ev_badges              id, event_id, code, title, description, icon, rarity, points
ev_participant_badges  participant_id, badge_id, awarded_by, awarded_at
ev_inventory_items     id, event_id, code, title, description, icon, kind, value
ev_participant_items   id, participant_id, item_id, qty, acquired_at, consumed_at
ev_announcements       id, event_id, title, body, severity, pinned, audience,
                       published_at, created_by
ev_notifications       id, event_id, participant_id, title, body, href,
                       kind, read_at, created_at
ev_schedule            id, event_id, title, description, kind, starts_at, ends_at,
                       location, position
ev_attendance          id, event_id, participant_id, session_key, method,
                       recorded_by, recorded_at    UNIQUE (participant_id, session_key)
ev_qr_tokens           id, event_id, participant_id, token ᵁ, purpose,
                       expires_at, consumed_at
ev_files               id, event_id, owner_id, bucket, path, mime, bytes,
                       kind, created_at
ev_certificates        id, event_id, participant_id, team_id, kind,
                       serial ᵁ, issued_at, revoked_at
ev_audit_logs          id, event_id, actor_id, actor_role, action, entity,
                       entity_id, before jsonb, after jsonb, ip_hash, created_at
```

`ev_logs` (application/system telemetry) is intentionally **not** a table — it goes to Vercel/Supabase log drains. A `logs` table in Postgres becomes the largest table in the database within a week and is the wrong tool. `ev_audit_logs` (who changed what) stays in Postgres because it must be transactional with the change it records.

### 3.7 Indexes

Every FK gets one. Beyond that, the queries that actually run hot:

```sql
ev_participants   (event_id, role) · (event_id, team_id) · (profile_id)
ev_teams          (event_id, status) · unique (event_id, lower(name)) · unique (join_code)
ev_missions       (event_id, status, position) · (event_id, category_id)
ev_mission_progress (participant_id) · (team_id) · unique (mission_id, coalesce(team_id, participant_id))
ev_points_history (event_id, created_at desc) · (participant_id) · (team_id)
ev_submissions    (event_id, status) · (mission_id, status)
ev_notifications  (participant_id, read_at) where read_at is null
ev_audit_logs     (event_id, created_at desc)
```

---

## 4. Authentication flow

Three credential paths, **one session primitive**. This is the part most likely to be got wrong, so it is specified precisely.

```
    ┌─ Path A: Club SSO ────────────────────────────────┐
    │  Existing Supabase Auth session (Member ID login) │
    │  → ev_profiles.user_id matched → participant       │
    └───────────────────────────────────────────────────┘
    ┌─ Path B: Public identity ─────────────────────────┐
    │  Google OAuth  ·  Email OTP                       │
    │  → Supabase Auth user → ev_profiles auto-created   │
    └───────────────────────────────────────────────────┘
    ┌─ Path C: Issued credentials ──────────────────────┐
    │  Team ID + password  ·  Secret event code         │
    │  (for students with no account, offline handout)  │
    └───────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │  ev_sessions row +    │
              │  HMAC-signed cookie   │
              │  ev_sess_<event-slug> │
              └───────────────────────┘
                          │
        requireParticipant() / requireEventRole()
```

**Session cookie format:** `<participantId>.<issuedAtMs>.<HMAC-SHA256(payload, EVENT_SESSION_SECRET)>`, `httpOnly`, `secure` in production, `sameSite=lax`, path-scoped to the event.

> **This is the exact bug class already fixed in the Infinium module.** The old cookie stored a bare team UUID, and `hack_teams` is world-readable — so anyone could list team IDs and set the cookie to become that team. IDs are identifiers, never credentials. Every session cookie on this platform is signed, carries an issue timestamp, and is verified server-side before use. `ev_sessions` additionally allows server-side revocation (kick a device, end an event), which a stateless cookie alone cannot do.

**QR check-in** is *not* an authentication path. A scanned QR proves presence, not identity — it produces an `ev_attendance` row via a volunteer's already-authenticated session. `ev_qr_tokens` are single-use and time-boxed so a photographed badge cannot be replayed.

**Rate limiting:** login attempts recorded per credential; 10 failures / 15 min locks the credential. Already implemented for Infinium team login in `0012`; the engine reuses the same pattern. Issued passwords use a wordlist+digits format whose keyspace is small enough that throttling is mandatory, not optional.

---

## 5. Event flow

```
 ┌─────────┐
 │ Landing │ public · countdown · briefing · trailer
 └────┬────┘
      ▼
 ┌──────────────┐   rules.ts: registration window open? capacity left?
 │ Registration │   ─────────────────────────────────────────────────
 └────┬─────────┘   solo → participant · team → participant + team
      ▼
 ┌───────────────┐        ┌──────────────┐
 │ Create Team   │◄──or──►│ Join by code │  /events/[event]/join/[code]
 └────┬──────────┘        └──────┬───────┘
      └───────────┬──────────────┘
                  ▼
          ┌───────────────┐   registration_mode = 'auto' → skip
          │   Approval    │   registration_mode = 'review' → admin queue
          └───────┬───────┘
                  ▼  credentials issued (Path C) or account linked (A/B)
          ┌───────────────┐
          │     Login     │
          └───────┬───────┘
                  ▼
          ┌───────────────┐
          │   Dashboard   │◄────────────────┐
          └───────┬───────┘                 │
                  ▼                          │
          ┌───────────────────┐              │
          │ Mission allocated │ deps met, unlock_at passed
          └───────┬───────────┘              │
                  ▼                          │
          ┌───────────────────┐              │
          │ Attempt → Submit  │              │
          └───────┬───────────┘              │
                  ▼                          │
          ┌───────────────────┐              │
          │ Verify (volunteer)│              │
          │ Judge (score)     │              │
          └───────┬───────────┘              │
                  ▼                          │
          ┌───────────────────┐              │
          │ ev_points_history │──────────────┘ unlocks next mission
          └───────┬───────────┘
                  ▼
          ┌───────────────┐      ┌──────────────┐
          │  Leaderboard  │      │ Certificate  │ on event close
          └───────────────┘      └──────────────┘
```

Every transition is guarded by `lib/events/rules.ts` server-side. The UI hides unavailable actions; the server *rejects* them.

---

## 6. Component tree

```
(events)/layout.tsx
└── EventShell
    └── [event]/layout.tsx  ── loads event + theme + session
        ├── <EventThemeProvider>        CSS custom props from ev_events.theme
        ├── <EventProvider>             event, settings, session (RSC → context)
        ├── <EventNav>                  role-aware links
        ├── <AssistantDock>             floating AI assistant (client, lazy)
        └── {children}
            │
            ├── page.tsx  (Landing)
            │   ├── <HeroScene>          Three.js, dynamic import, ssr:false
            │   ├── <Countdown>          to starts_at / register_closes_at
            │   ├── <RegistrationStatus> derived from rules.ts
            │   ├── <MissionBriefing>    typewriter terminal
            │   ├── <TrailerEmbed>
            │   ├── <ScheduleStrip>
            │   ├── <FaqAccordion>
            │   └── <SponsorWall>
            │
            ├── (participant)/dashboard/page.tsx
            │   ├── <StatRow>            score · rank · missions · streak
            │   ├── <ProgressRing>
            │   ├── <MissionGrid>
            │   │   └── <MissionCard> ×n  state-driven: locked/available/…
            │   ├── <TeamPanel>
            │   ├── <NotificationFeed>   realtime
            │   ├── <BadgeShelf>
            │   ├── <InventoryStrip>
            │   └── <DownloadsPanel>
            │
            ├── missions/[id]/page.tsx
            │   ├── <MissionHeader>      difficulty · points · timer
            │   ├── <MissionBrief>
            │   ├── <DependencyTrail>
            │   └── <SubmissionForm>
            │
            ├── leaderboard/page.tsx
            │   └── <LiveBoard>          realtime subscription
            │       ├── <PodiumScene>
            │       └── <RankRow> ×n     animated reorder (layout animation)
            │
            ├── (staff)/admin/…
            │   ├── <AdminShell>         reuses club AdminShell patterns
            │   ├── <StatGrid> / <AnalyticsCharts>
            │   ├── <DataTable>          generic, column-config driven
            │   ├── <MissionBuilder>
            │   ├── <ScoreManager>
            │   └── <BroadcastComposer>
            │
            ├── (staff)/volunteer/…
            │   ├── <QrScanner>          camera, lazy
            │   ├── <CheckinDesk>
            │   └── <VerificationQueue>
            │
            └── (staff)/judge/…
                ├── <SubmissionQueue>
                └── <ScoringSheet>       criteria from ev_event_settings
```

**Reusable primitives added to `components/ui`** (shared with the club site, so the ecosystem stays one system): `Dialog`, `Sheet`, `Tabs`, `Tooltip`, `DropdownMenu`, `Table`, `Toast`, `Command`. These follow the existing `src/components/ui` conventions — shadcn-style composition, but built on the project's own tokens rather than dropped in wholesale, because the site already has a design system and two token sets would fight.

---

## 7. Route map

| Route | Access | Rendering |
|---|---|---|
| `/events` | public | RSC, ISR |
| `/events/[event]` | public | RSC + streamed sections |
| `/events/[event]/about` | public | RSC, static |
| `/events/[event]/schedule` | public | RSC |
| `/events/[event]/gallery` | public | RSC |
| `/events/[event]/leaderboard` | public¹ | RSC shell + realtime client |
| `/events/[event]/register` | public² | RSC + client form |
| `/events/[event]/login` | public | static + client form |
| `/events/[event]/join/[code]` | public | RSC |
| `/events/[event]/dashboard` | participant | RSC, dynamic |
| `/events/[event]/missions` | participant | RSC, dynamic |
| `/events/[event]/missions/[id]` | participant³ | RSC, dynamic |
| `/events/[event]/team` | participant | RSC, dynamic |
| `/events/[event]/inventory` | participant | RSC |
| `/events/[event]/certificates` | participant⁴ | RSC |
| `/events/[event]/profile` | participant | RSC |
| `/events/[event]/admin/**` | admin, super_admin | RSC, dynamic |
| `/events/[event]/volunteer/**` | volunteer+ | RSC, dynamic |
| `/events/[event]/judge/**` | judge+ | RSC, dynamic |

¹ subject to `leaderboard_visibility` setting · ² subject to registration window · ³ must be unlocked for this subject · ⁴ only after event close

**Legacy:** `/hackathon/*` keeps working exactly as today. Once CODE RED ships, Infinium can be *migrated* into the engine as a second event row (`/events/infinium`) and `/hackathon/*` becomes redirects — but that is a later, optional step, not a prerequisite.

**Middleware** matches `/events/:event/(dashboard|missions|team|inventory|certificates|profile|admin|volunteer|judge)` and redirects unauthenticated requests to the event's own login, preserving `?next=`.

---

## 8. API architecture

**Server Actions are the default.** Route Handlers exist only where an action cannot serve: streaming, webhooks, non-browser clients, file responses.

```
Server Actions            lib/events/actions/*.ts
  registration.ts   registerParticipant, registerTeam, joinTeam, leaveTeam
  teams.ts          createTeam, renameTeam, setAvatar, assignRole, kickMember
  missions.ts       startMission, submitMission, cancelAttempt
  scoring.ts        awardPoints, revokePoints, scoreSubmission, verifyMission
  attendance.ts     checkIn, issueQrToken, consumeQrToken
  admin.ts          approveRegistration, publishAnnouncement, broadcast,
                    buildMission, toggleSetting, issueCertificates

Route Handlers            app/(events)/events/[event]/api/
  /leaderboard/stream     GET   SSE fallback where realtime WS is blocked
  /certificates/[id]      GET   generated PDF response
  /exports/[entity]       GET   CSV stream (admin)
  /qr/[token]             POST  scanner endpoint (volunteer)
```

**Every mutating entry point follows the same five steps, in order:**

1. **Authenticate** — `requireParticipant()` / `requireEventRole()`. Never trust an ID from the request body.
2. **Authorise** — does this role, in *this* event, hold this permission?
3. **Validate** — Zod schema on all input.
4. **Apply rules** — `rules.ts`: window open? attempts left? dependencies met? capacity?
5. **Mutate + audit** — write, then `ev_audit_logs` in the same transaction.

> Step 1 is not optional boilerplate. In a `"use server"` module **every export is a public POST endpoint**, whether or not any component renders it — which is precisely how the existing hackathon module ended up with unauthenticated score-writing and announcement-posting endpoints reachable by anyone. The rule is: *one authorisation check per exported action, no exceptions, including "internal" helpers.*

Writes that need to bypass RLS run through `SECURITY DEFINER` RPCs whose `EXECUTE` is granted to `service_role` only — the authorisation decision having already been made in step 1–2.

---

## 9. State management

Four tiers, each with a clear owner. Most state belongs in the first tier.

| Tier | Tool | Holds | Example |
|---|---|---|---|
| Server state (default) | **RSC + Server Actions** | Everything persistent | missions, teams, scores |
| Realtime server state | **React Query + Supabase Realtime** | Rows that change while you watch | leaderboard, notifications, mission queue |
| Client UI state | **Zustand** | Ephemeral, never persisted | command palette open, filters, dock state |
| Form state | **`useActionState`** | In-flight submission | every form |

Rules: React Query is **only** for realtime-subscribed or poll-driven data — static reads stay in RSC where they cost nothing. Zustand stores **never** hold server data; duplicating a row into a store is how two sources of truth get created. Realtime channels are scoped `event:<id>:<topic>` and subscribed at the layout level, not per component.

---

## 10. The reusable Event Engine

Six modules. Nothing in them mentions CODE RED.

```ts
// engine.ts — resolve an event and its capabilities from a slug
getEvent(slug): Event | null
getEventSettings(eventId): Settings          // typed, defaulted
resolveTheme(event): ThemeVars               // → CSS custom properties
can(event, capability): boolean              // 'missions' | 'teams' | 'qr' | …

// auth.ts — identity for this event
getEventSession(event): Session | null
requireParticipant(event): Session           // redirects to event login
requireEventRole(event, ...roles): Session   // redirects home
permissions(role): Permission[]

// rules.ts — pure predicates, no I/O, unit-tested
registrationOpen(event, now): Result
teamSizeValid(event, count): Result
missionAvailable(mission, deps, progress, now): MissionState
canSubmit(mission, progress, now): Result
canScore(role, submission): Result

// scoring.ts — pure
missionScore(mission, submission, rubric): number
applyPenalties(base, penalties): number
rankSubjects(rows): RankedRow[]

// queries.ts — every read
// actions/  — every write
```

**Adding a second event is then:**

1. `insert into ev_events (slug, name, …)` + theme JSON
2. `insert into ev_event_settings` — which capabilities are on
3. Seed `ev_missions` / `ev_schedule` / `ev_badges`
4. *(optional)* a theme-specific hero component, registered in a lookup map

No new routes. No new tables. No engine changes. **That is the deliverable** — CODE RED is the proof it works, not the product.

---

## 11. UI wireframe structure

Design language: **mission control** — NASA telemetry, cyber-security console, glassmorphism, dense but calm. Dark by default, the existing brand ramp as the accent, generous negative space, monospace for identifiers and numbers. Explicitly *not* generic school-website styling.

```
LANDING
┌──────────────────────────────────────────────────────────┐
│ ▓▓ EVENT NAV        Home Missions Schedule Board  [Login]│
├──────────────────────────────────────────────────────────┤
│                                                          │
│   ● SYSTEM ARMED                    ┌──────────────┐     │
│   C O D E   R E D                   │              │     │
│   ─────────────────                 │   3D scene   │     │
│   > mission briefing typing…        │   (lazy)     │     │
│                                     └──────────────┘     │
│   ┌────┬────┬────┬────┐                                  │
│   │ 02 │ 14 │ 33 │ 09 │  T-MINUS      [ ENLIST NOW → ]   │
│   │DAYS│ HR │MIN │SEC │               47 / 60 slots      │
│   └────┴────┴────┴────┘                                  │
├──────────────────────────────────────────────────────────┤
│  BRIEFING · SCHEDULE · FAQ · SPONSORS                    │
└──────────────────────────────────────────────────────────┘

PARTICIPANT DASHBOARD
┌──────────────────────────────────────────────────────────┐
│ AGENT-042 · TEAM NIGHTFALL              ⬤ RANK 07  1,240 │
├───────────────────────────────┬──────────────────────────┤
│ ACTIVE MISSIONS               │  TEAM                    │
│ ┌───────────┐ ┌───────────┐   │  ┌────────────────────┐  │
│ │ ▶ M-03    │ │ 🔒 M-04   │   │  │ ●●●●○  4/5         │  │
│ │ RECON     │ │ LOCKED    │   │  │ progress ▓▓▓▓░ 72% │  │
│ │ ●●○ 150pt │ │ needs M-03│   │  └────────────────────┘  │
│ │ ⏱ 42:10   │ │           │   │  NOTIFICATIONS           │
│ └───────────┘ └───────────┘   │  · Mission M-03 unlocked │
│ ┌───────────┐ ┌───────────┐   │  · +150 pts awarded      │
│ │ ✓ M-01    │ │ ✓ M-02    │   │  BADGES  ▣▣▣▢▢▢          │
│ └───────────┘ └───────────┘   │  INVENTORY  ⚡×2  🛡×1    │
└───────────────────────────────┴──────────────────────────┘

ADMIN — MISSION CONTROL
┌──────────────────────────────────────────────────────────┐
│ ◀ nav │ REGISTRATIONS 61  LIVE 47  SUBMITTED 12  ⚠ 3    │
│       ├──────────────────────────────────────────────────┤
│       │ [chart: submissions over time] [chart: by track] │
│       ├──────────────────────────────────────────────────┤
│       │ VERIFICATION QUEUE          [ EMERGENCY BROADCAST]│
│       │ ┌──────────────────────────────────────────────┐ │
│       │ │ TEAM        MISSION   AGE     ACTION         │ │
│       │ │ Nightfall   M-03      2m      [✓] [✗] [view] │ │
│       │ └──────────────────────────────────────────────┘ │
└───────┴──────────────────────────────────────────────────┘
```

**Motion budget:** page transitions 200–300 ms; mission unlock is the one "hero" moment (~800 ms); score counts animate on change only. Everything transform/opacity-only for 60 fps. All of it behind `prefers-reduced-motion`.

**Accessibility (WCAG 2.1 AA, non-negotiable):** every colour pair ≥ 4.5:1 — the mission-control palette makes low-contrast neon-on-black tempting and it must be resisted; full keyboard paths including the QR desk; visible focus rings; `aria-live` for leaderboard and notification updates; 44 px touch targets; the 3D hero is decorative and carries no information not available as text.

---

## 12. Admin architecture

```
/admin                Ops dashboard — live counters, funnel, alert strip
  /registrations      Approve · reject · bulk actions · waitlist
  /participants       Search · filter · role assignment · disqualify
  /teams              Roster · merge · dissolve · assign
  /missions           Mission Builder: category, deps, points, windows, rubric
  /scores             Score Manager: award/revoke with mandatory reason
  /announcements      Compose · pin · schedule · audience targeting
  /broadcast          Emergency broadcast → push + realtime + banner
  /certificates       Generate · preview · bulk issue · revoke
  /exports            CSV: registrations, scores, attendance, submissions
  /logs               Audit trail, filterable by actor/entity/action
  /settings           Capability flags, windows, rubric, theme
```

Built on a **generic `<DataTable>`** driven by column configs, so a new admin screen is a config object rather than a new table component.

**Two hard rules.** Every destructive action requires typed confirmation and writes `ev_audit_logs` in the same transaction as the change. Every score adjustment requires a reason string — an unexplained score change in a competition is indistinguishable from cheating, and the ledger is what makes a disputed result defensible.

`super_admin` alone can change settings, assign admins, and revoke certificates. `admin` runs the event.

---

## 13. Dashboard architecture

One shell, role-selected panels — not four separate dashboards to maintain.

```
<DashboardShell>
  panels = PANELS[role].filter(p => can(event, p.capability))
```

| Role | Panels |
|---|---|
| Participant | missions, score, team, notifications, badges, inventory, downloads, rules, certificates, profile |
| Team leader | + roster management, invite codes, role assignment |
| Volunteer | check-ins, attendance, verification queue, QR scanner, help desk, issues |
| Judge | assigned submissions, scoring sheet, approvals, feedback |
| Admin | everything + analytics + controls |

Because panels are capability-filtered, an event with `missions_enabled = false` simply has no mission panel — no conditional spaghetti in the components.

Data loads in parallel in the RSC layer; each panel is a `<Suspense>` boundary with a skeleton, so a slow leaderboard never blocks the mission grid.

---

## 14. Security architecture

Defence in depth. **RLS is the boundary** — the application is a convenience layer on top of it, never the thing that keeps data safe.

**Layer 1 — Postgres RLS.** Every `ev_*` table has RLS enabled with deny-by-default. Helper functions, `STABLE` and `SECURITY DEFINER`:

```sql
ev_current_participant(event_id) → uuid     -- from the verified session claim
ev_is_event_staff(event_id)      → boolean  -- volunteer | judge | admin | super_admin
ev_is_event_admin(event_id)      → boolean
ev_my_team(event_id)             → uuid
```

Policy shape, applied consistently:

```sql
-- read your own, your team's, or anything if staff
using (participant_id = ev_current_participant(event_id)
       or team_id = ev_my_team(event_id)
       or ev_is_event_staff(event_id))

-- write only your own, and only while the event allows it
with check (participant_id = ev_current_participant(event_id)
            and ev_event_writable(event_id))
```

Public-read is granted **per table and per column**, never blanket. Notably `ev_submissions` and `ev_points_history` are *not* world-readable — the existing hackathon module makes `hack_scores` public, which leaks judges' marks before publication.

**Layer 2 — Server actions.** The five-step contract in §8. Zod on every input. IDs always from the session, never the body.

**Layer 3 — Sessions.** HMAC-signed, expiring, server-revocable (§4).

**Layer 4 — Rate limiting.** Login attempts (DB-backed, per credential), registration (per IP + per profile), submissions (per mission `max_attempts`), QR tokens (single-use, time-boxed).

**Layer 5 — Secrets.** `EVENT_SESSION_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` are server-only; `createAdminClient()` throws when absent rather than silently producing a client that 401s on every write. Service-role usage is confined to `lib/events/actions/` and is always preceded by an authorisation check.

**Layer 6 — Audit.** Every privileged mutation writes `ev_audit_logs` transactionally.

**Threat model — what this actually stops**

| Attack | Control |
|---|---|
| Forge a session for another team/participant | HMAC-signed cookie + `ev_sessions` revocation |
| Submit on behalf of another team | Subject from session, never from body |
| Read another team's submission | RLS predicate; submissions not public-read |
| Brute-force issued passwords | DB-backed attempt throttle + lockout |
| Award yourself points | `awardPoints` requires judge/admin; ledger is append-only + audited |
| Start a locked mission via direct API | Dependency resolution in Postgres, not the client |
| Replay a photographed QR badge | Single-use, expiring tokens |
| Call an "internal" server action directly | Every export authorises independently |
| Scrape participant PII | No blanket public-read; PII columns staff-only |

---

## 15. Future scalability plan

**Near term (next event).** A second event is data, not code (§10). Infinium migrates onto the engine when convenient; `/hackathon/*` becomes redirects.

**Data growth.** `ev_points_history` and `ev_audit_logs` are the append-only tables that grow without bound — partition by `event_id` when a single event exceeds ~10⁶ rows. Archive completed events to cold storage with `ev_events.status = 'archived'` gating them out of hot queries. The leaderboard materialised view is refreshed on award; if refresh cost becomes visible, move to incremental refresh keyed by `event_id`.

**Read load.** The landing page and leaderboard are the traffic spikes, and both are cacheable — ISR for landing, a 5-second-stale realtime view for the board. Realtime subscriptions are per-event channels, so one busy event does not fan out to another's viewers.

**Feature growth.** Already schema-ready, no migration needed: team chat (`ev_messages` slots into the same RLS shape), sponsor portals, multi-track events, cross-event participant profiles and lifetime points, public event API, mission templates and an event marketplace.

**Operational.** Feature flags are rows in `ev_event_settings`, so capabilities can be turned off mid-event without a deploy — which is the single most valuable property to have during a live event when something misbehaves.

**Known trade-offs, recorded deliberately:**

- *Table prefix instead of a Postgres schema* — simpler client config, slightly weaker namespacing. Revisit if a third domain appears.
- *Denormalised `points` caches* — trigger-maintained, so a trigger bug can drift them from the ledger. Mitigated by a reconciliation query in `/admin/logs`; the ledger always wins.
- *Materialised leaderboard* — a few seconds stale by design. Fine for a leaderboard, would not be for scoring.
- *Custom session cookies rather than Supabase Auth for Path C* — necessary, because students without accounts must still participate. The cost is that we own the signing, expiry, and revocation logic, so it is centralised in one reviewed file rather than reimplemented per module.

---

## Implementation sequence

| # | Milestone | Gate |
|---|---|---|
| 0 | ✅ Fix existing Infinium security defects | build green, forged sessions rejected |
| 1 | `0013` schema + `0014` RLS + generated types | policies pass a negative-access test |
| 2 | Engine core: `engine`, `session`, `auth`, `rules`, `queries` | unit tests on `rules`/`scoring` |
| 3 | Public shell: hub, landing, about, schedule | Lighthouse ≥ 95, AA contrast |
| 4 | Registration + teams + login (3 paths) | end-to-end registration works |
| 5 | Participant dashboard + mission engine | locked mission unreachable via API |
| 6 | Leaderboard + realtime + points ledger | ledger reconciles with caches |
| 7 | Admin panel | every action audited |
| 8 | Volunteer + judge panels | QR replay rejected |
| 9 | Certificates, exports, AI assistant, polish | AA audit, 60 fps profile |
| 10 | `0015` CODE RED seed | delete the row → platform still builds |
