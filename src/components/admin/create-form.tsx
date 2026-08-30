"use client";

import { useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Field, TextAreaField, SelectField } from "@/components/ui/field";
import { ImageUploadField } from "./image-upload-field";
import { cn } from "@/lib/utils";

export interface AdminField {
  name: string;
  label: string;
  type?: "text" | "textarea" | "url" | "date" | "datetime-local" | "select" | "image";
  placeholder?: string;
  hint?: string;
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
 * The create form behind every Core Team content page.
 *
 * One implementation means events, competitions and achievements cannot drift
 * into three different-looking forms, and every one of them inherits the same
 * labelling, focus and error behaviour from the field primitives.
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

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((f) => {
          const spanClass = f.span === "full" ? "sm:col-span-2" : undefined;

          if (f.type === "image") {
            return (
              <ImageUploadField
                key={f.name}
                name={f.name}
                label={f.label}
                required={f.required}
                bucket={f.bucket}
                folder={f.folder}
              />
            );
          }

          if (f.type === "textarea") {
            return (
              <div key={f.name} className={cn(spanClass)}>
                <TextAreaField
                  name={f.name}
                  label={f.label}
                  hint={f.hint}
                  required={f.required}
                  placeholder={f.placeholder}
                  rows={3}
                />
              </div>
            );
          }

          if (f.type === "select") {
            return (
              <div key={f.name} className={cn(spanClass)}>
                <SelectField
                  name={f.name}
                  label={f.label}
                  hint={f.hint}
                  required={f.required}
                  options={f.options ?? []}
                />
              </div>
            );
          }

          return (
            <div key={f.name} className={cn(spanClass)}>
              <Field
                name={f.name}
                label={f.label}
                hint={f.hint}
                type={f.type ?? "text"}
                required={f.required}
                placeholder={f.placeholder}
                // Without color-scheme the native date picker renders as a
                // white panel in the middle of a dark form.
                className={cn(
                  (f.type === "date" || f.type === "datetime-local") && "[color-scheme:dark]",
                )}
              />
            </div>
          );
        })}
      </div>

      {result?.error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {result.error}
        </p>
      )}
      {result?.ok && (
        <p
          role="status"
          className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-brand-400 to-brand-600 px-6 py-3.5 text-sm font-medium text-white shadow-[0_8px_28px_-10px_var(--color-brand-500)] transition-[transform,box-shadow,opacity] duration-[var(--duration-fast)] hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0"
      >
        <Plus className="h-4 w-4" aria-hidden />
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
