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
