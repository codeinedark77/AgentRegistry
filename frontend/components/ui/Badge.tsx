'use client'

import { cn } from '@/lib/utils'
import type { TaskStatus } from '@/types'

type BadgeVariant = TaskStatus | 'admin' | 'standard' | 'default'

const VARIANTS: Record<BadgeVariant, { pill: string; dot: string }> = {
  pending:   { pill: 'bg-yellow-500/12  text-yellow-300  border-yellow-500/30',  dot: 'bg-yellow-400' },
  running:   { pill: 'bg-cyan-500/12    text-cyan-300    border-cyan-500/30',    dot: 'bg-cyan-400 animate-ping' },
  completed: { pill: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  failed:    { pill: 'bg-red-500/12     text-red-300     border-red-500/30',     dot: 'bg-red-400' },
  admin:     { pill: 'bg-purple-500/12  text-purple-300  border-purple-500/30',  dot: 'bg-purple-400' },
  standard:  { pill: 'bg-white/8        text-white/50    border-white/15',        dot: 'bg-white/40' },
  default:   { pill: 'bg-white/8        text-white/50    border-white/15',        dot: 'bg-white/40' },
}

interface BadgeProps {
  variant?:  BadgeVariant
  children:  React.ReactNode
  className?: string
  pulseDot?: boolean
}

export function Badge({ variant = 'default', children, className, pulseDot }: BadgeProps) {
  const v = VARIANTS[variant] ?? VARIANTS.default
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-xs font-medium tracking-wide',
        v.pill,
        className,
      )}
    >
      <span
        className={cn(
          'relative h-1.5 w-1.5 shrink-0 rounded-full',
          v.dot,
          pulseDot && 'after:absolute after:inset-0 after:rounded-full after:animate-ping after:bg-current after:opacity-50',
        )}
      />
      {children}
    </span>
  )
}