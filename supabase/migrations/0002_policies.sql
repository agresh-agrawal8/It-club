-- ============================================================================
-- Row Level Security policies
-- Model:
--   • visitor (anon)  → read published/public content only
--   • member          → read all public content; write own projects/profile;
--                        read own tasks/notifications
--   • admin           → full control
-- ============================================================================

alter table public.profiles                 enable row level security;
alter table public.projects                  enable row level security;
alter table public.project_authors           enable row level security;
alter table public.project_media             enable row level security;
alter table public.events                     enable row level security;
alter table public.event_media               enable row level security;
alter table public.competitions               enable row level security;
alter table public.competition_participants   enable row level security;
alter table public.gallery_items              enable row level security;
alter table public.achievements               enable row level security;
alter table public.tasks                      enable row level security;
alter table public.task_attachments           enable row level security;
alter table public.notifications              enable row level security;
alter table public.subscribers                enable row level security;
alter table public.contact_messages           enable row level security;
alter table public.settings                    enable row level security;
alter table public.page_views                  enable row level security;

-- ── profiles ────────────────────────────────────────────────
create policy "profiles readable by everyone"
  on public.profiles for select using (true);

create policy "users update own profile"
  on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "admins manage profiles"
  on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- ── projects ────────────────────────────────────────────────
-- Public can read anything not in draft; owners/admins read all of theirs.
create policy "projects public read"
  on public.projects for select
  using (status <> 'draft' or owner_id = auth.uid() or public.is_admin());

create policy "members insert own projects"
  on public.projects for insert
  with check (owner_id = auth.uid() and public.auth_role() in ('member','admin'));

create policy "owners update own projects"
  on public.projects for update
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

create policy "owners delete own projects"
  on public.projects for delete
  using (owner_id = auth.uid() or public.is_admin());

-- ── project_authors / project_media (gated by parent project ownership) ──
create policy "project_authors read"
  on public.project_authors for select using (true);

create policy "project_authors manage by owner"
  on public.project_authors for all
  using (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

create policy "project_media read"
  on public.project_media for select using (true);

create policy "project_media manage by owner"
  on public.project_media for all
  using (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = project_id and p.owner_id = auth.uid()
    )
  );

-- ── events / event_media (public read, admin write) ─────────
create policy "events public read"      on public.events for select using (true);
create policy "events admin write"      on public.events for all using (public.is_admin()) with check (public.is_admin());
create policy "event_media public read" on public.event_media for select using (true);
create policy "event_media admin write" on public.event_media for all using (public.is_admin()) with check (public.is_admin());

-- ── competitions (public read, admin write) ─────────────────
create policy "competitions public read"  on public.competitions for select using (true);
create policy "competitions admin write"  on public.competitions for all using (public.is_admin()) with check (public.is_admin());
create policy "comp_participants read"     on public.competition_participants for select using (true);
create policy "comp_participants admin"    on public.competition_participants for all using (public.is_admin()) with check (public.is_admin());

-- ── gallery (public read, admin-only write) ─────────────────
create policy "gallery public read"  on public.gallery_items for select using (true);
create policy "gallery admin write"  on public.gallery_items for all using (public.is_admin()) with check (public.is_admin());

-- ── achievements (public read, admin write) ─────────────────
create policy "achievements public read" on public.achievements for select using (true);
create policy "achievements admin write" on public.achievements for all using (public.is_admin()) with check (public.is_admin());

-- ── tasks (assignee reads own; admin full) ──────────────────
create policy "tasks read by assignee or admin"
  on public.tasks for select
  using (assignee_id = auth.uid() or public.is_admin());

create policy "tasks update progress by assignee"
  on public.tasks for update
  using (assignee_id = auth.uid() or public.is_admin())
  with check (assignee_id = auth.uid() or public.is_admin());

create policy "tasks admin write"
  on public.tasks for all
  using (public.is_admin()) with check (public.is_admin());

create policy "task_attachments read"
  on public.task_attachments for select
  using (
    public.is_admin() or exists (
      select 1 from public.tasks t
      where t.id = task_id and t.assignee_id = auth.uid()
    )
  );
create policy "task_attachments admin write"
  on public.task_attachments for all using (public.is_admin()) with check (public.is_admin());

-- ── notifications (recipient reads own; admin can create) ───
create policy "notifications read own"
  on public.notifications for select
  using (recipient_id = auth.uid() or public.is_admin());

create policy "notifications update own"
  on public.notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "notifications admin write"
  on public.notifications for all
  using (public.is_admin()) with check (public.is_admin());

-- ── subscribers (anyone may subscribe; admin reads) ─────────
create policy "subscribers insert anyone"
  on public.subscribers for insert with check (true);
create policy "subscribers admin read"
  on public.subscribers for select using (public.is_admin());
create policy "subscribers admin write"
  on public.subscribers for all using (public.is_admin()) with check (public.is_admin());

-- ── contact messages (anyone submits; admin reads) ──────────
create policy "contact insert anyone"
  on public.contact_messages for insert with check (true);
create policy "contact admin read"
  on public.contact_messages for select using (public.is_admin());
create policy "contact admin write"
  on public.contact_messages for all using (public.is_admin()) with check (public.is_admin());

-- ── settings (public read, admin write) ─────────────────────
create policy "settings public read" on public.settings for select using (true);
create policy "settings admin write" on public.settings for all using (public.is_admin()) with check (public.is_admin());

-- ── page_views (anyone inserts a view; admin reads) ─────────
create policy "page_views insert anyone" on public.page_views for insert with check (true);
create policy "page_views admin read"    on public.page_views for select using (public.is_admin());
