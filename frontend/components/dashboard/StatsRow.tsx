'use client'

import { motion } from 'framer-motion'
import { Bot, Layers, Cpu, Thermometer } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { StatCardSkeleton } from '@/components/ui/SkeletonCard'
import type { AgentConfig, Workspace } from '@/types'

interface StatsRowProps {
  agents:     AgentConfig[]
  workspaces: Workspace[]
  loading?:   boolean
}

export function StatsRow({ agents, workspaces, loading }: StatsRowProps) {
  const uniqueModels = new Set(agents.map((a) => a.model_name)).size
  const avgTemp      = agents.length
    ? (agents.reduce((s, a) => s + a.temperature, 0) / agents.length).toFixed(1)
    : '—'

  const stats = [
    {
      label:  'Total Agents',
      value:  agents.length,
      icon:   Bot,
      accent: 'text-cyan-400',
      bg:     'bg-cyan-500/10',
      glow:   'shadow-[0_0_20px_rgba(0,245,255,0.08)]',
    },
    {
      label:  'Workspaces',
      value:  workspaces.length,
      icon:   Layers,
      accent: 'text-purple-400',
      bg:     'bg-purple-500/10',
      glow:   'shadow-[0_0_20px_rgba(191,0,255,0.08)]',
    },
    {
      label:  'Unique Models',
      value:  uniqueModels,
      icon:   Cpu,
      accent: 'text-emerald-400',
      bg:     'bg-emerald-500/10',
      glow:   'shadow-[0_0_20px_rgba(0,255,136,0.08)]',
    },
    {
      label:  'Avg Temperature',
      value:  avgTemp,
      icon:   Thermometer,
      accent: 'text-orange-400',
      bg:     'bg-orange-500/10',
      glow:   'shadow-[0_0_20px_rgba(255,136,0,0.08)]',
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s, i) => {
        const Icon = s.icon
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
          >
            <GlassCard className={`flex items-center gap-4 p-4 ${s.glow}`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                <Icon className={`h-5 w-5 ${s.accent}`} />
              </div>
              <div>
                <p className="text-[11px] text-white/35 font-display uppercase tracking-widest">
                  {s.label}
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-white">
                  {s.value}
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )
      })}
    </div>
  )
}