import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Refreshes the Supabase session on every request and keeps signed-out
 * visitors out of the member area.
 *
 * This is a first line of defence, not the defence. Middleware only checks
 * that *someone* is signed in — it deliberately does not read roles, because
 * doing so would put an authorization decision in an edge function that
 * cannot see RLS. Role checks live in the page guards (`requireCoreTeam`) and,
 * underneath those, in the database policies.
 */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/my-tasks",
  "/notifications",
  "/calendar",
  "/account",
  "/admin",
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;
  // The caller in middleware.ts has already decided this route needs a
  // session; /login is the one path that wants the check without being
  // protected, so it is excluded here rather than redirected below.
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Supabase not configured — the public site still works; the member area
  // sends you to the login page, where no session is possible anyway.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            // The auth cookies are httpOnly and secure by default in
            // @supabase/ssr; the session token is never readable from JS.
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in → don't show the login form again.
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
