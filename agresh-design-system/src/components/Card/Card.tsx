import React from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Lift the card and add depth on hover — used for clickable project/blog cards. */
  hoverLift?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ hoverLift = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-3xl border border-white/10 bg-zinc-900 p-8',
        hoverLift && 'transition-transform duration-300 ease-out hover:-translate-y-2',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
)
Card.displayName = 'Card'
