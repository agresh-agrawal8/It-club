import React from 'react'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `primary` is the solid white CTA, `secondary` is the outlined variant, `link` is inline text. */
  variant?: ButtonVariant
  /** Padding/text scale. Ignored for `variant="link"`. */
  size?: ButtonSize
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-white text-zinc-950 hover:bg-amber-200',
  secondary:
    'bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-violet-400/50',
  link: 'bg-transparent text-white underline underline-offset-4 hover:text-violet-300 px-0 py-0',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-2xl font-medium tracking-tight transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40',
        variant !== 'link' && sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'
