# Avinya

The website and management platform for **Avinya**, the student-run IT & AI Club of
The Emerald Heights International School, Indore.

Public site, a Core Team management panel, and a Member area — one application, one
design language, one database.

---

## Stack

| Layer      | Choice                                                      |
| ---------- | ----------------------------------------------------------- |
| Framework  | Next.js 15 (App Router, React 19, Server Components)         |
| Language   | TypeScript (strict)                                          |
| Styling    | Tailwind CSS v4 with `@theme` design tokens                  |
| Database   | Supabase Postgres, with Row Level Security on every table    |
| Auth       | Supabase Auth (bcrypt password hashing, HTTP-only cookies)   |
| Storage    | Supabase Storage (`gallery`, `media`, `avatars`, `events`, …)|
| Fonts      | Inter (body), Orbitron (display), JetBrains Mono (labels)    |
| Hosting    | Vercel                                                       |

---

## Roles

The club has exactly **two** roles. There is no admin tier above core team.

| Role        | Home         | Can do                                                     |
| ----------- | ------------ | ---------------------------------------------------------- |
| `core_team` | `/admin`     | Manage members, events, competitions, achievements, gallery, submissions, and broadcast notices |
| `member`    | `/dashboard` | See their tasks, the calendar, notices, and edit their own profile |

Authorization is enforced in three places, in this order:

1. **Middleware** — checks a session exists before any protected route renders.
2. **Page guards** — `requireUser()` / `requireCoreTeam()` re-read the role from the
   database on every request. The role is never read from a cookie or a client prop.
3. **Row Level Security** — `is_admin()` in Postgres is the final word. A guard that
   was somehow skipped still cannot read or write rows the account is not entitled to.

---

## Identity and passwords

A member is a **name**, a **password** and a **role**. There is no email address, no
member ID, and no external identifier in the user model.

Supabase Auth requires an `email` column, so each account carries a synthetic internal
address derived from the name (`authEmailForName()` in `src/lib/identity.ts`, mirrored
by `public.auth_email_for_name()` in the database). It is never collected, displayed,
or returned by an API.

**Passwords are stored only as bcrypt hashes.** There is no plaintext column, no
password list, and no interface anywhere that can read an existing password — including
for the core team. Helping someone who has forgotten theirs means issuing a *new*
temporary credential:

- `admin_create_member()` — provisions an account with a generated one-time password,
  returned to the creating admin exactly once, and flags `must_change_password`.
- `admin_reset_member_password()` — issues a new temporary password and re-flags the
  account. The old one is not recoverable, by design.
- A flagged account is redirected to `/account/password` and nothing else in the member
  area opens until the password is replaced.

Changing your own password re-verifies the current one first, so an unattended signed-in
browser cannot be used to take the account over.

---

## Getting started

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<secret key>          # server only, never exposed
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EVENT_SESSION_SECRET=<random string>            # signs event-hub session cookies

# Optional — web push degrades gracefully without these.
# Generate with: npx web-push generate-vapid-keys
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=
# VAPID_PRIVATE_KEY=
# VAPID_SUBJECT=mailto:you@example.com
```

```bash
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

---

## Database

Migrations live in `supabase/migrations/`, applied in filename order.

```
0001–0003   core schema, RLS policies, storage buckets
0010–0022   hackathon and event-hub modules
0023        two-role cleanup, identity simplification, module removal
0024        column privileges on profiles
```

`0023` is the significant one. It removes the projects, applications and messages
modules outright, collapses five roles to two, drops `profiles.member_id`, adds the
derived-SEO columns to `gallery_items`, and replaces the account-provisioning functions.

---

## Gallery

The upload form has two fields: **an image and a title.**

Everything else is derived server-side in `src/lib/actions/gallery.ts`:

- The file's real format is identified from its **bytes** (`src/lib/images.ts`), never
  from the filename or the browser-supplied MIME type.
- Intrinsic width and height are parsed from the image header, so every `<img>` renders
  with `width`/`height` and the grid reserves its space before the bytes arrive.
- The storage filename and URL slug are generated from the title.
- Alt text is taken from the title, used verbatim rather than padded with keywords.
- The public gallery emits `ImageGallery` structured data and responsive `srcset`.

---

## SEO

- Per-page titles, descriptions and canonical URLs; a single `<h1>` per page.
- Open Graph and Twitter cards, with a generated 1200×630 card at `/og-image.png`.
- `Organization` structured data on the homepage, `ImageGallery` on the gallery.
- `/sitemap.xml` (public routes plus every published event) and `/robots.txt`, which
  disallows the signed-in areas.
- Semantic HTML, a skip link, and a focus ring on every interactive element.

---

## Project layout

```
src/
  app/
    (public)/        public site — home, events, gallery, team, contact, …
    (member)/        signed-in shell — /dashboard, /profile, and /admin/* (Core Team)
    (hackathon)/     Infinium hackathon module
    (events)/        event-hub engine; Code Red is served at /codered
    account/         change password
    login/           sign in
  components/
    ui/              design-system primitives (Field, MeshCard, Card, …)
    layout/          navbar, footer, app navigation, logo
    admin/           core-team forms
    features/        gallery grid, member card, search
  lib/
    auth.ts          server-side guards
    identity.ts      name → internal auth address
    images.ts        upload byte-sniffing and dimension parsing
    actions/         server actions
    data.ts          server-side queries
supabase/migrations/ schema history
```
