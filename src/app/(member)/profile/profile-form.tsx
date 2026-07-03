"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/member";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Input name="full_name" label="Full name" defaultValue={profile.full_name} required />
        <Input name="grade" label="Grade / Class" defaultValue={profile.grade ?? ""} placeholder="e.g. Grade 11" />
      </div>
      <Input name="headline" label="Headline" defaultValue={profile.headline ?? ""} placeholder="e.g. Full-stack developer" />
      <Textarea name="bio" label="Bio" defaultValue={profile.bio ?? ""} rows={4} placeholder="Tell us about yourself…" />
      <Input
        name="skills"
        label="Skills (comma separated)"
        defaultValue={profile.skills.join(", ")}
        placeholder="React, Python, Figma"
      />
      <div className="grid gap-6 sm:grid-cols-2">
        <Input name="github_url" label="GitHub URL" defaultValue={profile.github_url ?? ""} placeholder="https://github.com/…" />
        <Input name="linkedin_url" label="LinkedIn URL" defaultValue={profile.linkedin_url ?? ""} placeholder="https://linkedin.com/in/…" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <Input name="website_url" label="Website" defaultValue={profile.website_url ?? ""} placeholder="https://…" />
        <Input name="phone" label="Phone" defaultValue={profile.phone ?? ""} placeholder="+91…" />
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">{state.success}</p>}

      <Button type="submit" size="lg" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
