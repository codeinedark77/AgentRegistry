'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, RefreshCw,
  ChevronDown, Layers, Bot,
} from 'lucide-react'
import { DashboardLayout }  from '@/components/layout/DashboardLayout'
import { AgentCard }        from '@/components/dashboard/AgentCard'
import { AddAgentModal }    from '@/components/dashboard/AddAgentModal'
import { StatsRow }         from '@/components/dashboard/StatsRow'
import { AgentCardSkeleton } from '@/components/ui/SkeletonCard'
import { Button }           from '@/components/ui/Button'
import { GlassCard }        from '@/components/ui/GlassCard'
import { useAgents }        from '@/hooks/useAgents'
import { useWorkspaces }    from '@/hooks/useWorkspaces'
import type { AgentConfig } from '@/types'
import { useRouter }        from 'next/navigation'

export default function DashboardPage() {
  const [modalOpen,          setModalOpen]          = useState(false)
  const [editingAgent,       setEditingAgent]        = useState<AgentConfig | null>(null)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)
  const [searchQuery,        setSearchQuery]         = useState('')
  const router = useRouter()

  const { data: workspaces = [], isLoading: wsLoading } = useWorkspaces()

  const activeWsId = selectedWorkspaceId ?? workspaces[0]?.id ?? null

  const {
    data: agents = [],
    isLoading: agentsLoading,
    refetch,
  } = useAgents(activeWsId)

  const filtered = agents.filter(
    (a) =>
      a.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.system_prompt.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  function handleEdit(agent: AgentConfig) {
    setEditingAgent(agent)
    setModalOpen(true)
  }

  function handleRun(agent: AgentConfig) {
    router.push(`/tasks?agentId=${agent.id}`)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingAgent(null)
  }

  const isLoading = wsLoading || agentsLoading

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── Page Header ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start justify-between"
        >
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-white">
              Command Center
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Manage agents, run tasks, and orchestrate your local LLMs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Sync
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setModalOpen(true)}
              disabled={!activeWsId}
            >
              <Plus className="h-4 w-4" />
              New Agent
            </Button>
          </div>
        </motion.div>

        {/* ── Stats ──────────────────────────────────────────────────── */}
        <StatsRow agents={agents} workspaces={workspaces} loading={isLoading} />

        {/* ── Toolbar ────────────────────────────────────────────────── */}
        <GlassCard className="flex flex-wrap items-center gap-3 p-3">
          {/* Workspace picker */}
          <div className="relative min-w-[200px]">
            <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <select
              value={activeWsId ?? ''}
              onChange={(e) => setSelectedWorkspaceId(Number(e.target.value))}
              disabled={wsLoading}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-9 pr-8 text-sm text-white backdrop-blur-xl focus:border-cyan-500/40 focus:outline-none disabled:opacity-50"
            >
              {workspaces.length === 0 && (
                <option value="" className="bg-space-800">No workspaces</option>
              )}
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id} className="bg-space-800">
                  {ws.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search by model name or system prompt…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/25 backdrop-blur-xl focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
            />
          </div>

          <span className="font-mono text-xs text-white/30">
            {filtered.length} agent{filtered.length !== 1 ? 's' : ''}
          </span>
        </GlassCard>

        {/* ── Agent Grid ─────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <AgentCardSkeleton key={i} />)}
          </div>

        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/[0.07] bg-white/[0.03]">
              <Bot className="h-10 w-10 text-white/10" />
            </div>
            <h3 className="font-display text-lg font-semibold text-white/40">
              {searchQuery ? 'No matching agents' : 'No agents yet'}
            </h3>
            <p className="mt-2 text-sm text-white/25">
              {searchQuery
                ? 'Try a different search term.'
                : 'Create your first agent to get started.'}
            </p>
            {!searchQuery && activeWsId && (
              <Button
                variant="primary"
                size="md"
                className="mt-6"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create First Agent
              </Button>
            )}
          </motion.div>

        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onEdit={handleEdit}
                  onRun={handleRun}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────── */}
      {activeWsId && (
        <AddAgentModal
          open={modalOpen}
          onClose={handleModalClose}
          workspaceId={activeWsId}
          editingAgent={editingAgent}
        />
      )}

      {/* ── FAB ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!modalOpen && activeWsId && filtered.length > 0 && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{   scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setModalOpen(true)}
            className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-cyan-400 shadow-glow-cyan-lg transition-shadow hover:shadow-[0_0_60px_rgba(0,245,255,0.7)]"
          >
            <Plus className="h-6 w-6 text-black" />
          </motion.button>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}