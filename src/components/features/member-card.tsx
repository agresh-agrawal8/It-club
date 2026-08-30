import { Github, Linkedin, Globe } from "lucide-react";
import type { PublicProfile } from "@/lib/data";
import { isCoreTeam } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";

/**
 * Takes `PublicProfile`, not `Profile`, on purpose: the type itself is what
 * guarantees this card cannot render a private column onto a public page.
 */
export function MemberCard({ member }: { member: PublicProfile }) {
  const links = [
    { href: member.github_url, Icon: Github, label: "GitHub" },
    { href: member.linkedin_url, Icon: Linkedin, label: "LinkedIn" },
    { href: member.website_url, Icon: Globe, label: "Website" },
  ].filter((l) => Boolean(l.href));

  return (
    <article className="glass glass-hover hairline-gradient flex h-full flex-col items-center gap-4 rounded-3xl p-7 text-center">
      <Avatar name={member.full_name || "Member"} src={member.avatar_url} size="xl" />

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <h3 className="text-base font-semibold tracking-tight text-white">
            {member.full_name || "Member"}
          </h3>
          {isCoreTeam(member.role) && <Badge variant="accent">Core</Badge>}
        </div>
        {member.headline && <p className="text-sm text-ink-3">{member.headline}</p>}
        {member.grade && (
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-4">
            {member.grade}
          </p>
        )}
      </div>

      {member.skills.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-1.5">
          {member.skills.slice(0, 4).map((s) => (
            <li key={s}>
              <Tag>{s}</Tag>
            </li>
          ))}
        </ul>
      )}

      {links.length > 0 && (
        <div className="mt-auto flex items-center gap-1 pt-2">
          {links.map(({ href, Icon, label }) => (
            <a
              key={label}
              href={href as string}
              target="_blank"
              // noreferrer as well as noopener: without it the destination
              // gets this page's URL in its referrer log.
              rel="noopener noreferrer"
              aria-label={`${member.full_name} on ${label}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-4 transition-colors hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-4 w-4" aria-hidden />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
