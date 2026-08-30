import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

/**
 * Public shell.
 *
 * This layout deliberately does NOT read the session. It used to call
 * `getCurrentUser()` purely so the nav could say "Dashboard" instead of
 * "Sign in" — which cost a round-trip to the Supabase auth server on every
 * public page view, for every anonymous visitor, and forced every public page
 * to render dynamically because it touched cookies.
 *
 * The nav now always shows "Sign in". A visitor who is already signed in and
 * clicks it is bounced straight to their dashboard by middleware, so nothing
 * is lost but the label — and the entire public site becomes cacheable.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Target of the skip link in the root layout. */}
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
