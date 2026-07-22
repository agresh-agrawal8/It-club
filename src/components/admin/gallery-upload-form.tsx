"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImageUp, Link2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addGalleryItemAction } from "@/lib/actions/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClasses =
  "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

/**
 * Gallery uploader — admins pick an image which uploads straight to the
 * Supabase `gallery` bucket (storage RLS: admin-only writes), with a live
 * preview. Pasting an external URL still works as a fallback.
 */
export function GalleryUploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [result, setResult] = useState<{ error?: string; ok?: boolean } | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setResult({ error: "Pick an image file (PNG, JPG, WebP)." });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setResult({ error: "Image too large — keep it under 8 MB." });
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("gallery").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("gallery").getPublicUrl(path);
      setUploadedUrl(data.publicUrl);
    } catch {
      setResult({
        error: "Upload failed — are you signed in as an admin? You can paste a URL instead.",
      });
    } finally {
      setUploading(false);
    }
  }

  function clearUpload() {
    setUploadedUrl("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Uploaded file wins over a pasted URL.
    if (uploadedUrl) fd.set("image_url", uploadedUrl);
    if (!fd.get("image_url")) {
      setResult({ error: "Upload an image or paste an image URL." });
      return;
    }
    setResult(null);
    startTransition(async () => {
      const res = await addGalleryItemAction(fd);
      if (res && "error" in res && res.error) {
        setResult({ error: res.error });
      } else {
        setResult({ ok: true });
        formRef.current?.reset();
        clearUpload();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        {/* Upload / preview tile */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Photo <span className="text-brand-300">*</span>
          </span>
          {uploadedUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-emerald-400/30">
              <Image src={uploadedUrl} alt="Upload preview" fill className="object-cover" sizes="220px" />
              <button
                type="button"
                onClick={clearUpload}
                aria-label="Remove image"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-white hover:bg-zinc-950"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              className={cn(
                "flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-zinc-500 transition-colors hover:border-brand-400/50 hover:text-zinc-300",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              <ImageUp className="h-6 w-6" />
              <span className="text-xs">{uploading ? "Uploading…" : "Click to upload"}</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        {/* Meta fields */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Title</span>
              <input name="title" placeholder="Hack Night 2026" className={inputClasses} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Album</span>
              <input name="album" placeholder="Events" className={inputClasses} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Caption</span>
            <input name="caption" placeholder="A line about this moment…" className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              …or paste an image URL
            </span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
              <input
                name="image_url"
                type="url"
                placeholder="https://…"
                disabled={!!uploadedUrl}
                className={cn(inputClasses, "pl-10", uploadedUrl && "opacity-40")}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button type="submit" size="sm" disabled={pending || uploading}>
          <Plus className="h-4 w-4" />
          {pending ? "Adding…" : "Add to gallery"}
        </Button>
        {result?.error && <p className="text-sm text-red-400">{result.error}</p>}
        {result?.ok && <p className="text-sm text-emerald-400">Photo added to the gallery.</p>}
      </div>
    </form>
  );
}
