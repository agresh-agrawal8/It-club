"use client";

import { useRef, useState, useTransition } from "react";
import { FileUp, Link2, Send, X, FileCheck2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitDocumentAction } from "@/lib/actions/public";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "competition", label: "Competition entry" },
  { value: "company", label: "Company / internship drive" },
  { value: "content", label: "Club content (article, poster…)" },
  { value: "other", label: "Something else" },
];

const inputClasses =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

/**
 * Public submission form — competition entries, company-drive documents and
 * club content. Files upload straight to the Supabase `submissions` bucket
 * from the browser; the server action records the row.
 */
export function SubmissionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setResult({ error: "File is too large — keep it under 10 MB." });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-80);
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
      const { error } = await supabase.storage.from("submissions").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("submissions").getPublicUrl(path);
      setFileUrl(data.publicUrl);
      setFileName(file.name);
    } catch {
      setResult({ error: "Upload failed — try again or paste a link instead." });
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setFileName(null);
    setFileUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("file_url", fileUrl);
    setResult(null);
    startTransition(async () => {
      const res = await submitDocumentAction(undefined, fd);
      setResult(res ?? {});
      if (res && "success" in res && res.success) {
        formRef.current?.reset();
        clearFile();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Your name <span className="text-brand-300">*</span>
          </span>
          <input name="name" required placeholder="Full name" className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Email <span className="text-brand-300">*</span>
          </span>
          <input name="email" type="email" required placeholder="you@school.edu" className={inputClasses} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            What are you submitting?
          </span>
          <select name="category" className={inputClasses}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Title <span className="text-brand-300">*</span>
          </span>
          <input name="title" required placeholder="e.g. CodeWars 2026 — round 1 solution" className={inputClasses} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</span>
        <textarea
          name="message"
          rows={3}
          placeholder="Anything the core team should know…"
          className={cn(inputClasses, "resize-none")}
        />
      </label>

      {/* Attachment: file upload OR link */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Attach document
          </span>
          {fileName ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2.5">
              <span className="flex min-w-0 items-center gap-2 text-sm text-emerald-300">
                <FileCheck2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{fileName}</span>
              </span>
              <button type="button" onClick={clearFile} aria-label="Remove file" className="text-zinc-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/15 px-3.5 py-2.5 text-sm text-zinc-400 transition-colors hover:border-brand-400/50 hover:text-zinc-200",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              <FileUp className="h-4 w-4" />
              {uploading ? "Uploading…" : "PDF, DOC, ZIP — up to 10 MB"}
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          )}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            …or paste a link
          </span>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input name="link_url" type="url" placeholder="https://drive.google.com/…" className={cn(inputClasses, "pl-10")} />
          </div>
        </label>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-4">
        <Button type="submit" variant="brand" disabled={pending || uploading} className="rounded-full">
          <Send className="h-4 w-4" />
          {pending ? "Submitting…" : "Submit to the core team"}
        </Button>
        {result?.error && <p className="text-sm text-red-400">{result.error}</p>}
        {result?.success && <p className="text-sm text-emerald-400">{result.success}</p>}
      </div>
    </form>
  );
}
