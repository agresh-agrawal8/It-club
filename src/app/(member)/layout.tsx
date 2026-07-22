import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberSidebar, MemberMobileNav } from "@/components/layout/member-sidebar";
import { MobileTabBar } from "@/components/layout/mobile-tabbar";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser();

  // Unread notification count for the sidebar badge.
  let unread = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false);
    unread = count ?? 0;
  } catch {
    unread = 0;
  }

  const name = profile?.full_name || "Member";
  const role = profile?.role ?? "member";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      {/* Desktop sidebar — frosted glass over the ambient background */}
      <div className="sticky top-0 hidden h-screen border-r border-white/10 glass-strong lg:block">
        <MemberSidebar
          name={name}
          memberId={profile?.member_id ?? null}
          role={role}
          avatarUrl={profile?.avatar_url ?? null}
          unread={unread}
        />
      </div>

      {/* Mobile: brand bar on top, tab bar docked at the bottom */}
      <MemberMobileNav role={role} unread={unread} />

      {/* pb-24 clears the fixed bottom tab bar on phones */}
      <main className="min-w-0 p-4 pb-24 sm:p-6 md:p-10 lg:pb-10">{children}</main>

      <MobileTabBar role={role} unread={unread} />
    </div>
  );
}
