import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * An image whose URL came out of the database.
 *
 * `next/image` refuses any hostname not listed in `remotePatterns` and throws
 * a hard runtime error that takes the whole page down with it — which is what
 * happened the moment a banner was saved pointing at an image host we had not
 * anticipated. Banner and avatar URLs are typed in by a person, so the set of
 * possible hosts is "the internet"; it cannot be enumerated in advance.
 *
 * Widening `remotePatterns` to `**` would stop the crash and turn the
 * optimizer into an open image proxy that will fetch any URL a signed-in user
 * pastes. That is an abuse vector, not a fix.
 *
 * So: optimize what we host and can vouch for, and render anything else as a
 * plain <img>. The unoptimized path loses resizing, not correctness — and it
 * cannot crash the page.
 */

/** Mirrors the `remotePatterns` entry in next.config.ts. */
function isOptimizable(src: string) {
  try {
    const url = new URL(src);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".supabase.co") &&
      url.pathname.startsWith("/storage/v1/object/public/")
    );
  } catch {
    // Relative paths are served from /public and are always safe to optimize.
    return src.startsWith("/");
  }
}

type Props = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: "eager" | "lazy";
} & ({ fill: true; width?: never; height?: never } | { fill?: false; width: number; height: number });

export function RemoteImage({
  src,
  alt,
  className,
  sizes,
  priority,
  loading,
  fill,
  width,
  height,
}: Props) {
  if (isOptimizable(src)) {
    return fill ? (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={loading}
        className={className}
      />
    ) : (
      <Image
        src={src}
        alt={alt}
        width={width!}
        height={height!}
        sizes={sizes}
        priority={priority}
        loading={loading}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      loading={priority ? "eager" : (loading ?? "lazy")}
      decoding="async"
      // Referrer is withheld so an arbitrary third-party host does not get a
      // log of which club pages embed its images.
      referrerPolicy="no-referrer"
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  );
}
