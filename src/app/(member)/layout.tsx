import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MemberSidebar } from "@/components/layout/member-sidebar";

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

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <div className="sticky top-0 hidden h-screen border-r border-white/10 bg-zinc-950 lg:block">
        <MemberSidebar
          name={name}
          memberId={profile?.member_id ?? null}
          role={profile?.role ?? "member"}
          avatarUrl={profile?.avatar_url ?? null}
          unread={unread}
        />
      </div>
      <main className="min-w-0 p-6 md:p-10">{children}</main>
    </div>
  );
}
