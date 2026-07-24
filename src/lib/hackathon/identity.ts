import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Demo identity for the Infinium Hackathon module.
 *
 * The module is intentionally NOT wired to club auth yet. To let you explore
 * every role, the "current participant" is stored in a cookie and can be
 * switched from the dashboard. When real auth is added later, only this file
 * needs to change — the rest of the module reads getHackIdentity().
 */

const COOKIE = "infinium_participant";

export type HackRole = "student" | "judge" | "organizer" | "admin";

export interface HackIdentity {
  id: string;
  name: string;
  role: HackRole;
  avatar_url: string | null;
  email: string | null;
  points: number;
}

/** Resolve the active demo participant (falls back to the first student). */
export async function getHackIdentity(): Promise<HackIdentity | null> {
  try {
    const store = await cookies();
    const chosen = store.get(COOKIE)?.value;
    const supabase = await createClient();

    if (chosen) {
      const { data } = await supabase
        .from("hack_participants")
        .select("id,name,role,avatar_url,email,points")
        .eq("id", chosen)
        .single();
      if (data) return data as HackIdentity;
    }

    // Default: first student, so the dashboard has a sensible starting view.
    const { data } = await supabase
      .from("hack_participants")
      .select("id,name,role,avatar_url,email,points")
      .eq("role", "student")
      .order("points", { ascending: false })
      .limit(1)
      .single();
    return (data as HackIdentity) ?? null;
  } catch {
    return null;
  }
}

/** The team (if any) the given participant belongs to, with members. */
export async function getMyTeam(participantId: string | null) {
  if (!participantId) return null;
  try {
    const supabase = await createClient();
    const { data: link } = await supabase
      .from("hack_team_members")
      .select("team_id,is_captain")
      .eq("participant_id", participantId)
      .maybeSingle();
    if (!link) return null;

    const [{ data: team }, { data: memberLinks }, { data: submission }] = await Promise.all([
      supabase.from("hack_teams").select("*").eq("id", link.team_id).single(),
      supabase.from("hack_team_members").select("participant_id,is_captain").eq("team_id", link.team_id),
      supabase.from("hack_submissions").select("*").eq("team_id", link.team_id).maybeSingle(),
    ]);

    const ids = (memberLinks ?? []).map((m: { participant_id: string }) => m.participant_id);
    const { data: members } = ids.length
      ? await supabase.from("hack_participants").select("id,name,avatar_url,role").in("id", ids)
      : { data: [] as any[] };

    const captainMap = new Map(
      (memberLinks ?? []).map((m: { participant_id: string; is_captain: boolean }) => [
        m.participant_id,
        m.is_captain,
      ]),
    );

    return {
      team,
      isCaptain: link.is_captain,
      submission: submission ?? null,
      members: (members ?? []).map((m: any) => ({ ...m, is_captain: captainMap.get(m.id) ?? false })),
    };
  } catch {
    return null;
  }
}

export { COOKIE as HACK_COOKIE };
