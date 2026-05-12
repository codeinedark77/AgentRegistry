import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider } from '@/providers/QueryProvider'

export const metadata: Metadata = {
  title:       'AgentRegistry — Multi-Agent Orchestrator',
  description: 'Manage, monitor, and execute local LLMs via Ollama.',
  themeColor:  '#020207',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-space-950 text-white antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}