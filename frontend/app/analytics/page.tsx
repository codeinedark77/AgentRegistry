'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import {
  Search, BarChart3, TrendingUp,
  Clock, CheckCircle, XCircle, Filter, ChevronUp, ChevronDown as ChevDown,
} from 'lucide-react'
import { DashboardLayout }  from '@/components/layout/DashboardLayout'
import { GlassCard }        from '@/components/ui/GlassCard'
import { TableRowSkeleton } from '@/components/ui/SkeletonCard'
import { useModelAnalytics } from '@/hooks/useAnalytics'
import { useWorkspaces }    from '@/hooks/useWorkspaces'
import { formatMs, formatPercent } from '@/lib/utils'
import type { ModelAnalyticsReport } from '@/types'

const BAR_PALETTE = ['#00f5ff','#a855f7','#10b981','#f59e0b','#ef4444','#3b82f6','#ec4899']

// ── Custom Recharts Tooltip ───────────────────────────────────────────────
function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-space-800/95 px-4 py-3 shadow-2xl backdrop-blur-2xl">
      <p className="mb-2 font-display text-xs font-semibold text-white">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-white/50">{entry.name}:</span>
          <span className="font-mono text-white">
            {typeof entry.value === 'number' && entry.name.includes('ms')
              ? formatMs(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Sortable column header ────────────────────────────────────────────────
function ColHeader({
  label, col, sortBy, sortDir, onSort,
}: {
  label: string
  col: keyof ModelAnalyticsReport
  sortBy: keyof ModelAnalyticsReport
  sortDir: 'asc' | 'desc'
  onSort: (col: keyof ModelAnalyticsReport) => void
}) {
  const active = sortBy === col
  return (
    <th
      onClick={() => onSort(col)}
      className="cursor-pointer select-none whitespace-nowrap px-5 py-4 text-left"
    >
      <span className={`inline-flex items-center gap-1 font-display text-[10px] font-semibold uppercase tracking-widest transition-colors ${active ? 'text-cyan-400' : 'text-white/30 hover:text-white/60'}`}>
        {label}
        {active
          ? sortDir === 'asc'
            ? <ChevronUp   className="h-3 w-3" />
            : <ChevDown    className="h-3 w-3" />
          : <span className="h-3 w-3 opacity-30">↕</span>
        }
      </span>
    </th>
  )
}

export default function AnalyticsPage() {
  const [search,      setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'degraded'>('all')
  const [wsFilter,    setWsFilter]    = useState<number | undefined>(undefined)
  const [sortBy,      setSortBy]      = useState<keyof ModelAnalyticsReport>('avg_execution_time_ms')
  const [sortDir,     setSortDir]     = useState<'asc' | 'desc'>('asc')

  const { data: workspaces = [] }          = useWorkspaces()
  const { data: report = [], isLoading, isError } = useModelAnalytics(wsFilter)

  // ── Filter + sort pipeline ──────────────────────────────────────────
  const tableData = useMemo(() => {
    let rows = [...report]

    if (search) {
      rows = rows.filter((r) =>
        r.model_name.toLowerCase().includes(search.toLowerCase()),
      )
    }

    if (statusFilter === 'healthy') {
      rows = rows.filter((r) => r.success_rate >= 80)
    } else if (statusFilter === 'degraded') {
      rows = rows.filter((r) => r.success_rate < 80)
    }
    rows.sort((a, b) => {
      const va = a[sortBy] as number
      const vb = b[sortBy] as number
      return sortDir === 'asc' ? va - vb : vb - va
    })

    return rows
  }, [report, search, statusFilter, sortBy, sortDir])

  function toggleSort(col: keyof ModelAnalyticsReport) {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('asc') }
  }

  // ── Summary metrics ─────────────────────────────────────────────────
  const totalTasks     = report.reduce((s, r) => s + r.total_tasks,     0)
  const totalCompleted = report.reduce((s, r) => s + r.completed_tasks, 0)
  const globalAvgMs    = report.length
    ? report.reduce((s, r) => s + r.avg_execution_time_ms, 0) / report.length
    : 0

  const summaryCards = [
    { label: 'Total Tasks',   value: totalTasks,                          icon: BarChart3,    accent: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
    { label: 'Success Rate',  value: formatPercent(totalCompleted, totalTasks), icon: CheckCircle,  accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Global Avg',    value: formatMs(Math.round(globalAvgMs)),   icon: Clock,        accent: 'text-orange-400',  bg: 'bg-orange-500/10' },
    { label: 'Active Models', value: report.length,                       icon: TrendingUp,   accent: 'text-purple-400',  bg: 'bg-purple-500/10' },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold tracking-tight text-white">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Aggregated 3-table JOIN report —{' '}
            <span className="font-mono text-white/30 text-xs">
              agent_configs × task_queue × execution_logs
            </span>
          </p>
        </motion.div>

        {/* ── Summary cards ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {summaryCards.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <GlassCard className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
                    <Icon className={`h-5 w-5 ${s.accent}`} />
                  </div>
                  <div>
                    <p className="font-display text-[10px] uppercase tracking-widest text-white/35">{s.label}</p>
                    <p className="mt-0.5 font-display text-2xl font-bold text-white">{s.value}</p>
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        {/* ── Bar Chart ──────────────────────────────────────────────── */}
        {report.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <GlassCard className="p-6">
              <p className="mb-6 font-display text-xs font-semibold uppercase tracking-widest text-white/40">
                Avg Execution Time per Model (ms)
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={tableData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="model_name"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.30)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatMs(v)}
                  />
                  <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(255,255,255,0.025)' }} />
                  <Bar dataKey="avg_execution_time_ms" name="avg_ms" radius={[6, 6, 0, 0]}>
                    {tableData.map((_, idx) => (
                      <Cell key={idx} fill={BAR_PALETTE[idx % BAR_PALETTE.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </motion.div>
        )}

        {/* ── Filter bar ─────────────────────────────────────────────── */}
        <GlassCard className="flex flex-wrap items-center gap-3 p-3">
          {/* Workspace scope */}
          <select
            value={wsFilter ?? ''}
            onChange={(e) =>
              setWsFilter(e.target.value ? Number(e.target.value) : undefined)
            }
            className="appearance-none rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white focus:border-cyan-500/40 focus:outline-none"
          >
            <option value="" className="bg-space-800">All Workspaces</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-space-800">{ws.name}</option>
            ))}
          </select>

          {/* Model search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Filter by model name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/25 focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-white/25 mr-1" />
            {(['all', 'healthy', 'degraded'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 font-display text-[10px] font-semibold uppercase tracking-widest transition-all ${
                  statusFilter === s
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-white/35 hover:text-white/55 hover:bg-white/[0.04]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* ── Data table ─────────────────────────────────────────────── */}
        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.07]">
                  <ColHeader label="Model"        col="model_name"           sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <ColHeader label="Total"        col="total_tasks"          sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <ColHeader label="Completed"    col="completed_tasks"      sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <ColHeader label="Failed"       col="failed_tasks"         sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <ColHeader label="Avg (ms)"     col="avg_execution_time_ms" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <ColHeader label="Min / Max"    col="min_execution_time_ms" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                  <ColHeader label="Success Rate" col="success_rate" sortBy={sortBy} sortDir={sortDir} onSort={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-red-400/60">
                      Failed to load report. Run some tasks first to generate data.
                    </td>
                  </tr>
                ) : tableData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-white/25">
                      No data matches your filters.
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, i) => {
                    const rate      = row.success_rate || 0
                    const isHealthy = rate >= 80

                    return (
                      <motion.tr
                        key={row.model_name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.025]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: BAR_PALETTE[i % BAR_PALETTE.length] }}
                            />
                            <span className="font-mono text-xs font-medium text-white">
                              {row.model_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-white/50">
                          {row.total_tasks}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-emerald-400">
                          {row.completed_tasks}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-red-400">
                          {row.failed_tasks}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-medium text-cyan-400">
                          {formatMs(Math.round(row.avg_execution_time_ms))}
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-white/35">
                          {formatMs(row.min_execution_time_ms)} / {formatMs(row.max_execution_time_ms)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.08]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${rate}%` }}
                                transition={{ delay: i * 0.04 + 0.3, duration: 0.7, ease: 'easeOut' }}
                                className={`h-full rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-orange-400'}`}
                              />
                            </div>
                            <span className={`font-mono text-xs font-semibold ${isHealthy ? 'text-emerald-400' : 'text-orange-400'}`}>
                              {rate}%
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {tableData.length > 0 && (
            <div className="border-t border-white/[0.07] px-5 py-3">
              <p className="font-display text-[10px] uppercase tracking-widest text-white/20">
                {tableData.length} model{tableData.length !== 1 ? 's' : ''} — Data sourced via 3-table JOIN
              </p>
            </div>
          )}
        </GlassCard>
      </div>
    </DashboardLayout>
  )
}