'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'xs' | 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          // ── Base ──────────────────────────────────────────────────
          'relative inline-flex items-center justify-center gap-2 font-medium',
          'rounded-xl transition-all duration-200 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/40 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
          'disabled:pointer-events-none disabled:opacity-40',

          // ── Variants ──────────────────────────────────────────────
          variant === 'primary' && [
            'bg-gradient-to-r from-cyan-500 to-cyan-400 text-black',
            'shadow-[0_0_20px_rgba(0,245,255,0.35)]',
            'hover:from-cyan-400 hover:to-cyan-300',
            'hover:shadow-[0_0_30px_rgba(0,245,255,0.55)]',
            'active:scale-[0.97]',
          ],
          variant === 'secondary' && [
            'bg-white/[0.07] text-white/80 border border-white/12',
            'backdrop-blur-xl',
            'hover:bg-white/[0.11] hover:border-white/20 hover:text-white',
            'active:scale-[0.97]',
          ],
          variant === 'ghost' && [
            'text-white/50',
            'hover:bg-white/[0.06] hover:text-white/80',
            'active:scale-[0.97]',
          ],
          variant === 'danger' && [
            'bg-red-500/10 text-red-400 border border-red-500/25',
            'hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300',
            'active:scale-[0.97]',
          ],

          // ── Sizes ─────────────────────────────────────────────────
          size === 'xs' && 'h-7  px-2.5 text-xs',
          size === 'sm' && 'h-8  px-3   text-xs',
          size === 'md' && 'h-10 px-4   text-sm',
          size === 'lg' && 'h-12 px-6   text-base',

          className,
        )}
        {...props}
      >
        {loading && (
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
export { Button }