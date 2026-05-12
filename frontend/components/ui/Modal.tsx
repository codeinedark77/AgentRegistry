'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { cn } from '@/lib/utils'

interface ModalProps {
  open:         boolean
  onClose:      () => void
  title:        string
  description?: string
  size?:        'sm' | 'md' | 'lg'
  children:     React.ReactNode
}

const SIZE_MAP = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, description, size = 'md', children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* ── Backdrop ──────────────────────────────────────────── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* ── Panel ─────────────────────────────────────────────── */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.90, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.90, y: 24 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn('relative z-10 w-full', SIZE_MAP[size])}
          >
            <GlassCard glow="cyan" className="p-6">
              {/* Header */}
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-base font-semibold text-white">
                    {title}
                  </h2>
                  {description && (
                    <p className="mt-1 text-xs text-white/40">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="mt-0.5 shrink-0 rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/10 hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {children}
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}