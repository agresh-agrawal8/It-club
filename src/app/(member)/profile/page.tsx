import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/utils";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const { profile } = await requireUser();

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-300">Account</p>
        <h1 className="headline text-[clamp(1.7rem,1.2rem+1.8vw,2.5rem)] text-white">
          My profile
        </h1>
        <p className="text-sm text-ink-3">How you appear on the public team page.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="surface flex h-fit flex-col items-center gap-4 rounded-3xl p-7 text-center">
          <Avatar name={profile.full_name || "Member"} src={profile.avatar_url} size="xl" />

          <div className="flex flex-col items-center gap-2">
            <h2 className="text-base font-semibold text-white">
              {profile.full_name || "Member"}
            </h2>
            <Badge variant="accent">{roleLabel(profile.role)}</Badge>
          </div>

          {profile.headline && <p className="text-sm text-ink-3">{profile.headline}</p>}

          {/*
            Your name is your sign-in identifier, so it is not editable here —
            changing it would move the credential the login form derives while
            leaving the stored one behind. Ask the core team if it is wrong.
          */}
          <p className="mt-2 border-t border-white/10 pt-4 text-xs leading-relaxed text-ink-4">
            Your name is how you sign in, so it can only be changed by the core team.
          </p>

          <Link
            href="/account/password"
            className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-xs font-medium text-white transition-colors hover:bg-white/5"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden />
            Change password
          </Link>
        </aside>

        <div className="surface rounded-3xl p-6 md:p-8">
          <ProfileForm profile={profile} />
        </div>
      </div>
    </div>
  );
}
