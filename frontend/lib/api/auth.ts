import { apiClient, setAuthToken } from '../api-client'
import type { Token, User } from '@/types'

export interface LoginCredentials    { username: string; password: string }
export interface RegisterCredentials { username: string; password: string; role?: 'admin' | 'standard' }

export async function loginUser(creds: LoginCredentials): Promise<Token> {
  // FastAPI OAuth2 expects application/x-www-form-urlencoded
  const form = new URLSearchParams()
  form.append('username', creds.username)
  form.append('password', creds.password)

  const { data } = await apiClient.post<Token>('/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export async function registerUser(creds: RegisterCredentials): Promise<User> {
  const { data } = await apiClient.post<User>('/auth/register', creds)
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me')
  return data
}