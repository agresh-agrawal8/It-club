import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed event sessions.
 *
 * An identifier is not a credential. Team and participant ids are readable
 * from public tables, so a cookie holding a bare id can be forged by anyone
 * who can list those ids — which is exactly the defect this platform's first
 * module shipped with. Every session cookie here is HMAC-signed, carries an
 * issue timestamp, and is verified server-side before it is trusted.
 *
 * Format: `<subjectId>.<issuedAtMs>.<base64url HMAC-SHA256>`
 */

const MAX_AGE_S = 60 * 60 * 24 * 7;

export function eventCookieName(eventSlug: string) {
  return `ev_sess_${eventSlug}`;
}

function secret() {
  const value =
    process.env.EVENT_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!value) {
    throw new Error(
      "Session signing secret missing: set EVENT_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY).",
    );
  }
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function mintSessionToken(subjectId: string) {
  const payload = `${subjectId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify a token and return the subject id, or null if forged or expired. */
export function readSessionToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [subjectId, issuedAt, signature] = parts;

  const expected = Buffer.from(sign(`${subjectId}.${issuedAt}`));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const age = (Date.now() - Number(issuedAt)) / 1000;
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_S) return null;

  return subjectId;
}

/**
 * Cookie is scoped by NAME (`ev_sess_<slug>`), not by path.
 *
 * A path scope has to mirror the route shape exactly, and silently stops
 * working the moment the route moves — which is what happened when the event
 * domain mounted at /events/hub/<slug> while this said /events/<slug>: the
 * cookie was set but never sent back, so every participant looked signed out.
 * The name already namespaces per event, so path "/" is both simpler and
 * immune to that class of bug.
 */
export function sessionCookieOptions(_eventSlug: string) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_S,
  } as const;
}

/** The verified participant id for this event on this browser, if any. */
export async function readEventSession(eventSlug: string): Promise<string | null> {
  const store = await cookies();
  return readSessionToken(store.get(eventCookieName(eventSlug))?.value);
}

export const SESSION_MAX_AGE_S = MAX_AGE_S;
