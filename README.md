# Emerald Heights IT Club — Management & Showcase Platform

A production-ready platform for the **Emerald Heights International School IT Club**: a public
showcase (projects, events, competitions, team, gallery, achievements) plus a members' area
(dashboard, projects, tasks, notifications, calendar) and an admin console.

Built with **Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase**, and
styled entirely with the **Agresh Agrawal Design System** (luxury dark theme, violet accents,
glassmorphism).

---

## Tech stack

| Layer      | Choice                                                             |
| ---------- | ----------------------------------------------------------------- |
| Framework  | Next.js 15 App Router (Server Components, Server Actions, Route Handlers) |
| Language   | TypeScript (strict)                                               |
| Styling    | Tailwind CSS v4 (`@theme` tokens) + Agresh design system          |
| Backend    | Supabase — Auth, Postgres, Row Level Security, Storage            |
| Icons      | lucide-react                                                       |
| Validation | Zod                                                               |

---

## Project structure

```
src/
  app/
    (public)/            # Public site (Navbar + Footer layout)
      page.tsx           #   Home
      projects/          #   Projects list + [slug] detail
      events/            #   Events list + [slug] detail
      competitions/ team/ gallery/ achievements/ contact/ search/
    (member)/            # Auth-gated area (sidebar layout)
      dashboard/ profile/ my-projects/ my-tasks/ notifications/ calendar/
      admin/             #   Admin console + members management
    login/               # Member login
    auth/signout/        # Sign-out route handler
    api/search/          # Global search endpoint
  components/
    ui/                  # Design-system primitives (Button, Card, Badge, …)
    features/            # Domain components (ProjectCard, EventCard, forms, …)
    layout/              # Navbar, Footer, MemberSidebar, PageHeader
  lib/
    supabase/            # Browser / server / admin clients + middleware
    actions/             # Server Actions (auth, admin, projects, member, public)
    data.ts              # Typed server-side data access (RLS-aware)
    auth.ts utils.ts member-id.ts
  types/database.ts      # DB types (mirror of the SQL schema)
  middleware.ts          # Session refresh + route protection
supabase/
  migrations/            # 0001_init · 0002_policies · 0003_storage
  seed.sql               # Homepage/settings seed
```

---

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` → `.env.local` and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page (anon / publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | same page — **server-only**, used to create member accounts |
| `NEXT_PUBLIC_SITE_URL` | e.g. `http://localhost:3000` |

### 3. Apply the database schema

Using the **Supabase CLI** (recommended):

```bash
supabase link --project-ref YOUR-PROJECT-REF
supabase db push          # applies supabase/migrations/*
psql "$DATABASE_URL" -f supabase/seed.sql   # optional seed
```

…or paste the contents of `supabase/migrations/0001_init.sql`, `0002_policies.sql`,
`0003_storage.sql` (in order) into the Supabase **SQL Editor**, then `seed.sql`.

### 4. Run

```bash
npm run dev      # http://localhost:3000
```

The app is **resilient without a database** — every page renders its empty state until Supabase is
connected, so you can develop the UI first.

---

## Creating the first admin

Member accounts are created only by the core team, so bootstrap the first admin manually:

1. In Supabase → **Authentication → Users → Add user**, create a user with:
   - Email: `<memberid>@members.emeraldheights.local` (e.g. `ehisit0001@members.emeraldheights.local`)
   - A password, and **Auto Confirm** enabled.
2. In **SQL Editor**, promote them and set a Member ID:
   ```sql
   update public.profiles
   set role = 'admin', member_id = 'EHIS-IT-0001', full_name = 'Core Admin'
   where id = (select id from auth.users
               where email = 'ehisit0001@members.emeraldheights.local');
   ```
3. Sign in at `/login` with Member ID `EHIS-IT-0001` and the password.

Thereafter, admins create all other members from **Admin → Members** (no SQL needed). Members log
in with the **Member ID + password** — the app maps the Member ID to the synthetic auth email
internally (`src/lib/member-id.ts`).

---

## Roles & access (enforced by RLS)

- **Visitor** — reads all public content; can subscribe & contact. No login.
- **Member** — manages own profile & projects (no approval needed), sees own tasks/notifications.
- **Admin / Core team** — full control of members, events, competitions, gallery, achievements,
  tasks, notifications and settings.

Security is enforced in Postgres (`0002_policies.sql`), so the client can only ever read/write what
the signed-in role is allowed to — the UI mirrors those rules.

---

## Storage buckets

`avatars`, `projects`, `events`, `gallery`, `tasks` — all public-read, write-gated by role
(`0003_storage.sql`). Members upload to their own avatar folder and to project media; the
`events` / `gallery` / `tasks` buckets are admin-only.

---

## Notifications

Website notifications are stored in `public.notifications`. Email and WhatsApp fan-out is designed
to be handled by a Supabase Edge Function that reads new rows and calls the providers configured via
`RESEND_API_KEY` / `WHATSAPP_*` env vars. Members must verify their phone (`profiles.phone_verified`)
before receiving WhatsApp updates.

---

## Deploy to Vercel

1. Push the repo to GitHub and import it into Vercel.
2. Add the same environment variables (`.env.example`) in the Vercel project settings.
3. Deploy. `next.config.ts` already allows Supabase Storage image domains.

---

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # run production build
npm run typecheck  # tsc --noEmit
```

---

## Design system

All UI decisions follow the **Agresh Agrawal Design System** (in `/agresh-design-system`). Its
tokens are ported into `src/app/globals.css` (`@theme`) and its components into `src/components/ui`.
Do not introduce a competing design language — extend these primitives instead.
