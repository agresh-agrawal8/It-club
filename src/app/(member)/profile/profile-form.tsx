"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/member";
import { Field, TextAreaField } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Profile } from "@/types/database";

type State = { error?: string; success?: string } | undefined;

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useActionState<State, FormData>(updateProfileAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <Field
        name="headline"
        label="Headline"
        defaultValue={profile.headline ?? ""}
        placeholder="Full-stack developer"
        hint="One line shown under your name on the team page."
        maxLength={120}
      />

      <Field
        name="grade"
        label="Class"
        defaultValue={profile.grade ?? ""}
        placeholder="Grade 11"
      />

      <TextAreaField
        name="bio"
        label="About you"
        defaultValue={profile.bio ?? ""}
        rows={4}
        placeholder="What you work on, what you want to learn…"
      />

      <Field
        name="skills"
        label="Skills"
        defaultValue={profile.skills.join(", ")}
        placeholder="React, Python, Figma"
        hint="Separate with commas."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="github_url"
          type="url"
          label="GitHub"
          defaultValue={profile.github_url ?? ""}
          placeholder="https://github.com/…"
        />
        <Field
          name="linkedin_url"
          type="url"
          label="LinkedIn"
          defaultValue={profile.linkedin_url ?? ""}
          placeholder="https://linkedin.com/in/…"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          name="website_url"
          type="url"
          label="Website"
          defaultValue={profile.website_url ?? ""}
          placeholder="https://…"
        />
        <Field
          name="phone"
          type="tel"
          label="Phone"
          defaultValue={profile.phone ?? ""}
          placeholder="+91…"
          // Accurate as of migration 0024: `anon` has no column privilege on
          // profiles.phone, so it never reaches the public site, but signed-in
          // club members can read it.
          hint="Shared with the club. Never shown on the public site."
        />
      </div>

      {state?.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      {state?.success && (
        <p
          role="status"
          className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {state.success}
        </p>
      )}

      <SubmitButton
        icon={<Save className="h-4 w-4" aria-hidden />}
        pendingLabel="Saving…"
        className="w-fit"
      >
        Save changes
      </SubmitButton>
    </form>
  );
}
