import { NextResponse, type NextRequest } from "next/server";
import { updateSession, PROTECTED_PREFIXES } from "@/lib/supabase/middleware";

/**
 * Middleware runs on every matched request, and the Supabase session refresh
 * inside it is a network round-trip to the auth server. Doing that for the
 * homepage — for a visitor who has no session at all — put ~150-400ms of
 * latency in front of every public page for no benefit.
 *
 * So the auth work is now gated: public routes fall straight through, and only
 * the member area pays for a session check. That is also why the matcher below
 * excludes static assets and image files rather than matching everything.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsSession =
    pathname === "/login" ||
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!needsSession) return NextResponse.next();

  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals, the metadata files, and static assets.
     * Those never need a session and matching them only burns edge invocations.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|robots.txt|sitemap.xml|manifest.webmanifest|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
