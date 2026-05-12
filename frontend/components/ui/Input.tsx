'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:  string
  error?:  string
  hint?:   string
  icon?:   React.ReactNode
  suffix?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, suffix, ...props }, ref) => (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block font-display text-xs font-medium uppercase tracking-widest text-white/40">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-xl',
            'border border-white/10 bg-white/[0.05] backdrop-blur-xl',
            'px-4 py-2.5 text-sm text-white placeholder:text-white/25',
            'transition-all duration-200',
            'focus:border-cyan-500/50 focus:bg-white/[0.07]',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/15',
            'disabled:cursor-not-allowed disabled:opacity-50',
            icon   && 'pl-10',
            suffix && 'pr-10',
            error  && 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/15',
            className,
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30">
            {suffix}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400/90">{error}</p>}
      {hint  && !error && <p className="text-xs text-white/30">{hint}</p>}
    </div>
  ),
)
Input.displayName = 'Input'
export { Input }