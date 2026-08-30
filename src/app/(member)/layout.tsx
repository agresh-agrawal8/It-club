import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar, AppTopBar, AppTabBar } from "@/components/layout/app-nav";

/**
 * The signed-in shell, shared by the Member area and the Core Team panel.
 *
 * `requireUser()` runs here, so every route beneath this layout is behind a
 * server-side session check before any of its own code runs. Core-team-only
 * pages add `requireCoreTeam()` on top of it; the role is never decided in the
 * browser.
 */
export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser();

  let unread = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false);
    unread = count ?? 0;
  } catch {
    unread = 0;
  }

  const name = profile.full_name || "Member";
  const role = profile.role;
  const avatarUrl = profile.avatar_url;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[276px_1fr]">
      <div className="glass-strong sticky top-0 hidden h-screen border-r border-white/10 lg:block">
        <AppSidebar name={name} role={role} avatarUrl={avatarUrl} unread={unread} />
      </div>

      <AppTopBar name={name} role={role} avatarUrl={avatarUrl} unread={unread} />

      {/* pb-28 clears the fixed bottom tab bar on phones. */}
      <main id="main" className="min-w-0 p-4 pb-28 sm:p-6 md:p-10 lg:pb-10">
        {children}
      </main>

      <AppTabBar role={role} unread={unread} />
    </div>
  );
}
