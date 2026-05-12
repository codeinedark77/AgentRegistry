'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutGrid,
  BarChart3,
  Terminal,
  LogOut,
  Cpu,
  ChevronRight,
  Circle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const NAV = [
  { label: 'Command Center', href: '/dashboard', icon: LayoutGrid,  accent: 'text-cyan-400' },
  { label: 'Analytics',      href: '/analytics', icon: BarChart3,   accent: 'text-purple-400' },
  { label: 'Task Runner',    href: '/tasks',      icon: Terminal,    accent: 'text-emerald-400' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col',
        'border-r border-white/[0.07] bg-black/30 backdrop-blur-2xl',
      )}
    >
      {/* Right edge highlight */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.07] to-transparent" />

      {/* ── Brand ─────────────────────────────────────────────────────── */}
      <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-glow-cyan">
          <Cpu className="h-4 w-4 text-black" />
        </div>
        <div>
          <p className="font-display text-sm font-bold leading-none tracking-tight text-white">
            AgentRegistry
          </p>
          <p className="mt-0.5 text-[10px] text-white/30 tracking-widest uppercase">
            v1.0 Orchestrator
          </p>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-3 px-2 font-display text-[9px] font-semibold uppercase tracking-[0.2em] text-white/20">
          Navigation
        </p>
        <div className="space-y-0.5">
          {NAV.map(({ label, href, icon: Icon, accent }) => {
            const isActive = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5',
                  'text-sm transition-all duration-200',
                  isActive
                    ? 'text-white'
                    : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70',
                )}
              >
                {/* Active pill background */}
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-white/[0.07]"
                    transition={{ duration: 0.2, type: 'spring', bounce: 0.15 }}
                  />
                )}

                {/* Active left-edge indicator */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={cn(
                      'absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full',
                      accent === 'text-cyan-400'   && 'bg-cyan-400',
                      accent === 'text-purple-400' && 'bg-purple-400',
                      accent === 'text-emerald-400'&& 'bg-emerald-400',
                    )}
                    transition={{ duration: 0.2 }}
                  />
                )}

                <Icon
                  className={cn(
                    'relative h-4 w-4 shrink-0 transition-colors',
                    isActive ? accent : 'text-white/25 group-hover:text-white/50',
                  )}
                />
                <span className="relative flex-1 font-display text-xs font-medium tracking-wide">
                  {label}
                </span>
                {isActive && (
                  <ChevronRight className="relative h-3 w-3 text-white/20" />
                )}
              </Link>
            )
          })}
        </div>

        {/* ── Divider ──────────────────────────────────────────────── */}
        <div className="my-4 h-px bg-white/[0.06]" />

        {/* ── Ollama status pill ────────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
          <p className="mb-1.5 font-display text-[9px] uppercase tracking-[0.15em] text-white/25">
            Local Runtime
          </p>
          <div className="flex items-center gap-2">
            <Circle className="h-2 w-2 fill-emerald-400 text-emerald-400" />
            <span className="font-mono text-xs text-white/50">
              ollama:11434
            </span>
          </div>
        </div>
      </nav>

      {/* ── User Footer ───────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/20 font-display text-xs font-bold text-white">
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xs font-semibold text-white/80">
              {user?.username ?? 'Guest'}
            </p>
            <p className="text-[10px] capitalize text-white/30">{user?.role ?? 'standard'}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="rounded-lg p-1.5 text-white/20 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}