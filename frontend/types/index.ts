/**
 * AgentRegistry — Global TypeScript Type Definitions
 *
 * Single source of truth for every entity interface, enum, and utility type
 * used across the Next.js frontend. Import from "@/types" everywhere.
 *
 * Mirrors the Pydantic v2 schemas defined in:
 *   backend/app/schemas/
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ENUMS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Mirrors backend UserRole enum. */
export type UserRole = 'admin' | 'standard'

/** Mirrors backend TaskStatus enum — 4-state FSM. */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORE ENTITY INTERFACES
// Mirrors the Pydantic *Read schemas returned by the FastAPI backend.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Authenticated user profile. Returned by GET /auth/me and POST /auth/register. */
export interface User {
  id:         number
  username:   string
  role:       UserRole
  created_at: string   // ISO-8601 datetime string
}

/**
 * Workspace owned by a user.
 * Has a UniqueConstraint on (user_id, name).
 */
export interface Workspace {
  id:          number
  user_id:     number
  name:        string
  description: string | null
}

/**
 * Agent configuration record.
 * Has a CHECK constraint on temperature (0.0 – 2.0).
 */
export interface AgentConfig {
  id:            number
  workspace_id:  number
  model_name:    string
  system_prompt: string
  temperature:   number
}

/**
 * Task queue entry — 4-state FSM:
 * PENDING → RUNNING → COMPLETED | FAILED
 */
export interface TaskQueue {
  id:          number
  agent_id:    number
  prompt_text: string
  status:      TaskStatus
  created_at:  string
}

/**
 * Execution log — written after every successful Ollama call.
 * Has a UNIQUE constraint on task_id (1:1 with TaskQueue).
 */
export interface ExecutionLog {
  id:                number
  task_id:           number
  response_text:     string
  execution_time_ms: number
  timestamp:         string
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYTICS (3-TABLE JOIN RESPONSE)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * One row returned by GET /api/v1/analytics/model-report.
 *
 * Produced by a 3-table JOIN:
 *   agent_configs ⟕ task_queue ⟕ execution_logs
 * with GROUP BY model_name and aggregate functions.
 */
export interface ModelAnalyticsReport {
  model_name:            string
  total_tasks:           number
  completed_tasks:       number
  failed_tasks:          number
  success_rate: number;
  avg_execution_time_ms: number
  min_execution_time_ms: number
  max_execution_time_ms: number
}

/** Derived analytics not returned by API — computed client-side. */
export interface ModelAnalyticsReportEnriched extends ModelAnalyticsReport {
  pending_tasks:  number     // total - completed - failed
  success_rate:   number     // 0–100 percentage
  is_healthy:     boolean    // success_rate >= 80
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTHENTICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** JWT token response from POST /auth/token. */
export interface Token {
  access_token: string
  token_type:   'bearer'
}

/** Decoded JWT payload (client-side decode only — never trust without verification). */
export interface TokenPayload {
  sub:  string   // user.id as string
  role: UserRole
  exp:  number   // Unix timestamp
  iat:  number   // issued at
}

/** Request body for POST /auth/register. */
export interface RegisterRequest {
  username: string
  password: string
  role?:    UserRole
}

/** Request body for POST /auth/token (sent as form-urlencoded). */
export interface LoginRequest {
  username: string
  password: string
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REQUEST PAYLOADS (what we POST/PATCH to the API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CreateWorkspacePayload {
  name:         string
  description?: string
}

export interface UpdateWorkspacePayload {
  name?:         string
  description?:  string
}

export interface CreateAgentPayload {
  workspace_id:  number
  model_name:    string
  system_prompt: string
  temperature:   number
}

export interface UpdateAgentPayload {
  model_name?:    string
  system_prompt?: string
  temperature?:   number
}

export interface CreateTaskPayload {
  agent_id:    number
  prompt_text: string
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API ERROR ENVELOPE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Structured error returned by every FastAPI error handler.
 *
 * Shape: { "error": "NOT_FOUND", "detail": "AgentConfig with id=5 not found." }
 */
export interface ApiError {
  error:  ApiErrorCode
  detail: string
}

export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'INVALID_CREDENTIALS'
  | 'DUPLICATE_RESOURCE'
  | 'OLLAMA_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'UNPROCESSABLE_ENTITY'
  | 'INTERNAL_SERVER_ERROR'

/**
 * Axios error response shape — use this when catching errors from apiClient.
 */
export interface AxiosApiError {
  response?: {
    status: number
    data:   ApiError
  }
  message: string
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGINATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Standard query params for paginated list endpoints. */
export interface PaginationParams {
  skip?:  number   // offset (default: 0)
  limit?: number   // page size (default: 20, max: 100)
}

/** Agent list query params — extends pagination. */
export interface AgentListParams extends PaginationParams {
  workspace_id: number
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TASK RUNNER (client-side only — not from API)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** A completed task result held in Task Runner local state. */
export interface TaskResult {
  id:                string      // crypto.randomUUID() — client-side only
  agent:             AgentConfig
  prompt:            string
  response:          string
  execution_time_ms: number
  timestamp:         Date
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANALYTICS FILTER STATE (client-side only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Analytics page filter/sort state. */
export interface AnalyticsFilterState {
  search:       string
  statusFilter: 'all' | 'healthy' | 'degraded'
  workspaceId?: number
  sortBy:       keyof ModelAnalyticsReport
  sortDir:      'asc' | 'desc'
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMPONENT PROP UTILITY TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Standard children prop for layout wrappers. */
export interface WithChildren {
  children: React.ReactNode
}

/** Standard className prop. */
export interface WithClassName {
  className?: string
}

/** Combined layout component props. */
export type LayoutProps = WithChildren & WithClassName


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// OLLAMA MODEL REGISTRY (client-side reference)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Known Ollama model names used in the model selector dropdown. */
export const OLLAMA_MODELS = [
  'llama3',
  'llama3:8b',
  'llama3:70b',
  'llama2',
  'llama2:13b',
  'mistral',
  'mistral:7b',
  'gemma:2b',
  'gemma:7b',
  'phi3',
  'phi3:mini',
  'codellama',
  'codellama:13b',
  'deepseek-coder',
  'deepseek-coder:6.7b',
  'neural-chat',
  'starling-lm',
  'vicuna',
] as const

export type OllamaModelName = (typeof OLLAMA_MODELS)[number] | string


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// UTILITY / GENERIC TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Make specific keys of T required (opposite of Partial). */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Make specific keys of T optional. */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Flatten nested promise type. */
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T

/** Standard async mutation handler. */
export type AsyncHandler<T = void> = () => Promise<T>

/** ID-keyed record lookup. */
export type ById<T> = Record<number, T>