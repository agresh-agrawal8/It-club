import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * The club mark.
 *
 * One component so the emblem is identical in the nav, the footer, the login
 * card and the two dashboards. The artwork is the real club badge — there is
 * no drawn-in-code substitute anywhere in the app.
 */
export function Logo({
  size = 36,
  showWordmark = true,
  showTagline = false,
  href = "/",
  className,
}: {
  size?: number;
  showWordmark?: boolean;
  showTagline?: boolean;
  /** Pass null to render the mark without wrapping it in a link. */
  href?: string | null;
  className?: string;
}) {
  const content = (
    <>
      <Image
        src={SITE.mark}
        alt=""
        width={size}
        height={size}
        // Decorative: the adjacent wordmark already names the club, so
        // announcing the emblem too would just repeat it to a screen reader.
        aria-hidden
        priority
        className="shrink-0 rounded-full ring-1 ring-white/15"
        style={{ width: size, height: size }}
      />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="headline-wide text-[15px] text-white">Avinya</span>
          {showTagline && (
            <span className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
              Learn · Build · Innovate
            </span>
          )}
        </span>
      )}
    </>
  );

  if (href === null) {
    return <span className={cn("flex items-center gap-3", className)}>{content}</span>;
  }

  return (
    <Link
      href={href}
      aria-label={`${SITE.name} — home`}
      className={cn(
        "flex items-center gap-3 rounded-xl transition-opacity hover:opacity-90",
        className,
      )}
    >
      {content}
    </Link>
  );
}
