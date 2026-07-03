import React from 'react'
import { cn } from '../../lib/cn'

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Marks the tag as the currently selected filter/category. */
  active?: boolean
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ active = false, className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors',
        active
          ? 'border-violet-400/50 bg-violet-500/20 text-violet-300'
          : 'border-white/10 bg-transparent text-zinc-400 hover:border-white/20 hover:text-zinc-200',
        className,
      )}
      {...props}
    />
  ),
)
Tag.displayName = 'Tag'
