import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdminRole } from "@/lib/utils";
import { readEventSession } from "./session";
import type { EventRole } from "./types";

/**
 * Event-domain authorisation.
 *
 * Two identities can act on an event:
 *   • a club admin (super_admin / admin) — the core team runs every event, so
 *     is_admin() grants organiser rights everywhere, matching the RLS helper
 *     ev_is_event_admin();
 *   • an event participant whose ev_participants.role (or an extra granted
 *     role) is high enough.
 *
 * These helpers resolve that and redirect on failure, so a page body can
 * assume the caller is allowed.
 */

const STAFF_ROLES: EventRole[] = ["volunteer", "judge", "admin", "super_admin"];
const ADMIN_ROLES: EventRole[] = ["admin", "super_admin"];

export interface EventActor {
  /** Club auth user id, when signed in through the club. */
  userId: string | null;
  /** ev_participants.id for this event, when acting as a participant. */
  participantId: string | null;
  roles: EventRole[];
  isClubAdmin: boolean;
}

/** Resolve the caller's roles within one event. Never throws. */
export async function getEventActor(eventId: string, eventSlug: string): Promise<EventActor> {
  const roles = new Set<EventRole>();
  let userId: string | null = null;
  let participantId: string | null = null;
  let isClubAdmin = false;

  try {
    const current = await getCurrentUser();
    if (current?.user) {
      userId = current.user.id;
      if (isAdminRole(current.profile?.role)) {
        isClubAdmin = true;
        roles.add("admin");
      }
    }

    // Path C: an event-session cookie identifies a participant directly.
    participantId = await readEventSession(eventSlug).catch(() => null);

    const supabase = await createClient();
    // Resolve the participant row (by session id, else by linked profile) and
    // fold in its role plus any extra granted roles.
    const { data: participant } = participantId
      ? await supabase
          .from("ev_participants")
          .select("id, role")
          .eq("id", participantId)
          .eq("event_id", eventId)
          .maybeSingle()
      : userId
        ? await supabase
            .from("ev_participants")
            .select("id, role, ev_profiles!inner(user_id)")
            .eq("event_id", eventId)
            .eq("ev_profiles.user_id", userId)
            .maybeSingle()
        : { data: null };

    if (participant) {
      participantId = participant.id;
      roles.add(participant.role as EventRole);
      const { data: extra } = await supabase
        .from("ev_participant_roles")
        .select("role")
        .eq("participant_id", participant.id);
      for (const r of extra ?? []) roles.add(r.role as EventRole);
    }
  } catch {
    // Fall through with whatever we resolved; the require* guards handle it.
  }

  return { userId, participantId, roles: [...roles], isClubAdmin };
}

function has(actor: EventActor, allowed: EventRole[]) {
  return actor.isClubAdmin || actor.roles.some((r) => allowed.includes(r));
}

/** Require any signed-in participant; redirect to the event login otherwise. */
export async function requireEventParticipant(eventId: string, eventSlug: string) {
  const actor = await getEventActor(eventId, eventSlug);
  if (!actor.participantId && !actor.isClubAdmin) redirect(`/events/hub/${eventSlug}/login`);
  return actor;
}

/** Require event staff (volunteer/judge/admin) — else back to the landing page. */
export async function requireEventStaff(eventId: string, eventSlug: string) {
  const actor = await getEventActor(eventId, eventSlug);
  if (!has(actor, STAFF_ROLES)) redirect(`/events/hub/${eventSlug}`);
  return actor;
}

/** Require an event organiser (admin/super_admin, or a club admin). */
export async function requireEventAdmin(eventId: string, eventSlug: string) {
  const actor = await getEventActor(eventId, eventSlug);
  if (!has(actor, ADMIN_ROLES)) redirect(`/events/hub/${eventSlug}`);
  return actor;
}
