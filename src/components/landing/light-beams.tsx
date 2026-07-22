/**
 * Cinematic diagonal light beams — the signature backdrop of the landing
 * hero. Pure CSS (no images), rendered in the brand violet.
 */
export function LightBeams({ className = "" }: { className?: string }) {
  return (
    <div className={`beam-mask pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Left rake */}
      <div
        className="beam"
        style={{ top: "-30%", left: "6%", width: "170px", height: "150%", transform: "rotate(22deg)" }}
      />
      <div
        className="beam beam-soft"
        style={{ top: "-30%", left: "14%", width: "260px", height: "140%", transform: "rotate(18deg)" }}
      />
      {/* Right rake */}
      <div
        className="beam"
        style={{ top: "-32%", right: "8%", width: "150px", height: "150%", transform: "rotate(-20deg)" }}
      />
      <div
        className="beam beam-soft"
        style={{ top: "-30%", right: "18%", width: "300px", height: "140%", transform: "rotate(-16deg)" }}
      />
      {/* Centre bloom */}
      <div
        className="absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--color-brand-500) 26%, transparent), transparent)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}
