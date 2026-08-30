"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * Public (unauthenticated) actions.
 *
 * The contact-message and membership-application forms that used to live here
 * are gone along with their tables — the club takes both in person now, and
 * the contact page carries the details instead of an inbox nobody read.
 */

const subscribeSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  contact: z.string().trim().min(3).max(120),
});

export async function subscribeAction(_prev: unknown, formData: FormData) {
  const parsed = subscribeSchema.safeParse({
    channel: formData.get("channel") ?? "email",
    contact: formData.get("contact"),
  });
  if (!parsed.success) return { error: "Enter a valid email or phone number." };

  const { channel, contact } = parsed.data;
  if (channel === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    return { error: "Enter a valid email address." };
  }
  if (channel === "whatsapp" && !/^[+\d][\d\s-]{6,}$/.test(contact)) {
    return { error: "Enter a valid phone number." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("subscribers")
      .upsert({ channel, contact }, { onConflict: "channel,contact" });
    if (error) return { error: "Could not subscribe right now. Please try again." };
    return { success: "You're subscribed. We'll let you know what's coming up." };
  } catch {
    return { error: "Subscriptions aren't available right now." };
  }
}

const submissionSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Enter a valid email"),
  category: z.enum(["competition", "company", "content", "other"]).default("competition"),
  title: z.string().trim().min(3, "Give your submission a title").max(140),
  message: z.string().max(4000).optional(),
  file_url: z.string().url().optional().or(z.literal("")),
  link_url: z.string().url("Enter a valid link").optional().or(z.literal("")),
});

/**
 * Public: submit an entry for a competition, company drive or club content.
 * Any file is uploaded to the `submissions` bucket by the client first; this
 * action records the row.
 */
export async function submitDocumentAction(_prev: unknown, formData: FormData) {
  const parsed = submissionSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    category: formData.get("category") ?? "competition",
    title: formData.get("title"),
    message: formData.get("message"),
    file_url: formData.get("file_url") ?? "",
    link_url: formData.get("link_url") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Please complete the form." };
  }

  const d = parsed.data;
  if (!d.file_url && !d.link_url) {
    return { error: "Attach a file or paste a link to your work." };
  }

  // Only accept links the browser will actually treat as web links — a
  // javascript: or data: URL stored here would be rendered in the core-team
  // inbox as a clickable anchor.
  for (const url of [d.file_url, d.link_url]) {
    if (url && !/^https?:\/\//i.test(url)) {
      return { error: "Links must start with http:// or https://" };
    }
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("submissions").insert({
      name: d.name,
      email: d.email,
      category: d.category,
      title: d.title,
      message: d.message || null,
      file_url: d.file_url || null,
      link_url: d.link_url || null,
    });
    if (error) return { error: "Could not submit right now. Please try again." };
    return { success: "Submission received — the core team will review it soon." };
  } catch {
    return { error: "Submissions aren't available right now." };
  }
}
