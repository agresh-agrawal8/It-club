import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";

/** Consistent header for every Core Team Panel page. */
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
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 flex w-fit items-center gap-1.5 text-xs text-zinc-500 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Core Team Panel
          </Link>
        )}
        <p className="text-xs font-medium uppercase tracking-[2px] text-amber-300/90">Core team</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tighter text-white md:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-xl text-sm text-zinc-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Inline delete button — a plain form posting to a server action, so it
 * works without client JS and revalidates the page after.
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
        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
