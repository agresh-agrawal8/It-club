"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ImageUp, Upload, X } from "lucide-react";
import { uploadGalleryImageAction, type GalleryUploadState } from "@/lib/actions/gallery";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

/**
 * The gallery uploader: an image and a title. That is the whole form.
 *
 * Filename, URL slug, alt text and the intrinsic dimensions are all derived on
 * the server from those two inputs, so the photograph still gets complete SEO
 * metadata without anyone being asked to write six fields per picture. The
 * fastest way to end up with an empty gallery is to make adding to it a chore.
 *
 * The file is posted to a server action rather than uploaded straight to
 * storage from here — the browser cannot be trusted to say what a file is, and
 * only the server can pick a safe storage path.
 */
const MAX_BYTES = 8 * 1024 * 1024;

export function GalleryUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState<GalleryUploadState, FormData>(
    uploadGalleryImageAction,
    undefined,
  );

  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Object URLs are a real allocation; releasing them stops a long upload
  // session from leaking a few megabytes per photo.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // Clear the form once the server confirms the row was written.
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setPreview(null);
      setFileName(null);
      setLocalError(null);
    }
  }, [state?.success]);

  function acceptFile(file: File | undefined) {
    if (!file) return;
    // A friendly client-side check only. The server re-validates from the
    // bytes, which is the check that actually counts.
    if (!file.type.startsWith("image/")) {
      setLocalError("Choose an image file — PNG, JPEG, WebP or GIF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("That photo is over 8 MB. Please pick a smaller one.");
      return;
    }
    setLocalError(null);
    setFileName(file.name);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
  }

  function clear() {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setFileName(null);
    setLocalError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const error = localError ?? state?.error;

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-6">
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3">
            Photo <span className="text-brand-300" aria-hidden>*</span>
          </span>

          {preview ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/15">
              {/* Local object URL preview — next/image would need a loader for
                  a blob: source and buys nothing for a throwaway thumbnail. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" aria-hidden className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={clear}
                aria-label="Remove selected photo"
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-white transition-colors hover:bg-black"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file && fileRef.current) {
                  // Put the dropped file into the real input so it is part of
                  // the form submission, not just in component state.
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileRef.current.files = dt.files;
                  acceptFile(file);
                }
              }}
              className={cn(
                "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed text-ink-3 transition-colors",
                dragging
                  ? "border-brand-400/70 bg-brand-500/10 text-white"
                  : "border-white/15 hover:border-brand-400/50 hover:text-white",
              )}
            >
              <ImageUp className="h-7 w-7" aria-hidden />
              <span className="text-xs">Click, or drop a photo here</span>
              <span className="text-[10px] text-ink-4">PNG · JPEG · WebP · GIF, up to 8 MB</span>
              <input
                ref={fileRef}
                type="file"
                name="image"
                accept="image/png,image/jpeg,image/webp,image/gif"
                required
                className="sr-only"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />
            </label>
          )}

          {fileName && <p className="truncate text-[11px] text-ink-4">{fileName}</p>}
        </div>

        <div className="flex flex-col gap-5">
          <Field
            name="title"
            label="Title"
            placeholder="Robotics workshop, October"
            hint="Say what the photo shows. This becomes the caption, the alt text for screen readers, and the filename search engines see."
            maxLength={120}
            required
          />

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {error}
            </p>
          )}

          {state?.success && (
            <p
              role="status"
              className="flex items-start gap-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              “{state.title}” is live in the gallery.
            </p>
          )}

          <SubmitButton
            icon={<Upload className="h-4 w-4" aria-hidden />}
            pendingLabel="Uploading…"
            className="w-fit"
          >
            Add to gallery
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
