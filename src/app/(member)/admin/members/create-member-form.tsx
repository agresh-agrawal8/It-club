"use client";

import { useRef, useState } from "react";
import { UserPlus } from "lucide-react";
import { createMemberAction } from "@/lib/actions/admin";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function CreateMemberForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<{ error?: string; success?: boolean }>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const res = await createMemberAction(formData);
    setState(res);
    setPending(false);
    if (res?.success) formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="fullName" label="Full name" placeholder="Student name" required />
        <Input name="memberId" label="Member ID" placeholder="AVN-0004" required />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          name="password"
          label="Temporary password"
          placeholder="min 6 characters"
          minLength={6}
          required
        />
        <Select name="role" label="Role" defaultValue="member">
          <option value="member">Member</option>
          <option value="admin">Admin / Core team</option>
        </Select>
      </div>

      {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state?.success && (
        <p className="text-sm text-emerald-400">
          Member account created. Share the Member ID and password securely.
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-fit">
        <UserPlus className="h-4 w-4" />
        {pending ? "Creating…" : "Create member"}
      </Button>
    </form>
  );
}
