"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const subscribeSchema = z.object({
  channel: z.enum(["email", "whatsapp"]),
  contact: z.string().min(3),
});

export async function subscribeAction(_prev: unknown, formData: FormData) {
  const parsed = subscribeSchema.safeParse({
    channel: formData.get("channel") ?? "email",
    contact: formData.get("contact"),
  });
  if (!parsed.success) return { error: "Enter a valid email or phone number." };

  // Basic per-channel validation
  const { channel, contact } = parsed.data;
  if (channel === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact)) {
    return { error: "Enter a valid email address." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("subscribers")
      .upsert({ channel, contact }, { onConflict: "channel,contact" });
    if (error) return { error: "Could not subscribe right now. Please try again." };
    return { success: "You're subscribed! We'll keep you posted." };
  } catch {
    return { error: "Subscription service is not available yet." };
  }
}

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10),
});

export async function contactAction(_prev: unknown, formData: FormData) {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { error: "Please complete all fields (message ≥ 10 characters)." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert(parsed.data);
    if (error) return { error: "Could not send your message. Please try again." };
    return { success: "Thanks for reaching out — we'll get back to you soon!" };
  } catch {
    return { error: "Messaging is not available yet." };
  }
}

const submissionSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  category: z.enum(["competition", "company", "content", "other"]).default("competition"),
  title: z.string().min(3, "Give your submission a title"),
  message: z.string().optional(),
  file_url: z.string().url().optional().or(z.literal("")),
  link_url: z.string().url("Enter a valid link").optional().or(z.literal("")),
});

/**
 * Public: submit a document/entry for competitions, company drives or club
 * content. The file (if any) is uploaded to the `submissions` bucket by the
 * client first; this action only records the row.
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
    return { error: "Submissions are not available yet." };
  }
}
