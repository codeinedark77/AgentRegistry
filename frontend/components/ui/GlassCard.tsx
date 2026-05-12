'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?:       'cyan' | 'purple' | 'green' | 'none'
  hoverable?:  boolean
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, glow = 'none', hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // ── Base glass surface ─────────────────────────────────────
          'relative rounded-2xl',
          'bg-white/[0.04] backdrop-blur-2xl',
          'border border-white/[0.09]',
          'shadow-glass',
          // ── Glow variants ─────────────────────────────────────────
          glow === 'cyan'   && 'border-cyan-500/25   shadow-glow-cyan',
          glow === 'purple' && 'border-purple-500/25 shadow-glow-purple',
          glow === 'green'  && 'border-emerald-500/25 shadow-glow-green',
          // ── Hover behaviour ───────────────────────────────────────
          hoverable && [
            'cursor-pointer transition-all duration-300',
            'hover:bg-white/[0.07] hover:border-white/[0.14]',
            'hover:shadow-glass-hover hover:-translate-y-px',
          ],
          className,
        )}
        {...props}
      >
        {/* Inner top-edge highlight (gives the "glass lip" effect) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/18 to-transparent"
        />
        {children}
      </div>
    )
  },
)
GlassCard.displayName = 'GlassCard'
export { GlassCard }