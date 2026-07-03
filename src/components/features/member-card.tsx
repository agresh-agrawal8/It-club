import { Github, Linkedin, Globe } from "lucide-react";
import type { Profile } from "@/types/database";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/components/ui/tag";

export function MemberCard({ member }: { member: Profile }) {
  return (
    <Card hoverLift className="flex flex-col items-center gap-4 text-center" glass>
      <Avatar name={member.full_name || "Member"} src={member.avatar_url} size="xl" />
      <div>
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-lg font-semibold tracking-tight text-white">
            {member.full_name || "Member"}
          </h3>
          {member.role === "admin" && <Badge variant="accent">Core</Badge>}
        </div>
        {member.headline && <p className="mt-1 text-sm text-zinc-400">{member.headline}</p>}
        {member.grade && <p className="mt-0.5 text-xs text-zinc-500">{member.grade}</p>}
      </div>
      {member.skills.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5">
          {member.skills.slice(0, 4).map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 text-zinc-500">
        {member.github_url && (
          <a href={member.github_url} target="_blank" rel="noreferrer" className="hover:text-white">
            <Github className="h-4 w-4" />
          </a>
        )}
        {member.linkedin_url && (
          <a href={member.linkedin_url} target="_blank" rel="noreferrer" className="hover:text-white">
            <Linkedin className="h-4 w-4" />
          </a>
        )}
        {member.website_url && (
          <a href={member.website_url} target="_blank" rel="noreferrer" className="hover:text-white">
            <Globe className="h-4 w-4" />
          </a>
        )}
      </div>
    </Card>
  );
}
