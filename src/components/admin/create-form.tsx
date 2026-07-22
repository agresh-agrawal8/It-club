"use client";

import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "./image-upload-field";
import { cn } from "@/lib/utils";

export interface AdminField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "url" | "date" | "datetime-local" | "select" | "image";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Grid span — "full" stretches across both columns. */
  span?: "half" | "full";
  /** For type "image": storage bucket + folder to upload into. */
  bucket?: string;
  folder?: string;
}

type ActionResult = { error?: string; success?: boolean } | void;

/**
 * Generic Core Team Panel create form. Renders a two-column glass form from
 * a field config and submits to the given server action with inline
 * success/error feedback. Resets on success.
 */
export function AdminCreateForm({
  action,
  fields,
  submitLabel = "Create",
  successMessage = "Saved.",
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  fields: AdminField[];
  submitLabel?: string;
  successMessage?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ error?: string; ok?: boolean } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const res = await action(formData);
      if (res && "error" in res && res.error) {
        setResult({ error: res.error });
      } else {
        setResult({ ok: true });
        formRef.current?.reset();
      }
    });
  }

  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) =>
          f.type === "image" ? (
            <ImageUploadField
              key={f.name}
              name={f.name}
              label={f.label}
              required={f.required}
              bucket={f.bucket}
              folder={f.folder}
            />
          ) : (
          <label
            key={f.name}
            className={cn("flex flex-col gap-1.5", f.span === "full" && "sm:col-span-2")}
          >
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {f.label}
              {f.required && <span className="ml-1 text-brand-300">*</span>}
            </span>
            {f.type === "textarea" ? (
              <textarea
                name={f.name}
                rows={3}
                required={f.required}
                placeholder={f.placeholder}
                className={cn(inputClasses, "resize-none")}
              />
            ) : f.type === "select" ? (
              <select name={f.name} required={f.required} className={inputClasses}>
                {(f.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name={f.name}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                className={cn(
                  inputClasses,
                  (f.type === "date" || f.type === "datetime-local") && "[color-scheme:dark]",
                )}
              />
            )}
          </label>
          ),
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" size="sm" disabled={pending}>
          <Plus className="h-4 w-4" />
          {pending ? "Saving…" : submitLabel}
        </Button>
        {result?.error && <p className="text-sm text-red-400">{result.error}</p>}
        {result?.ok && <p className="text-sm text-emerald-400">{successMessage}</p>}
      </div>
    </form>
  );
}
