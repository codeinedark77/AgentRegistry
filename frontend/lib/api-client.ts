import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios'
import Cookies from 'js-cookie'

// ── Constants ─────────────────────────────────────────────────────────────

const API_BASE_URL     = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
export const TOKEN_KEY = 'ar_token'   // "ar" = AgentRegistry

// ── Axios Instance ────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000,   // 2 min — Ollama calls can be slow
})

// ── Request Interceptor ────────────────────────────────────────────────────
// Injects the Bearer token on every request.

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_KEY)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response Interceptor ──────────────────────────────────────────────────
// Redirects to /login on any 401 response.

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login')
    ) {
      Cookies.remove(TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

// ── Token Helpers ──────────────────────────────────────────────────────────

export function setAuthToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, {
    expires:  1,              // 1 day
    sameSite: 'strict',
    secure:   process.env.NODE_ENV === 'production',
  })
}

export function removeAuthToken(): void {
  Cookies.remove(TOKEN_KEY)
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY)
}