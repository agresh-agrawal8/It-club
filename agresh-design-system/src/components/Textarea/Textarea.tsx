import React from 'react'
import { cn } from '../../lib/cn'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full resize-none border-b border-white/20 bg-transparent py-2 text-white placeholder:text-zinc-500 focus:border-violet-400 focus:outline-none transition-colors',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'
