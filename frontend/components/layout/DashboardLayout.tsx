'use client'

import { motion } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { SceneBackground } from './SceneBackground'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-space-950">
      <SceneBackground />
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 pl-[260px]"
      >
        <div className="min-h-screen px-8 py-8">
          {children}
        </div>
      </motion.main>
    </div>
  )
}