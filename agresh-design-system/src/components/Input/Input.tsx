import React from 'react'
import { cn } from '../../lib/cn'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full border-b border-white/20 bg-transparent py-2 text-white placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none transition-colors',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
