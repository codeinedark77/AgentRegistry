/**
 * AgentRegistry — Frontend Utility Library
 *
 * All pure helper functions used across the Next.js application.
 * Import from "@/lib/utils" everywhere — never inline these.
 *
 * Sections:
 * 1. Class name merging
 * 2. Number & time formatting
 * 3. String utilities
 * 4. Model / status colour maps
 * 5. Analytics enrichment
 * 6. Date & time helpers
 * 7. General-purpose helpers
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ModelAnalyticsReport, ModelAnalyticsReportEnriched, TaskStatus } from '@/types'


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. CLASS NAME MERGING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Merge Tailwind CSS class names safely, resolving all conflicts.
 *
 * Combines clsx (conditional class handling) with tailwind-merge
 * (deduplication of conflicting Tailwind utilities, e.g. p-2 + p-4 → p-4).
 *
 * @example
 * cn('px-4 py-2', isActive && 'bg-cyan-500', 'px-6')
 * // → 'py-2 bg-cyan-500 px-6'
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. NUMBER & TIME FORMATTING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Format milliseconds to a human-readable duration string.
 *
 * @example
 * formatMs(450)   // → "450ms"
 * formatMs(1820)  // → "1.82s"
 * formatMs(62500) // → "62.5s"
 */
export function formatMs(ms: number): string {
  if (!isFinite(ms) || ms < 0) return '—'
  if (ms < 1_000)  return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1_000).toFixed(2)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = ((ms % 60_000) / 1_000).toFixed(0)
  return `${minutes}m ${seconds}s`
}

/**
 * Format a part/total ratio as a percentage string.
 *
 * @example
 * formatPercent(38, 42)  // → "90%"
 * formatPercent(0, 0)    // → "0%"
 */
export function formatPercent(part: number, total: number): string {
  if (total === 0 || !isFinite(total)) return '0%'
  return `${Math.round((part / total) * 100)}%`
}

/**
 * Compute a success rate as a 0–100 integer.
 *
 * @example
 * successRate(38, 42)  // → 90
 */
export function successRate(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Format a large integer with locale-aware thousands separators.
 *
 * @example
 * formatNumber(1234567)  // → "1,234,567"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

/**
 * Clamp a number between a minimum and maximum value.
 *
 * @example
 * clamp(150, 0, 100)  // → 100
 * clamp(-5,  0, 100)  // → 0
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. STRING UTILITIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Truncate a string to a maximum length, appending an ellipsis.
 *
 * @example
 * truncate("Hello, world!", 8)  // → "Hello, w…"
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return ''
  if (str.length <= maxLength) return str
  return `${str.slice(0, maxLength)}…`
}

/**
 * Capitalise the first character of a string.
 *
 * @example
 * capitalise('admin')    // → "Admin"
 * capitalise('standard') // → "Standard"
 */
export function capitalise(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert a snake_case or kebab-case string to Title Case.
 *
 * @example
 * toTitleCase('avg_execution_time_ms')  // → "Avg Execution Time Ms"
 */
export function toTitleCase(str: string): string {
  return str
    .replace(/[_-]/g, ' ')
    .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1))
}

/**
 * Generate initials from a username or display name (max 2 chars).
 *
 * @example
 * getInitials('admin_upjaoo')  // → "AU"
 * getInitials('dev_arjun')     // → "DA"
 */
export function getInitials(name: string): string {
  return name
    .split(/[_\s-]/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. MODEL & STATUS COLOUR MAPS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Model name → Tailwind gradient class (used for AgentCard avatars).
 * Each model family gets a distinct visual identity.
 */
const MODEL_GRADIENT_MAP: Record<string, string> = {
  llama:      'from-cyan-500    to-blue-500',
  mistral:    'from-violet-500  to-purple-600',
  gemma:      'from-emerald-500 to-teal-500',
  phi:        'from-orange-500  to-amber-500',
  codellama:  'from-blue-600    to-indigo-600',
  deepseek:   'from-sky-500     to-cyan-600',
  neural:     'from-pink-500    to-rose-500',
  starling:   'from-yellow-500  to-orange-500',
  vicuna:     'from-lime-500    to-green-500',
  default:    'from-cyan-500    to-violet-500',
}

/**
 * Return the Tailwind gradient class for a given Ollama model name.
 * Falls back to the default gradient for unknown models.
 *
 * @example
 * getModelGradient('llama3:8b')  // → "from-cyan-500 to-blue-500"
 * getModelGradient('mistral')    // → "from-violet-500 to-purple-600"
 */
export function getModelGradient(modelName: string): string {
  const lower = modelName.toLowerCase()
  const key   = Object.keys(MODEL_GRADIENT_MAP).find(
    (k) => k !== 'default' && lower.includes(k),
  )
  return MODEL_GRADIENT_MAP[key ?? 'default']
}

/**
 * Return a hex colour code for Recharts charts, deterministic per model.
 *
 * @example
 * getModelChartColor('llama3')   // → "#00f5ff"
 */
const CHART_PALETTE = [
  '#00f5ff', // cyan
  '#a855f7', // purple
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#06b6d4', // sky
]

const _modelColorCache = new Map<string, string>()

export function getModelChartColor(modelName: string): string {
  if (_modelColorCache.has(modelName)) return _modelColorCache.get(modelName)!
  const idx   = _modelColorCache.size % CHART_PALETTE.length
  const color = CHART_PALETTE[idx]
  _modelColorCache.set(modelName, color)
  return color
}

/**
 * TaskStatus → Tailwind text colour class.
 *
 * @example
 * getStatusTextColor('completed')  // → "text-emerald-400"
 * getStatusTextColor('failed')     // → "text-red-400"
 */
export function getStatusTextColor(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending:   'text-yellow-400',
    running:   'text-cyan-400',
    completed: 'text-emerald-400',
    failed:    'text-red-400',
  }
  return map[status] ?? 'text-white/50'
}

/**
 * TaskStatus → Tailwind background colour class (for badge pills).
 *
 * @example
 * getStatusBgColor('running')  // → "bg-cyan-500/12"
 */
export function getStatusBgColor(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    pending:   'bg-yellow-500/12  border-yellow-500/30',
    running:   'bg-cyan-500/12    border-cyan-500/30',
    completed: 'bg-emerald-500/12 border-emerald-500/30',
    failed:    'bg-red-500/12     border-red-500/30',
  }
  return map[status] ?? 'bg-white/8 border-white/15'
}

/**
 * 0–100 success rate → health label for analytics filtering.
 *
 * ≥80%  → 'healthy'
 * <80%  → 'degraded'
 * 0     → 'inactive'
 */
export function getHealthLabel(
  rate: number,
): 'healthy' | 'degraded' | 'inactive' {
  if (rate === 0)   return 'inactive'
  if (rate >= 80)   return 'healthy'
  return 'degraded'
}

/**
 * Health label → Tailwind colour class.
 */
export function getHealthColor(
  label: ReturnType<typeof getHealthLabel>,
): string {
  const map = {
    healthy:  'text-emerald-400',
    degraded: 'text-orange-400',
    inactive: 'text-white/30',
  }
  return map[label]
}

/**
 * Success rate → progress bar colour class.
 */
export function getProgressBarColor(rate: number): string {
  if (rate >= 80) return 'bg-emerald-400'
  if (rate >= 50) return 'bg-orange-400'
  return 'bg-red-400'
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. ANALYTICS ENRICHMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Enrich a ModelAnalyticsReport with client-side computed fields.
 *
 * Adds:
 * - pending_tasks  (total - completed - failed)
 * - success_rate   (0–100 integer)
 * - is_healthy     (success_rate ≥ 80)
 */
export function enrichAnalyticsRow(
  row: ModelAnalyticsReport,
): ModelAnalyticsReportEnriched {
  const rate = successRate(row.completed_tasks, row.total_tasks)
  return {
    ...row,
    pending_tasks: Math.max(0, row.total_tasks - row.completed_tasks - row.failed_tasks),
    success_rate:  rate,
    is_healthy:    rate >= 80,
  }
}

/**
 * Enrich a full analytics report array.
 */
export function enrichAnalyticsReport(
  rows: ModelAnalyticsReport[],
): ModelAnalyticsReportEnriched[] {
  return rows.map(enrichAnalyticsRow)
}

/**
 * Filter analytics rows by the user's search + status filter.
 */
export function filterAnalyticsRows(
  rows:         ModelAnalyticsReportEnriched[],
  search:       string,
  statusFilter: 'all' | 'healthy' | 'degraded',
): ModelAnalyticsReportEnriched[] {
  let result = rows

  if (search.trim()) {
    const q = search.toLowerCase()
    result  = result.filter((r) => r.model_name.toLowerCase().includes(q))
  }

  if (statusFilter === 'healthy') {
    result = result.filter((r) => r.is_healthy)
  } else if (statusFilter === 'degraded') {
    result = result.filter((r) => !r.is_healthy)
  }

  return result
}

/**
 * Sort analytics rows by a numeric column key.
 */
export function sortAnalyticsRows(
  rows:    ModelAnalyticsReportEnriched[],
  key:     keyof ModelAnalyticsReport,
  dir:     'asc' | 'desc',
): ModelAnalyticsReportEnriched[] {
  return [...rows].sort((a, b) => {
    const va = a[key] as number
    const vb = b[key] as number
    return dir === 'asc' ? va - vb : vb - va
  })
}

/**
 * Compute global summary metrics from a full analytics report.
 */
export function computeAnalyticsSummary(rows: ModelAnalyticsReport[]): {
  totalTasks:     number
  totalCompleted: number
  totalFailed:    number
  globalAvgMs:    number
  activeModels:   number
  overallRate:    number
} {
  const totalTasks     = rows.reduce((s, r) => s + r.total_tasks,     0)
  const totalCompleted = rows.reduce((s, r) => s + r.completed_tasks, 0)
  const totalFailed    = rows.reduce((s, r) => s + r.failed_tasks,    0)
  const globalAvgMs    = rows.length
    ? rows.reduce((s, r) => s + r.avg_execution_time_ms, 0) / rows.length
    : 0

  return {
    totalTasks,
    totalCompleted,
    totalFailed,
    globalAvgMs,
    activeModels: rows.length,
    overallRate:  successRate(totalCompleted, totalTasks),
  }
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. DATE & TIME HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Format an ISO-8601 string or Date to a short human-readable string.
 *
 * @example
 * formatDate('2024-06-15T14:32:00Z')  // → "15 Jun 2024, 14:32"
 */
export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day:    '2-digit',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Format an ISO-8601 string to a time-only string (HH:MM:SS).
 *
 * @example
 * formatTime('2024-06-15T14:32:07Z')  // → "14:32:07"
 */
export function formatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

/**
 * Return a relative time string (e.g. "3 minutes ago", "just now").
 *
 * @example
 * timeAgo(new Date(Date.now() - 5 * 60 * 1000))  // → "5 minutes ago"
 */
export function timeAgo(date: Date | string): string {
  const d       = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1_000)

  if (seconds < 10)    return 'just now'
  if (seconds < 60)    return `${seconds}s ago`
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h ago`
  return `${Math.floor(seconds / 86_400)}d ago`
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. GENERAL-PURPOSE HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Debounce a function — delays invocation until after `delay` ms
 * have elapsed since the last call. Useful for search inputs.
 *
 * @example
 * const debouncedSearch = debounce(handleSearch, 300)
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn:    T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * Sleep for a given number of milliseconds (useful in async flows).
 *
 * @example
 * await sleep(500)  // wait 500ms
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Safely parse a JSON string, returning null on failure.
 *
 * @example
 * safeJsonParse<User>('{"id":1}')  // → { id: 1 }
 * safeJsonParse('not json')         // → null
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

/**
 * Group an array by a key selector function.
 *
 * @example
 * groupBy(agents, (a) => a.model_name)
 * // → { llama3: [...], mistral: [...] }
 */
export function groupBy<T>(
  arr: T[],
  key: (item: T) => string,
): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item)
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}

/**
 * Extract a human-readable error message from an Axios error or unknown.
 *
 * @example
 * getErrorMessage(err)  // → "AgentConfig with id=5 not found."
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error

  if (
    error !== null &&
    typeof error === 'object' &&
    'response' in error
  ) {
    const axiosErr = error as { response?: { data?: { detail?: string } } }
    const detail   = axiosErr.response?.data?.detail
    if (typeof detail === 'string') return detail
  }

  if (error instanceof Error) return error.message

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Generate a random UUID (v4) using the browser's crypto API.
 * Falls back gracefully in environments where crypto is unavailable.
 */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback (non-cryptographic)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Check if the browser is running on a mobile viewport.
 * Used for responsive behaviour in non-CSS contexts.
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}