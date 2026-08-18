"use client";

import { useRef, useState } from "react";
import { Check, FileArchive, Loader2, Presentation, Send, Upload, X } from "lucide-react";
import { getUploadTicketAction, saveSubmissionAction } from "@/lib/hackathon/portal-actions";

/**
 * Hand-in form: pitch deck and code, together.
 *
 * Files never pass through the Next.js server. For each attachment the form
 * asks for a signed ticket, PUTs the file straight to Supabase Storage, and
 * only then records the resulting path — which is why a 40 MB archive works
 * here despite the platform's ~4.5 MB limit on server-action bodies.
 */

const FIELD =
  "w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 transition-colors focus:border-brand-400/60 focus:outline-none";
const LABEL = "text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500";

export interface ExistingSubmission {
  code_name: string | null;
  code_size: number | null;
  deck_name: string | null;
  deck_size: number | null;
  repo_url: string | null;
  notes: string | null;
  status: "draft" | "submitted";
  submitted_at: string | null;
}

function pretty(bytes: number | null | undefined) {
  if (!bytes) return "";
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

type Slot = { file: File | null; path: string | null };

function FileSlot({
  kind,
  title,
  hint,
  accept,
  icon: IconCmp,
  slot,
  existingName,
  existingSize,
  onPick,
  onClear,
  progress,
  disabled,
}: {
  kind: string;
  title: string;
  hint: string;
  accept: string;
  icon: typeof FileArchive;
  slot: Slot;
  existingName: string | null;
  existingSize: number | null;
  onPick: (f: File | null) => void;
  onClear: () => void;
  progress: string | null;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chosen = slot.file;
  const has = Boolean(chosen || existingName);

  return (
    <div
      className={`flex flex-col gap-3 rounded-[16px] border p-4 transition-colors ${
        has ? "border-brand-400/30 bg-brand-500/[0.06]" : "border-white/[0.08] bg-black/25"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            has ? "bg-brand-500/15 text-brand-300" : "bg-white/[0.05] text-zinc-500"
          }`}
        >
          <IconCmp className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-medium text-white">{title}</span>
            {has && !progress && <Check className="h-4 w-4 shrink-0 text-accent-400" />}
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-500">{hint}</p>
        </div>
      </div>

      {chosen ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2">
          <span className="min-w-0 truncate text-[12.5px] text-zinc-300">
            {chosen.name} <span className="text-zinc-600">{pretty(chosen.size)}</span>
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onClear();
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="shrink-0 text-zinc-600 transition-colors hover:text-red-300"
              aria-label={`Remove ${title}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : existingName ? (
        <div className="rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-[12.5px] text-zinc-400">
          Already uploaded: <span className="text-zinc-300">{existingName}</span>{" "}
          <span className="text-zinc-600">{pretty(existingSize)}</span>
        </div>
      ) : null}

      {progress && (
        <p className="flex items-center gap-2 text-[12px] text-brand-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {progress}
        </p>
      )}

      {!disabled && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/12 py-2.5 text-[12.5px] text-zinc-400 transition-colors hover:border-brand-400/40 hover:text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            {existingName || chosen ? `Replace ${kind}` : `Choose ${kind}`}
          </button>
        </>
      )}
    </div>
  );
}

export function SubmissionForm({
  submission,
  open,
}: {
  submission: ExistingSubmission | null;
  open: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState<Slot>({ file: null, path: null });
  const [deck, setDeck] = useState<Slot>({ file: null, path: null });
  const [codeProgress, setCodeProgress] = useState<string | null>(null);
  const [deckProgress, setDeckProgress] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<{ error?: string; success?: string } | null>(null);

  const submitted = submission?.status === "submitted";

  async function upload(
    kind: "code" | "deck",
    file: File,
    setProgress: (s: string | null) => void,
  ): Promise<string | { error: string }> {
    setProgress("Preparing upload…");
    const ticket = await getUploadTicketAction(kind, file.name, file.size);
    if ("error" in ticket) {
      setProgress(null);
      return { error: ticket.error };
    }

    setProgress(`Uploading ${pretty(file.size)}…`);
    const res = await fetch(ticket.signedUrl, { method: "PUT", body: file });
    setProgress(null);
    if (!res.ok) return { error: `Upload failed for your ${kind}. Check your connection and retry.` };
    return ticket.path;
  }

  async function run(finalize: boolean) {
    if (!formRef.current) return;
    setPending(true);
    setState(null);

    const fd = new FormData(formRef.current);

    if (code.file) {
      const out = await upload("code", code.file, setCodeProgress);
      if (typeof out !== "string") {
        setState(out);
        setPending(false);
        return;
      }
      fd.set("code_path", out);
      fd.set("code_name", code.file.name);
      fd.set("code_size", String(code.file.size));
    }

    if (deck.file) {
      const out = await upload("deck", deck.file, setDeckProgress);
      if (typeof out !== "string") {
        setState(out);
        setPending(false);
        return;
      }
      fd.set("deck_path", out);
      fd.set("deck_name", deck.file.name);
      fd.set("deck_size", String(deck.file.size));
    }

    fd.set("finalize", String(finalize));
    const result = await saveSubmissionAction(undefined, fd);
    setState(result);
    if (result && "success" in result) {
      setCode({ file: null, path: null });
      setDeck({ file: null, path: null });
    }
    setPending(false);
  }

  if (!open) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[16px] border border-dashed border-white/10 bg-black/25 px-6 py-10 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-500">
          <Send className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[14px] font-medium text-white">
          {submitted ? "Your project is submitted" : "Submissions are not open yet"}
        </span>
        <p className="max-w-sm text-[12.5px] leading-relaxed text-zinc-500">
          {submitted
            ? "The window has closed. Your pitch deck and code are with the core team."
            : "The core team opens the submission window on event day. Hand in your pitch deck and code together here."}
        </p>
        {submission?.code_name && (
          <p className="text-[12px] text-zinc-600">
            On file: {submission.code_name}
            {submission.deck_name ? ` · ${submission.deck_name}` : ""}
          </p>
        )}
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <FileSlot
          kind="code"
          title="Your code"
          hint="Zip your whole project folder, including the .git history. ZIP, RAR, 7Z or TAR up to 60 MB."
          accept=".zip,.rar,.7z,.gz,.tgz,.tar"
          icon={FileArchive}
          slot={code}
          existingName={submission?.code_name ?? null}
          existingSize={submission?.code_size ?? null}
          onPick={(f) => setCode({ file: f, path: null })}
          onClear={() => setCode({ file: null, path: null })}
          progress={codeProgress}
          disabled={pending}
        />
        <FileSlot
          kind="deck"
          title="Your pitch deck"
          hint="The slides you would present. PDF, PPTX, PPT, ODP or Keynote up to 25 MB."
          accept=".pdf,.pptx,.ppt,.odp,.key"
          icon={Presentation}
          slot={deck}
          existingName={submission?.deck_name ?? null}
          existingSize={submission?.deck_size ?? null}
          onPick={(f) => setDeck({ file: f, path: null })}
          onClear={() => setDeck({ file: null, path: null })}
          progress={deckProgress}
          disabled={pending}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Repository link (optional)</span>
        <input
          name="repo_url"
          defaultValue={submission?.repo_url ?? ""}
          placeholder="https://…"
          className={FIELD}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Notes for the judges (optional)</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={submission?.notes ?? ""}
          placeholder="How to run it, what to look at first, anything unfinished."
          className={`${FIELD} resize-none`}
        />
      </label>

      {state?.error && (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl border border-accent-400/25 bg-accent-500/10 px-4 py-3 text-[13px] text-accent-300">
          {state.success}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11.5px] leading-relaxed text-zinc-500">
          {submitted
            ? "Submitted — you can still replace files until the window closes."
            : "Save a draft any time. Both files are required to submit."}
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(false)}
            className="rounded-full border border-white/12 px-5 py-2.5 text-[13px] text-white transition-colors hover:border-white/25 disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(true)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-brand-500 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {submitted ? "Re-submit" : "Submit project"}
          </button>
        </div>
      </div>
    </form>
  );
}
