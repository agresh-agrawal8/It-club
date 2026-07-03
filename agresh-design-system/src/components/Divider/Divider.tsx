import React from 'react'
import { cn } from '../../lib/cn'

export type DividerThickness = 'thin' | 'thick'

export interface DividerProps extends React.HTMLAttributes<HTMLHRElement> {
  /** `thin` for standard section dividers, `thick` for the heavier rule above major sections. */
  thickness?: DividerThickness
}

export const Divider = React.forwardRef<HTMLHRElement, DividerProps>(
  ({ thickness = 'thin', className, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn(
        'border-0 border-t',
        thickness === 'thick' ? 'border-t-8 border-zinc-900' : 'border-zinc-800',
        className,
      )}
      {...props}
    />
  ),
)
Divider.displayName = 'Divider'
