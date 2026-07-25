import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Server Supabase client — for Server Components, Server Actions and Route
 * Handlers. Cookie writes are best-effort (they are no-ops when called from a
 * Server Component render; the middleware refreshes sessions instead).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore; middleware
            // is responsible for refreshing the auth cookie.
          }
        },
      },
    },
  );
}

/**
 * Cookieless anon client for PUBLIC reads (tables whose RLS grants
 * `select using (true)` — the hack_* and public ev_* content).
 *
 * Because it never touches cookies it carries no per-user state, which is what
 * makes it safe to wrap in `unstable_cache`: the cached value is identical for
 * every visitor. `createClient()` reads cookies, so calling it inside a cache
 * scope throws — that is the whole reason this exists.
 *
 * Never use it for anything user-specific or permission-dependent.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** True when the service-role key is available in this environment. */
export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

/**
 * Service-role client — bypasses RLS. ONLY use in trusted server code, and
 * only *after* the caller has been authorised (requireAdmin, or a verified
 * session). Never expose to the client.
 *
 * Throws when the key is absent: a client built on `undefined` silently sends
 * `Bearer undefined` and every write fails with an opaque 401, which is how
 * missing configuration used to surface as mystery "nothing saved" bugs.
 */
export function createAdminClient() {
  if (!hasServiceRole()) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — privileged server actions cannot run. " +
        "Add it to .env.local and to the deployment's environment variables.",
    );
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
