import { Icon } from "./icons";
import { HackCard } from "./card";
import {
  BRIEF_CONSTRAINTS,
  BRIEF_DELIVERABLES,
  BRIEF_JUDGING_FOCUS,
  type Brief,
} from "@/lib/hackathon/briefs";

/**
 * One problem brief, laid out as the printed page it comes from.
 *
 * The paper brief is the artefact a team works from all day, so the order and
 * grouping here deliberately mirror it — statement, why it matters, the four
 * paired columns, judging focus, bonus challenge — rather than being
 * re-organised for the web. A team looking between screen and paper should not
 * have to translate.
 *
 * Takes the brief as a prop: the page decides whether the team is allowed to
 * see it, so this component never reaches into server-only data itself.
 */

/** The printed constraints use one bold lead-in; honour it without a markdown dep. */
function Bolded({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-white">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Column({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </span>
        <span className="h-px w-full bg-white/[0.09]" />
      </div>
      {children}
    </div>
  );
}

function DashList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-300">
          <span className="text-zinc-600">—</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function BoxList({ items, tone = "brand" }: { items: readonly string[]; tone?: "brand" | "zinc" }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2.5 text-[13px] leading-relaxed text-zinc-300">
          <span
            className={`mt-[3px] h-3.5 w-3.5 shrink-0 rounded-[4px] border ${
              tone === "brand" ? "border-brand-400/50" : "border-white/20"
            }`}
          />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function BriefView({ brief }: { brief: Brief }) {
  return (
    <HackCard bare tone="brand" className="overflow-hidden">
      {/* Printed header rule */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.09] px-6 py-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white">
          INFI<span className="text-brand-400">N</span>IUM
        </span>
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-zinc-500">
          Official problem brief
        </span>
      </div>

      <div className="flex flex-col gap-7 p-6 sm:p-8">
        {/* Title block */}
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-brand-400/25 bg-brand-500/10 text-brand-300">
            <Icon name={brief.icon} className="h-6 w-6" />
          </span>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Envelope {String(brief.no).padStart(2, "0")}
              <span className="mx-2 text-brand-400">•</span>
              {brief.domain}
            </span>
            <h2 className="text-3xl font-semibold tracking-tighter text-white sm:text-4xl">
              {brief.title}
            </h2>
          </div>
        </div>

        {/* Statement */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Problem statement
          </span>
          <p className="text-[14.5px] leading-[1.75] text-zinc-200">{brief.statement}</p>
        </div>

        {/* Why this matters */}
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-brand-300">
            Why this matters
          </span>
          <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-300">{brief.whyThisMatters}</p>
        </div>

        {/* Paired columns */}
        <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
          <Column label="Target users">
            <DashList items={brief.targetUsers} />
          </Column>
          <Column label="Objectives">
            <DashList items={brief.objectives} />
          </Column>
          <Column label="Mandatory features">
            <BoxList items={brief.mandatoryFeatures} />
          </Column>
          <Column label="Bonus features">
            <BoxList items={brief.bonusFeatures} tone="zinc" />
          </Column>
          <Column label="Constraints">
            <ul className="flex flex-col gap-2">
              {BRIEF_CONSTRAINTS.map((t) => (
                <li key={t} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-300">
                  <span className="text-brand-400">·</span>
                  <span>
                    <Bolded text={t} />
                  </span>
                </li>
              ))}
            </ul>
          </Column>
          <Column label="Expected deliverables">
            <BoxList items={BRIEF_DELIVERABLES} />
          </Column>
        </div>

        {/* Judging focus */}
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-500">
            Judging focus
          </span>
          <div className="flex flex-wrap gap-2">
            {BRIEF_JUDGING_FOCUS.map((f) => (
              <span
                key={f}
                className="rounded-full border border-white/12 px-3.5 py-1.5 text-[12px] text-zinc-300"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bonus challenge */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-amber-400/25 sm:flex-row">
          <div className="flex shrink-0 items-center bg-amber-500/15 px-5 py-3 sm:w-36 sm:py-5">
            <span className="text-[10px] font-semibold uppercase leading-tight tracking-[0.14em] text-amber-300">
              Bonus
              <br className="hidden sm:block" /> challenge
            </span>
          </div>
          <p className="flex-1 px-5 py-4 text-[13.5px] leading-relaxed text-zinc-200">
            {brief.bonusChallenge}
          </p>
        </div>
      </div>

      {/* Printed footer rule */}
      <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] px-6 py-3">
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-zinc-600">
          Infinium · Build · Adapt · Innovate
        </span>
        <span className="text-[9.5px] uppercase tracking-[0.2em] text-zinc-600">
          Envelope {String(brief.no).padStart(2, "0")} of 20
        </span>
      </div>
    </HackCard>
  );
}
