import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { findTeamByName, getTeamPortal, type Team } from "./data";

/**
 * Infinium team portal sessions.
 *
 * ── No passwords ───────────────────────────────────────────────────────────
 * Teams open their portal by typing their exact team name. That is a
 * deliberate simplification for a school event where every team is in the same
 * room, and it is only safe because of what the portal is: strictly read-only.
 * There is nothing a visitor could change, and nothing behind it that is not
 * read out at the closing ceremony anyway.
 *
 * What it still guarantees:
 *   • `lower(name)` is uniquely indexed, so a name resolves to exactly one
 *     team — one team's portal can never render another team's data.
 *   • The cookie is HMAC-signed, so it cannot be edited into a different
 *     team id by hand.
 *   • Unpublished results never leave the server, so nothing can be read
 *     before the organisers publish it.
 *   • Every write path still requires a club admin session (requireCoreTeam).
 */

export const TEAM_COOKIE = "infinium_team";

/** One day covers the event comfortably; the portal is not long-lived. */
const SESSION_MAX_AGE_S = 60 * 60 * 24;

function sessionSecret() {
  const secret =
    process.env.EVENT_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!secret) {
    throw new Error(
      "Session signing secret missing: set EVENT_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createTeamSessionToken(teamId: string) {
  const payload = `${teamId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function readTeamSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [teamId, issuedAt, signature] = parts;

  const expected = Buffer.from(sign(`${teamId}.${issuedAt}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  if (!Number.isFinite(age) || age < 0 || age > SESSION_MAX_AGE_S) return null;

  return teamId;
}

export const TEAM_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/hackathon",
  maxAge: SESSION_MAX_AGE_S,
} as const;

/** The team id in this browser's signed cookie, if any. */
export async function getTeamSessionId(): Promise<string | null> {
  try {
    const store = await cookies();
    return readTeamSessionToken(store.get(TEAM_COOKIE)?.value);
  } catch {
    return null;
  }
}

/** The signed-in team, or null. */
export async function getTeamSession(): Promise<Team | null> {
  const id = await getTeamSessionId();
  if (!id) return null;
  const portal = await getTeamPortal(id);
  return portal?.team ?? null;
}

/**
 * Resolve a typed team name to a session token.
 *
 * Returns a token rather than setting the cookie so the caller (a server
 * action) owns the cookie write and the redirect.
 */
export async function openPortalFor(name: string) {
  const team = await findTeamByName(name);
  if (!team) return null;
  return { team, token: createTeamSessionToken(team.id) };
}
