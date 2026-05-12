'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bot, Thermometer, Trash2, Edit2, Play,
  MoreVertical, Zap, ChevronRight,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, getModelGradient, truncate } from '@/lib/utils'
import { useDeleteAgent } from '@/hooks/useAgents'
import type { AgentConfig } from '@/types'

interface AgentCardProps {
  agent:      AgentConfig
  onEdit?:    (agent: AgentConfig) => void
  onRun?:     (agent: AgentConfig) => void
  isRunning?: boolean
}

export function AgentCard({ agent, onEdit, onRun, isRunning = false }: AgentCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { mutate: del, isPending: isDeleting } = useDeleteAgent(agent.workspace_id)
  const gradient = getModelGradient(agent.model_name)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(isRunning && 'animate-glow-pulse')}
    >
      <GlassCard
        glow={isRunning ? 'cyan' : 'none'}
        className={cn(
          'group p-5 transition-all duration-300',
          'hover:bg-white/[0.065] hover:border-white/[0.15]',
          isRunning && 'border-cyan-500/30 bg-cyan-500/[0.04]',
        )}
      >
        {/* ── Running scan-line ──────────────────────────────────── */}
        {isRunning && (
          <div className="absolute inset-x-0 top-0 h-[2px] overflow-hidden rounded-t-2xl bg-black/20">
            <motion.div
              className="h-full w-1/4 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              animate={{ x: ['-100%', '500%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        )}

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Model avatar */}
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                'bg-gradient-to-br shadow-lg',
                gradient,
              )}
            >
              <Bot className="h-5 w-5 text-white drop-shadow" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-sm font-semibold text-white truncate">
                {agent.model_name}
              </h3>
              <p className="font-mono text-[10px] text-white/30">
                agent #{agent.id}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Badge variant={isRunning ? 'running' : 'completed'}>
              {isRunning ? 'Running' : 'Idle'}
            </Badge>

            {/* Kebab */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-lg p-1 text-white/25 transition-colors hover:bg-white/8 hover:text-white/60"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 z-20 min-w-[148px] overflow-hidden rounded-xl border border-white/10 bg-space-800 shadow-2xl backdrop-blur-2xl">
                    <button
                      onClick={() => { onEdit?.(agent); setMenuOpen(false) }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-white/60 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      Edit Config
                    </button>
                    <div className="h-px bg-white/[0.07]" />
                    <button
                      onClick={() => { del(agent.id); setMenuOpen(false) }}
                      disabled={isDeleting}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── System prompt preview ──────────────────────────────── */}
        <p className="mb-4 line-clamp-2 font-mono text-[11px] leading-relaxed text-white/35">
          {truncate(agent.system_prompt, 100)}
        </p>

        {/* ── Mini stats ────────────────────────────────────────── */}
        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
            <Thermometer className="h-3.5 w-3.5 text-orange-400/70" />
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-widest font-display">Temp</p>
              <p className="font-mono text-xs font-medium text-white">
                {agent.temperature.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
            <Zap className="h-3.5 w-3.5 text-cyan-400/70" />
            <div>
              <p className="text-[9px] text-white/25 uppercase tracking-widest font-display">WS</p>
              <p className="font-mono text-xs font-medium text-white">
                #{agent.workspace_id}
              </p>
            </div>
          </div>
        </div>

        {/* ── Action buttons ─────────────────────────────────────── */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onRun?.(agent)}
            loading={isRunning}
            disabled={isRunning}
          >
            {!isRunning && <Play className="h-3.5 w-3.5" />}
            {isRunning ? 'Running…' : 'Run Task'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="w-9 px-0"
            onClick={() => onEdit?.(agent)}
            title="Edit agent"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  )
}