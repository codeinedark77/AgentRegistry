'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { removeAuthToken, setAuthToken } from '@/lib/api-client'
import type { User } from '@/types'

interface AuthState {
  user:            User | null
  token:           string | null
  isAuthenticated: boolean
  login:           (token: string, user: User) => void
  logout:          () => void
  setUser:         (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      token:           null,
      isAuthenticated: false,

      login: (token, user) => {
        setAuthToken(token)
        set({ token, user, isAuthenticated: true })
      },

      logout: () => {
        removeAuthToken()
        set({ token: null, user: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name:       'ar-auth',
      storage:    createJSONStorage(() => localStorage),
      partialize: (s) => ({
        token:           s.token,
        user:            s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
)