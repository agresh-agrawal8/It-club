import React from 'react'
import { cn } from '../../lib/cn'

export type BadgeVariant = 'small' | 'large' | 'accent'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `small` for compact metadata tags, `large` for prominent category labels, `accent` for violet highlight badges. */
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  small: 'bg-zinc-950 border border-zinc-700 text-zinc-300 px-3 py-1 text-[10px]',
  large: 'bg-white/90 text-zinc-900 px-4 py-1 text-xs',
  accent: 'bg-violet-500/20 border border-violet-400/50 text-violet-300 px-4 py-1 text-xs',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'small', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full font-medium uppercase tracking-wide',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
)
Badge.displayName = 'Badge'
