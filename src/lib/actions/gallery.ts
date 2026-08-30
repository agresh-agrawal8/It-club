"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireCoreTeam } from "@/lib/auth";
import { sniffImage } from "@/lib/images";
import { slugify } from "@/lib/utils";

/**
 * Gallery uploads.
 *
 * The form asks for two things: the image, and what it is. Everything the
 * public page and the search engines need — the storage filename, the URL
 * slug, the alt text, the intrinsic dimensions — is derived here from those
 * two inputs. Asking an uploader to hand-write six metadata fields is how
 * galleries end up with five photos in them.
 *
 * The upload deliberately goes through the server rather than straight from
 * the browser to Supabase Storage. Only on the server can the bytes be
 * checked against the claimed type and the storage path be chosen by us
 * instead of by the client.
 */

const MAX_BYTES = 8 * 1024 * 1024;

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Give the photo a short title")
    .max(120, "Keep the title under 120 characters"),
});

export type GalleryUploadState =
  | { error?: string; success?: boolean; title?: string }
  | undefined;

export async function uploadGalleryImageAction(
  _prev: GalleryUploadState,
  formData: FormData,
): Promise<GalleryUploadState> {
  await requireCoreTeam();

  const parsed = schema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Check the title and try again." };
  }
  const { title } = parsed.data;

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "That photo is over 8 MB — please pick a smaller one." };
  }

  // Read the bytes and identify the format from its signature. The browser's
  // `file.type` and the filename extension are both ignored on purpose.
  const buffer = Buffer.from(await file.arrayBuffer());
  const image = sniffImage(buffer);
  if (!image) {
    return { error: "That file isn't a readable PNG, JPEG, WebP or GIF image." };
  }

  const supabase = await createClient();

  // Slug doubles as the SEO filename. The random suffix guarantees uniqueness
  // without a round-trip, and keeps two photos called "Hack Night" apart.
  const base = slugify(title) || "photo";
  const slug = `${base}-${randomBytes(3).toString("hex")}`;
  const path = `${new Date().getFullYear()}/${slug}.${image.extension}`;

  const { error: uploadError } = await supabase.storage
    .from("gallery")
    .upload(path, buffer, {
      // Serve it as what it actually is, and never as something executable.
      contentType: image.mime,
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) {
    return { error: "Upload failed. Check you're still signed in and try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("gallery").getPublicUrl(path);

  const { error: insertError } = await supabase.from("gallery_items").insert({
    title,
    slug,
    // The uploader's title is the most accurate description available without
    // looking at the picture. It is used verbatim rather than padded with club
    // keywords, which would be stuffing, not describing.
    alt_text: title,
    image_url: publicUrl,
    width: image.width,
    height: image.height,
  });

  if (insertError) {
    // Don't leave the bucket holding an object no row points at.
    await supabase.storage.from("gallery").remove([path]);
    return { error: "Could not save the photo. Try again." };
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  return { success: true, title };
}

export async function deleteGalleryItemAction(formData: FormData) {
  await requireCoreTeam();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) return;

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("gallery_items")
    .select("image_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("gallery_items").delete().eq("id", id);
  if (error) return;

  // Remove the stored object too, so deleting a photo from the gallery does
  // not silently leave it public at its old URL.
  if (item?.image_url) {
    const marker = "/storage/v1/object/public/gallery/";
    const at = item.image_url.indexOf(marker);
    if (at !== -1) {
      const path = decodeURIComponent(item.image_url.slice(at + marker.length));
      await supabase.storage.from("gallery").remove([path]);
    }
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/gallery");
  revalidatePath("/");
}
