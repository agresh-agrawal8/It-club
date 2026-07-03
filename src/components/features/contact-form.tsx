"use client";

import { useActionState } from "react";
import { contactAction } from "@/lib/actions/public";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(contactAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Input name="name" label="Name" placeholder="Your full name" required />
        <Input name="email" type="email" label="Email" placeholder="you@school.edu" required />
      </div>
      <Input name="subject" label="Subject" placeholder="What's this about?" />
      <Textarea name="message" label="Message" placeholder="Tell us more…" rows={5} required />
      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && <p className="text-sm text-emerald-400">{state.success}</p>}
      <Button type="submit" size="lg" disabled={pending} className="w-fit">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
