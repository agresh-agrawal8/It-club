import { Code2, Cpu, Rocket, Sparkles, Terminal, Trophy } from "lucide-react";

/**
 * Abstract hero artwork — pure CSS/SVG in the Agresh palette (no external
 * images). A glowing violet composition with floating glass chips, echoing
 * the floating-card style of the reference layouts.
 */
export function HeroVisual() {
  return (
    <div className="relative h-full min-h-[360px] w-full select-none overflow-hidden md:min-h-[460px]">
      {/* Ambient gradient orbs */}
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/40 blur-[110px]" />
      <div className="absolute right-[-60px] top-[-40px] h-56 w-56 rounded-full bg-brand-400/25 blur-[90px]" />
      <div className="absolute bottom-[-70px] left-[-40px] h-64 w-64 rounded-full bg-fuchsia-500/15 blur-[100px]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at center, black 35%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        }}
      />

      {/* Concentric rings */}
      <svg
        viewBox="0 0 400 400"
        className="absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 md:h-[460px] md:w-[460px]"
        aria-hidden
      >
        <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(196,181,253,0.25)" strokeWidth="1" />
        <circle cx="200" cy="200" r="165" fill="none" stroke="rgba(196,181,253,0.15)" strokeWidth="1" strokeDasharray="3 6" />
        <circle cx="200" cy="200" r="60" fill="none" stroke="rgba(196,181,253,0.35)" strokeWidth="1" />
      </svg>

      {/* Core emblem */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/15 bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_0_80px_-10px_rgba(139,92,246,0.9)] md:h-28 md:w-28">
          <Terminal className="h-10 w-10 text-white md:h-12 md:w-12" />
        </div>
      </div>

      {/* Floating glass chips */}
      <div className="glass animate-fade-up absolute left-[6%] top-[14%] flex items-center gap-2.5 rounded-2xl px-4 py-3 [animation-delay:200ms]">
        <Code2 className="h-4 w-4 text-brand-300" />
        <div>
          <div className="text-xs font-semibold text-white">Web & Apps</div>
          <div className="text-[10px] text-zinc-400">Built by students</div>
        </div>
      </div>

      <div className="glass animate-fade-up absolute right-[4%] top-[30%] flex items-center gap-2.5 rounded-2xl px-4 py-3 [animation-delay:400ms]">
        <Cpu className="h-4 w-4 text-brand-300" />
        <div>
          <div className="text-xs font-semibold text-white">AI & Robotics</div>
          <div className="text-[10px] text-zinc-400">Hands-on labs</div>
        </div>
      </div>

      <div className="glass animate-fade-up absolute bottom-[22%] left-[8%] flex items-center gap-2.5 rounded-2xl px-4 py-3 [animation-delay:600ms]">
        <Trophy className="h-4 w-4 text-amber-300" />
        <div>
          <div className="text-xs font-semibold text-white">Competitions</div>
          <div className="text-[10px] text-zinc-400">Hackathons & olympiads</div>
        </div>
      </div>

      <div className="glass animate-fade-up absolute bottom-[8%] right-[10%] flex items-center gap-2.5 rounded-2xl px-4 py-3 [animation-delay:800ms]">
        <Rocket className="h-4 w-4 text-brand-300" />
        <div>
          <div className="text-xs font-semibold text-white">Ship real projects</div>
          <div className="text-[10px] text-zinc-400">No approval needed</div>
        </div>
      </div>

      {/* Sparkle accents */}
      <Sparkles className="absolute left-[30%] top-[8%] h-4 w-4 text-brand-300/60" />
      <Sparkles className="absolute bottom-[12%] left-[42%] h-3 w-3 text-brand-300/40" />
    </div>
  );
}
