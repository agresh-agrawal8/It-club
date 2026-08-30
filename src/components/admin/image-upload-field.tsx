"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, Link2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * Reusable image field — uploads straight to a Supabase Storage bucket and
 * writes the resulting public URL into a hidden input, so it drops into any
 * form that expects a `*_url` string. Pasting an external URL still works.
 */
export function ImageUploadField({
  name,
  label = "Image",
  bucket = "media",
  folder = "",
  required = false,
  aspect = "aspect-[16/9]",
  defaultValue = "",
}: {
  name: string;
  label?: string;
  bucket?: string;
  folder?: string;
  required?: boolean;
  aspect?: string;
  /** Existing image URL when editing. */
  defaultValue?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(defaultValue);
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);

  const preview = url || pasted;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Pick an image file (PNG, JPG, WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image too large — keep it under 8 MB.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${folder ? folder + "/" : ""}${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
      setPasted("");
    } catch {
      setError("Upload failed — you can paste an image URL instead.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setUrl("");
    setPasted("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const inputClasses =
    "w-full rounded-xl border border-white/10 bg-zinc-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-brand-400/60 focus:outline-none transition-colors";

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
        {required && <span className="ml-1 text-brand-300">*</span>}
      </span>

      {/* The value the form actually submits */}
      <input type="hidden" name={name} value={preview} />

      <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
        {preview ? (
          <div className={cn("relative overflow-hidden rounded-xl border border-white/15", aspect)}>
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="200px" unoptimized />
            <button
              type="button"
              onClick={clear}
              aria-label="Remove image"
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-white hover:bg-zinc-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 text-zinc-500 transition-colors hover:border-brand-400/50 hover:text-zinc-300",
              aspect,
              uploading && "pointer-events-none opacity-60",
            )}
          >
            <ImageUp className="h-5 w-5" />
            <span className="text-[11px]">{uploading ? "Uploading…" : "Click to upload"}</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        )}

        <div className="flex flex-col justify-center gap-2">
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="url"
              value={pasted}
              onChange={(e) => {
                const next = e.target.value.trim();
                setPasted(next);
                setUrl("");
                // A data: URI here means someone pasted an entire encoded
                // image. It would be written into the database row verbatim —
                // tens of kilobytes on every query that reads the table, with
                // no caching and no optimisation. Uploading is what they meant.
                if (next.startsWith("data:")) {
                  setError("That's an encoded image, not a link. Use the upload button instead.");
                } else if (next && !/^https:\/\//i.test(next)) {
                  setError("Image links must start with https://");
                } else {
                  setError(null);
                }
              }}
              disabled={!!url}
              placeholder="…or paste an image URL"
              className={cn(inputClasses, "pl-10", url && "opacity-40")}
            />
          </div>
          <p className="text-[11px] text-zinc-600">
            Uploads are stored in Supabase Storage and served publicly.
          </p>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
