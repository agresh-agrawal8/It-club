import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:agresh@agreshagrawal.com";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
  urgent?: boolean;
  tag?: string;
}

/**
 * Deliver a web-push notification to every device registered by the given
 * profiles. Dead subscriptions (410/404) are pruned automatically.
 *
 * Never throws — push is best-effort so a failure here can't break the
 * in-app notification that already succeeded.
 */
export async function sendPushToProfiles(profileIds: string[], payload: PushPayload) {
  if (!ensureConfigured() || profileIds.length === 0) {
    return { sent: 0, failed: 0, skipped: true };
  }

  try {
    // Service role: we must read subscriptions for *other* users to fan out.
    const admin = createAdminClient();
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .in("profile_id", profileIds);

    if (!subs?.length) return { sent: 0, failed: 0, skipped: false };

    const body = JSON.stringify(payload);
    const dead: string[] = [];
    let sent = 0;
    let failed = 0;

    await Promise.all(
      subs.map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body,
          );
          sent += 1;
        } catch (err) {
          failed += 1;
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 404 || code === 410) dead.push(s.id);
        }
      }),
    );

    if (dead.length) {
      await admin.from("push_subscriptions").delete().in("id", dead);
    }
    return { sent, failed, skipped: false };
  } catch {
    return { sent: 0, failed: 0, skipped: true };
  }
}
