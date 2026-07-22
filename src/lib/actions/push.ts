"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { sendPushToProfiles } from "@/lib/push";

/** Store this browser's push subscription against the signed-in profile. */
export async function savePushSubscriptionAction(raw: string, userAgent?: string) {
  const { user } = await requireUser();
  try {
    const sub = JSON.parse(raw) as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };
    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return { error: "Invalid subscription." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        profile_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: "endpoint" },
    );
    if (error) return { error: "Could not save the subscription." };
    return { success: true };
  } catch {
    return { error: "Could not enable notifications." };
  }
}

/** Remove this browser's subscription. */
export async function removePushSubscriptionAction(endpoint: string) {
  await requireUser();
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  return { success: true };
}

/** Send a test push to the signed-in user's own devices. */
export async function sendTestPushAction() {
  const { user } = await requireUser();
  const res = await sendPushToProfiles([user.id], {
    title: "Avinya notifications are on",
    body: "This is what a club notice will look like on this device.",
    url: "/notifications",
    tag: "avinya-test",
  });
  if (res.skipped) return { error: "Push is not configured on the server yet." };
  if (res.sent === 0) return { error: "No devices registered for this account yet." };
  return { success: `Sent to ${res.sent} device${res.sent > 1 ? "s" : ""}.` };
}
