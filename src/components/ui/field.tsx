import React from "react";
import { cn } from "@/lib/utils";

/**
 * The one text input used across every form in the app.
 *
 * A few things it does that a bare <input> does not:
 *  - The label is a real <label htmlFor>, so tapping it focuses the field and
 *    a screen reader announces the two together.
 *  - Help text and error text are wired up through aria-describedby, so they
 *    are read out as part of the field rather than floating unattached.
 *  - An error sets aria-invalid, which is what assistive tech actually checks;
 *    a red border alone communicates nothing to a screen reader, and nothing
 *    at all to someone who cannot distinguish red from grey.
 *  - Focus is a visible two-tone ring inherited from :focus-visible in
 *    globals.css, never `outline: none`.
 */

const controlClasses =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm text-white " +
  "placeholder:text-ink-4 transition-[border-color,box-shadow] duration-[var(--duration-fast)] " +
  "hover:border-white/20 focus:border-brand-400/70 focus:outline-none " +
  "focus:ring-2 focus:ring-brand-400/25 disabled:cursor-not-allowed disabled:opacity-50";

const errorClasses = "border-red-400/60 focus:border-red-400 focus:ring-red-400/25";

interface BaseProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  className?: string;
}

export interface FieldProps
  extends BaseProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "name"> {}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, name, error, hint, className, id, required, ...props },
  ref,
) {
  const fieldId = id ?? name;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={fieldId}
        className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3"
      >
        {label}
        {required && (
          <span className="ml-1 text-brand-300" aria-hidden>
            *
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-xs leading-relaxed text-ink-4">
          {hint}
        </p>
      )}

      <input
        id={fieldId}
        name={name}
        ref={ref}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={cn(controlClasses, error && errorClasses, className)}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
});

export interface TextAreaFieldProps
  extends BaseProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name"> {}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, name, error, hint, className, id, required, ...props }, ref) {
    const fieldId = id ?? name;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={fieldId}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3"
        >
          {label}
          {required && (
            <span className="ml-1 text-brand-300" aria-hidden>
              *
            </span>
          )}
        </label>

        {hint && (
          <p id={hintId} className="text-xs leading-relaxed text-ink-4">
            {hint}
          </p>
        )}

        <textarea
          id={fieldId}
          name={name}
          ref={ref}
          required={required}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
          className={cn(controlClasses, "resize-y", error && errorClasses, className)}
          {...props}
        />

        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  },
);

export interface SelectFieldProps
  extends BaseProps,
    Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name"> {
  options: { value: string; label: string }[];
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    { label, name, error, hint, className, id, required, options, ...props },
    ref,
  ) {
    const fieldId = id ?? name;
    const hintId = hint ? `${fieldId}-hint` : undefined;
    const errorId = error ? `${fieldId}-error` : undefined;

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={fieldId}
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3"
        >
          {label}
          {required && (
            <span className="ml-1 text-brand-300" aria-hidden>
              *
            </span>
          )}
        </label>

        {hint && (
          <p id={hintId} className="text-xs leading-relaxed text-ink-4">
            {hint}
          </p>
        )}

        <div className="relative">
          <select
            id={fieldId}
            name={name}
            ref={ref}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
            className={cn(
              controlClasses,
              // Suppress the OS chevron and draw our own, so the control does
              // not read as a browser default in the middle of the dark UI.
              "appearance-none pr-11",
              error && errorClasses,
              className,
            )}
            {...props}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value} className="bg-zinc-900 text-white">
                {o.label}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  },
);
