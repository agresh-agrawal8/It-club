import type { Metadata } from "next";
import Link from "next/link";
import { Users, ShieldCheck, KeyRound } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Register your team" };

const MAX_TEAMS = 10;

export default async function RegisterPage() {
  let used = 0;
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from("hack_teams")
      .select("*", { count: "exact", head: true })
      .neq("reg_status", "rejected");
    used = count ?? 0;
  } catch {
    used = 0;
  }
  const full = used >= MAX_TEAMS;

  return (
    <Container className="flex flex-col gap-10 py-14">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="eyebrow text-accent-400">Team registration</span>
        <h1 className="text-4xl font-semibold tracking-tighter text-white md:text-6xl">
          Assemble your team
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-zinc-400">
          Up to 5 members, one per role, plus 2 quiz representatives. Classes VI–XII.
        </p>
        <Badge variant={full ? "danger" : "accent"}>
          {used}/{MAX_TEAMS} teams registered
        </Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
        {/* How it works */}
        <div className="flex flex-col gap-4">
          {[
            {
              icon: Users,
              title: "1 · Register",
              desc: "One member fills in the whole team — names, class/section, roles and the two quiz reps.",
            },
            {
              icon: KeyRound,
              title: "2 · Get your Team ID instantly",
              desc: "Your Team ID (INF-T01) and password appear on screen the moment you submit. Save them — the password is shown only once.",
            },
            {
              icon: ShieldCheck,
              title: "3 · Sign in and build",
              desc: "Use them at Team sign in to reach your dashboard. The core team assigns your problem envelope before orientation.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="flex items-start gap-4 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                <Icon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-400">{desc}</p>
              </div>
            </Card>
          ))}
          <p className="px-1 text-xs text-zinc-500">
            Already registered?{" "}
            <Link href="/hackathon/login" className="text-brand-300 hover:text-brand-200">
              Sign in to your dashboard →
            </Link>
          </p>
        </div>

        {/* Form */}
        <Card deep className="p-6 md:p-8">
          {full ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <h3 className="text-lg font-semibold text-white">Registration is full</h3>
              <p className="max-w-sm text-sm text-zinc-400">
                All {MAX_TEAMS} team slots have been taken. Speak to the core team if you think this
                is a mistake.
              </p>
            </div>
          ) : (
            <RegisterForm />
          )}
        </Card>
      </div>
    </Container>
  );
}
