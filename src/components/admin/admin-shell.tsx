import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

/** Consistent header for every Core Team page. */
export function AdminPageHeader({
  title,
  description,
  backHref,
  action,
}: {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="mb-1 inline-flex w-fit items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-4 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden /> Back
          </Link>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-brand-300">
          Core team
        </p>
        <h1 className="headline text-[clamp(1.7rem,1.2rem+1.8vw,2.5rem)] text-white">{title}</h1>
        {description && (
          <p className="max-w-xl text-sm leading-relaxed text-ink-3">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/**
 * Inline delete — a plain form posting to a server action, so it works
 * without client JavaScript and revalidates the page afterwards.
 *
 * `confirmLabel` renders a native confirm via the form's onSubmit only when
 * JS is present; the server action is the real guard either way.
 */
export function DeleteButton({
  action,
  id,
  label = "Delete",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={label}
        title={label}
        className="flex h-11 w-11 items-center justify-center rounded-xl text-ink-4 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}

/** Panel wrapper so every Core Team section sits on the same surface. */
export function AdminPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface flex flex-col gap-6 rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="headline-wide text-sm text-white">{title}</h2>
        {description && <p className="text-sm leading-relaxed text-ink-3">{description}</p>}
      </div>
      {children}
    </section>
  );
}
