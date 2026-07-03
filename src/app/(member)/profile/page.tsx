import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "./profile-form";
import type { Profile } from "@/types/database";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const { profile } = await requireUser();
  const p = (profile ?? {}) as Profile;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-white md:text-4xl">My Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">Update how you appear on the team page and projects.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <Card glass className="flex h-fit flex-col items-center gap-4 text-center">
          <Avatar name={p.full_name || "Member"} src={p.avatar_url} size="xl" />
          <div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-lg font-semibold text-white">{p.full_name || "Member"}</h2>
              {p.role === "admin" && <Badge variant="accent">Core</Badge>}
            </div>
            {p.member_id && <p className="text-xs text-zinc-500">{p.member_id}</p>}
          </div>
          {p.headline && <p className="text-sm text-zinc-400">{p.headline}</p>}
          <div className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${p.phone_verified ? "bg-emerald-400" : "bg-zinc-600"}`} />
            <span className="text-zinc-500">
              {p.phone_verified ? "Phone verified" : "Phone not verified"}
            </span>
          </div>
        </Card>

        <Card>
          <ProfileForm profile={p} />
        </Card>
      </div>
    </div>
  );
}
