'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, User, Lock, Eye, EyeOff,
  AlertCircle, ArrowRight,
} from 'lucide-react'
import { Input }         from '@/components/ui/Input'
import { Button }        from '@/components/ui/Button'
import { GlassCard }     from '@/components/ui/GlassCard'
import { SceneBackground } from '@/components/layout/SceneBackground'
import {
  loginSchema, registerSchema,
  type LoginFormData, type RegisterFormData,
} from '@/lib/schemas'
import { loginUser, registerUser, getMe } from '@/lib/api/auth'
import { setAuthToken }  from '@/lib/api-client'
import { useAuthStore }  from '@/store/authStore'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const [mode,         setMode]         = useState<Mode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [apiError,     setApiError]     = useState<string | null>(null)
  const router  = useRouter()
  const { login } = useAuthStore()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(mode === 'login' ? loginSchema : registerSchema),
  })

  async function onSubmit(data: LoginFormData | RegisterFormData) {
    setApiError(null)
    try {
      if (mode === 'register') {
        await registerUser(data as RegisterFormData)
      }
      const token = await loginUser({
        username: data.username,
        password: data.password,
      })
      setAuthToken(token.access_token)
      const user = await getMe()
      login(token.access_token, user)
      router.push('/dashboard')
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        err?.response?.data?.error  ??
        'Authentication failed. Please try again.'
      setApiError(String(msg))
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setApiError(null)
    reset()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-space-950 p-4">
      <SceneBackground />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.94 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        {/* ── Brand mark ─────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0   }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 220 }}
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-glow-cyan-lg"
          >
            <Cpu className="h-8 w-8 text-black" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">
            AgentRegistry
          </h1>
          <p className="mt-1 text-xs text-white/35 tracking-widest uppercase font-display">
            Local Multi-Agent Orchestrator
          </p>
        </div>

        <GlassCard glow="cyan" className="p-7">
          {/* Mode tabs */}
          <div className="mb-7 flex rounded-xl bg-white/[0.05] p-1">
            {(['login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-lg py-2 font-display text-xs font-semibold capitalize tracking-widest transition-all duration-200 ${
                  mode === m
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y:  0, height: 'auto' }}
                exit={{   opacity: 0, y: -8, height: 0 }}
                className="mb-5 overflow-hidden"
              >
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-xs leading-relaxed text-red-400">{apiError}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Username"
              placeholder="your_username"
              icon={<User className="h-4 w-4" />}
              error={errors.username?.message}
              autoComplete="username"
              {...register('username')}
            />

            {/* Password with show/hide */}
            <div className="space-y-1.5">
              <label className="block font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-white/20 backdrop-blur-xl focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 transition-colors hover:text-white/60"
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4"    />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Role selector (register only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{   opacity: 0, height: 0 }}
                >
                  <div className="space-y-1.5">
                    <label className="block font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
                      Role
                    </label>
                    <select
                      {...(register as any)('role')}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-white focus:border-cyan-500/40 focus:outline-none"
                    >
                      <option value="standard" className="bg-space-800">Standard User</option>
                      <option value="admin"    className="bg-space-800">Administrator</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isSubmitting}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </GlassCard>

        <p className="mt-5 text-center font-display text-[10px] uppercase tracking-[0.15em] text-white/20">
          Open-source · MIT License · Local-first
        </p>
      </motion.div>
    </div>
  )
}