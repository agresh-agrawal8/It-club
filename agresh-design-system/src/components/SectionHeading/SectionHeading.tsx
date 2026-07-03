import React from 'react'
import { cn } from '../../lib/cn'

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Small uppercase label shown above the title, e.g. "OUR WORK". */
  eyebrow?: string
  /** The section's main heading text. */
  title: string
  /** Optional supporting copy shown below the title. */
  description?: string
  /** Left-aligns by default; `center` is used for hero/intro sections. */
  align?: 'left' | 'center'
}

export const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ eyebrow, title, description, align = 'left', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-4',
        align === 'center' && 'items-center text-center',
        className,
      )}
      {...props}
    >
      {eyebrow && (
        <span className="text-xs font-medium uppercase tracking-[2px] text-violet-400">
          {eyebrow}
        </span>
      )}
      <h2 className="text-4xl font-semibold tracking-tighter text-white md:text-6xl">{title}</h2>
      {description && (
        <p className="max-w-2xl text-lg leading-relaxed text-zinc-300">{description}</p>
      )}
    </div>
  ),
)
SectionHeading.displayName = 'SectionHeading'
