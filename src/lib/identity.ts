/**
 * Member identity.
 *
 * A member is identified by their name, a password, and a role — nothing else.
 * There is no member ID, no email address, and no external identifier.
 *
 * Supabase Auth still requires an `email` column on `auth.users`, so every
 * account carries a synthetic address derived from the name. It is an internal
 * implementation detail of the auth provider: it is never collected from the
 * user, never displayed, never returned by an API, and never stored on the
 * profile. `authEmailForName()` is the single place that mapping is defined.
 *
 * The database mirrors this in `public.auth_email_for_name()` (migration 0023).
 * The two must stay in agreement — a member created by the SQL function has to
 * be able to sign in through the form, and vice versa.
 */

/** Internal auth domain. Not a real mail domain, and never sent mail. */
const AUTH_DOMAIN = "members.avinya.local";

/**
 * "  Agresh   Agrawal " → "agresh.agrawal@members.avinya.local"
 *
 * Case, surrounding whitespace and punctuation are all normalised away, so a
 * member typing their name slightly differently still lands on their account.
 */
export function authEmailForName(name: string): string {
  const local = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${local}@${AUTH_DOMAIN}`;
}

/** False when a name normalises to nothing usable (e.g. only punctuation). */
export function isUsableName(name: string): boolean {
  return authEmailForName(name) !== `@${AUTH_DOMAIN}`;
}
