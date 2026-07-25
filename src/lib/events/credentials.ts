import "server-only";
import { createHash, randomBytes } from "crypto";

/**
 * Issued-credential helpers for the event domain (auth Path C).
 *
 * Hashing lives here rather than in the database so there is exactly one
 * implementation; Postgres only ever stores the finished "salt:hash" string.
 */

/** Salted SHA-256, stored as "salt:hash". */
export function hashPassword(password: string, salt?: string) {
  const s = salt ?? randomBytes(12).toString("hex");
  const h = createHash("sha256").update(`${s}:${password}`).digest("hex");
  return `${s}:${h}`;
}

/** Readable, unambiguous password for handing to students on paper. */
export function generatePassword() {
  const words = [
    "orbit",
    "cipher",
    "vector",
    "photon",
    "quartz",
    "signal",
    "beacon",
    "lattice",
  ];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}${n}`;
}

/**
 * Login code for a team, e.g. "CR-A7F2".
 *
 * Uses a Crockford-style alphabet with I/O/0/1 removed, so a code read off a
 * whiteboard or printout cannot be mistyped in the ambiguous cases.
 */
export function generateLoginCode(prefix: string) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (const byte of randomBytes(4)) out += alphabet[byte % alphabet.length];
  return `${prefix.toUpperCase()}-${out}`;
}
