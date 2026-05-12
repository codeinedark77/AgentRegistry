'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, Send, Bot, Clock,
  Sparkles, RotateCcw, ChevronDown, Activity
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { GlassCard }       from '@/components/ui/GlassCard'
import { Button }          from '@/components/ui/Button'
import { useWorkspaces }   from '@/hooks/useWorkspaces'
import { useAgents }       from '@/hooks/useAgents'
import { runAgent }        from '@/lib/api/agents'
import { formatMs, getModelGradient } from '@/lib/utils'
import type { AgentConfig } from '@/types'
import { useSearchParams } from 'next/navigation'

interface TaskResult {
  id:                string
  agent:             AgentConfig
  prompt:            string
  response:          string
  execution_time_ms: number
  timestamp:         Date
}

// THE GOD-MODE TERMINAL STREAMER
const TerminalStream = ({ modelName }: { modelName: string }) => {
  const [logs, setLogs] = useState<string[]>([])
  const bootSequence = [
    `[SYS] Initializing AgentCore instance: ${modelName}...`,
    `[NET] Establishing secure loop to FastAPI orchestrator...`,
    `[NLP] Tokenizing prompt vectors...`,
    `[TOOL] Scanning AgentRegistry for available Python tools...`,
    `[LLM] ReAct loop engaged. Awaiting inference engine...`,
    `[SYS] Analyzing environmental variables...`,
    `[NET] Compiling final response buffer...`
  ]

  useEffect(() => {
    let step = 0
    const interval = setInterval(() => {
      if (step < bootSequence.length) {
        setLogs(prev => [...prev, bootSequence[step]])
        step++
      }
    }, 800) // Adds a new log line every 800ms while waiting
    return () => clearInterval(interval)
  }, [modelName])

  return (
    <div className="font-mono text-[10px] text-cyan-400/70 space-y-1.5 p-3 bg-black/40 rounded-lg border border-cyan-500/20 w-full">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-cyan-500/20">
        <Activity className="h-3 w-3 animate-pulse text-cyan-400" />
        <span className="font-bold tracking-widest uppercase text-cyan-400">Agent Execution Terminal</span>
      </div>
      {logs.map((log, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}>
          <span className="text-white/30">{new Date().toISOString().split('T')[1].slice(0,8)}</span> {log}
        </motion.div>
      ))}
      <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }}>_</motion.div>
    </div>
  )
}

function TaskRunner() {
  const searchParams       = useSearchParams()
  const preselectedAgentId = searchParams.get('agentId')

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)
  const [selectedAgent,       setSelectedAgent]        = useState<AgentConfig | null>(null)
  const [prompt,              setPrompt]               = useState('')
  const [isRunning,           setIsRunning]            = useState(false)
  const [results,             setResults]              = useState<TaskResult[]>([])
  const [error,               setError]                = useState<string | null>(null)

  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const bottomRef    = useRef<HTMLDivElement>(null)

  const { data: workspaces = [] } = useWorkspaces()
  const activeWsId = selectedWorkspaceId ?? workspaces[0]?.id ?? null
  const { data: agents = [] } = useAgents(activeWsId)

  // Auto-select agent from query param
  useEffect(() => {
    if (preselectedAgentId && agents.length > 0) {
      const a = agents.find((x) => x.id === Number(preselectedAgentId))
      if (a) setSelectedAgent(a)
    }
  }, [preselectedAgentId, agents])

  // Auto-scroll to latest result
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [results, isRunning])

  async function handleRun() {
    if (!selectedAgent || !prompt.trim()) return
    setIsRunning(true)
    setError(null)
    const sentPrompt = prompt.trim()
    setPrompt('')

    try {
      const log = await runAgent(selectedAgent.id, sentPrompt)
      setResults((prev) => [
        ...prev,
        {
          id:                crypto.randomUUID(),
          agent:             selectedAgent,
          prompt:            sentPrompt,
          response:          log.response_text,
          execution_time_ms: log.execution_time_ms,
          timestamp:         new Date(),
        },
      ])
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
        'Task failed. Ensure Ollama and FastAPI are running.',
      )
      setPrompt(sentPrompt)   // Restore prompt on error
    } finally {
      setIsRunning(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleRun()
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white">
          Task Orchestrator
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Submit prompts to autonomous agents and monitor ReAct execution.
        </p>
      </motion.div>

      {/* ── Body ───────────────────────────────────────────────────── */}
      {/* THE FIX: Swapped fragile flexbox for a rock-solid CSS Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 overflow-hidden min-h-0 w-full">

        {/* ── Left panel — config (Spans 1 column out of 4) ──────────── */}
        <div className="col-span-1 flex flex-col gap-4 overflow-y-auto pr-1">
          <GlassCard className="p-4">
            <p className="mb-4 font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-white/30">
              Configuration
            </p>

            {/* Workspace */}
            <div className="mb-4 space-y-1.5">
              <label className="font-display text-[9px] uppercase tracking-widest text-white/25">
                Workspace
              </label>
              <div className="relative">
                <select
                  value={activeWsId ?? ''}
                  onChange={(e) => {
                    setSelectedWorkspaceId(Number(e.target.value))
                    setSelectedAgent(null)
                  }}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-3 pr-8 text-sm text-white focus:border-cyan-500/40 focus:outline-none"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id} className="bg-space-800 text-black">
                      {ws.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              </div>
            </div>

            {/* Agent list */}
            <div className="space-y-1.5">
              <label className="font-display text-[9px] uppercase tracking-widest text-white/25">
                Select Agent
              </label>
              <div className="space-y-1.5">
                {agents.map((agent) => {
                  const active = selectedAgent?.id === agent.id
                  const grad   = getModelGradient(agent.model_name)
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full rounded-xl border p-3 text-left transition-all duration-200 ${
                        active
                          ? 'border-cyan-500/35 bg-cyan-500/[0.07]'
                          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${grad}`}>
                          <Bot className="h-3 w-3 text-white" />
                        </div>
                        <span className="font-mono text-xs font-medium text-white">
                          {agent.model_name}
                        </span>
                      </div>
                      <p className="truncate font-mono text-[10px] text-white/30">
                        {agent.system_prompt}
                      </p>
                    </button>
                  )
                })}
                {agents.length === 0 && (
                  <p className="py-4 text-center font-mono text-[11px] text-white/25">
                    No agents in workspace.
                  </p>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Active agent details */}
          <AnimatePresence>
            {selectedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
              >
                <GlassCard glow="cyan" className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="font-display text-xs font-semibold text-white">
                      Active Agent
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-white/35">Model</span>
                      <span className="font-mono text-cyan-400">{selectedAgent.model_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/35">Temperature</span>
                      <span className="font-mono text-white">{selectedAgent.temperature}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/35">Agent ID</span>
                      <span className="font-mono text-white/50">#{selectedAgent.id}</span>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg bg-white/[0.04] p-2.5">
                    <p className="font-mono text-[10px] leading-relaxed text-white/40 line-clamp-3">
                      {selectedAgent.system_prompt}
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right panel — terminal (Spans 3 columns out of 4) ─────── */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-3 min-w-0 h-full">

          {/* Conversation window */}
          <GlassCard className="flex-1 overflow-y-auto p-5 flex flex-col">
            {results.length === 0 && !isRunning ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Terminal className="mb-4 h-12 w-12 text-white/10" />
                <p className="font-display text-sm text-white/30">
                  Select an agent and enter a prompt to begin orchestration.
                </p>
                <p className="mt-1 font-mono text-xs text-white/20">
                  ⌘ + Enter to submit
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {results.map((r) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-3"
                    >
                      {/* User */}
                      <div className="flex items-start gap-3 justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-white/[0.07] px-4 py-3 text-sm text-white/80">
                          {r.prompt}
                        </div>
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-[10px] font-bold text-white/60">
                          U
                        </div>
                      </div>

                      {/* Agent */}
                      <div className="flex items-start gap-3">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getModelGradient(r.agent.model_name)}`}>
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="max-w-[85%]">
                          <div className="rounded-2xl rounded-tl-sm border border-cyan-500/15 bg-cyan-500/[0.04] px-4 py-3 font-mono text-sm leading-relaxed text-white/75 whitespace-pre-wrap">
                            {r.response}
                          </div>
                          <div className="mt-2 flex items-center gap-3 font-mono text-[10px] text-white/25">
                            <Clock className="h-3 w-3" />
                            {formatMs(r.execution_time_ms)}
                            <span>·</span>
                            {r.agent.model_name}
                            <span>·</span>
                            {r.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* THE NEW GOD MODE TERMINAL */}
                {isRunning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-start gap-3 w-full"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${selectedAgent ? getModelGradient(selectedAgent.model_name) : 'from-cyan-500 to-cyan-400'}`}>
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="w-full max-w-[85%]">
                      <TerminalStream modelName={selectedAgent?.model_name || 'LLM'} />
                    </div>
                  </motion.div>
                )}

                <div ref={bottomRef} />
              </div>
            )}
          </GlassCard>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-red-500/30 bg-red-500/[0.07] px-4 py-3 font-mono text-xs text-red-400 shrink-0"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input bar */}
          <GlassCard className="p-3 shrink-0">
            <div className="flex gap-3">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={!selectedAgent || isRunning}
                placeholder={
                  selectedAgent
                    ? `Command ${selectedAgent.model_name}… (⌘ + Enter to execute)`
                    : 'Select an agent to begin…'
                }
                className="flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 backdrop-blur-xl focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed disabled:opacity-40"
              />
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleRun}
                  disabled={!selectedAgent || !prompt.trim() || isRunning}
                  loading={isRunning}
                  className="flex-1 px-4"
                >
                  {!isRunning && <Send className="h-4 w-4" />}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setResults([]); setError(null) }}
                  disabled={results.length === 0}
                  title="Clear chat history"
                  className="px-3"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex h-full items-center justify-center text-white/50 font-mono text-sm animate-pulse">
          Loading Orchestrator...
        </div>
      }>
        <TaskRunner />
      </Suspense>
    </DashboardLayout>
  )
}