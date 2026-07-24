import type { Metadata } from "next";
import { ShieldQuestion, Lock, Zap, Star } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/hackathon/countdown";
import { getHackEvent, getProblems } from "@/lib/hackathon/data";

export const metadata: Metadata = { title: "Operation Blackout" };

export default async function BlackoutPage() {
  const [event, problems] = await Promise.all([getHackEvent(), getProblems()]);
  const blackout = problems.find((p: any) => p.code === "INF-06");
  const revealAt = blackout?.release_at || event.blackout_at || "2026-08-29T23:00:00+05:30";
  const revealed = blackout?.released;

  return (
    <div className="relative">
      {/* Dark, tense atmosphere */}
      <div className="glow-accent pointer-events-none absolute inset-0 opacity-40" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, white 0 1px, transparent 1px 3px)",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 20%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 20%, black, transparent)",
        }}
      />

      <Container className="relative flex flex-col items-center gap-8 py-20 text-center md:py-28">
        <Badge variant="danger" className="animate-fade-in">
          <ShieldQuestion className="mr-1.5 h-3 w-3" /> Classified operation
        </Badge>

        <h1 className="animate-fade-up text-5xl font-semibold tracking-tighter text-white md:text-7xl">
          Operation <span className="text-duo">Blackout</span>
        </h1>

        <p className="max-w-xl animate-fade-up text-balance text-zinc-400">
          At the darkest hour of night one, the vault opens. A surprise challenge drops with bonus
          passport points on the line. Stay awake. Stay ready.
        </p>

        {revealed ? (
          <Card deep className="mt-4 flex max-w-lg flex-col items-center gap-4 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/15 text-accent-400">
              <Zap className="h-7 w-7" />
            </span>
            <Badge variant="success">Unlocked</Badge>
            <h2 className="text-2xl font-semibold tracking-tight text-white">{blackout?.title}</h2>
            <p className="text-sm leading-relaxed text-zinc-300">{blackout?.description}</p>
          </Card>
        ) : (
          <Card deep className="mt-4 flex max-w-lg flex-col items-center gap-6 p-8">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
              <Lock className="h-7 w-7" />
            </span>
            <Countdown target={revealAt} label="Vault opens in" className="items-center" />
            <p className="text-xs text-zinc-500">
              The challenge and its bonus points reveal automatically when the timer hits zero.
            </p>
          </Card>
        )}

        <div className="mt-6 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
          {[
            { icon: Star, title: "Bonus points", desc: "Straight onto your passport" },
            { icon: Zap, title: "Time-boxed", desc: "A tight window to deliver" },
            { icon: ShieldQuestion, title: "Unknown brief", desc: "Revealed only at zero hour" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass flex flex-col items-center gap-2 rounded-2xl p-5 text-center">
              <Icon className="h-4 w-4 text-brand-300" />
              <span className="text-sm font-semibold text-white">{title}</span>
              <span className="text-xs text-zinc-500">{desc}</span>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
