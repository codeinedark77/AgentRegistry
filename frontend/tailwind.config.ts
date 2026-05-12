import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Color Palette ──────────────────────────────────────────────────
      colors: {
        space: {
          950: '#020207',
          900: '#07070f',
          800: '#0d0d1a',
          700: '#131326',
          600: '#1c1c30',
        },
        neon: {
          cyan:   '#00f5ff',
          purple: '#bf00ff',
          green:  '#00ff88',
          orange: '#ff8800',
        },
      },
      // ── Background Images ──────────────────────────────────────────────
      backgroundImage: {
        'mesh-grid':
          'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        'radial-vignette':
          'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
        'card-surface':
          'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        'btn-primary':
          'linear-gradient(135deg, #00f5ff 0%, #00c8d8 100%)',
        'btn-primary-hover':
          'linear-gradient(135deg, #33f7ff 0%, #00e0f0 100%)',
      },
      // ── Box Shadows ────────────────────────────────────────────────────
      boxShadow: {
        'glass':         'inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.5)',
        'glass-lg':      'inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 48px rgba(0,0,0,0.6)',
        'glass-hover':   'inset 0 1px 0 rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.5)',
        'glow-cyan':     '0 0 20px rgba(0,245,255,0.35), 0 0 60px rgba(0,245,255,0.12)',
        'glow-cyan-lg':  '0 0 40px rgba(0,245,255,0.5), 0 0 100px rgba(0,245,255,0.18)',
        'glow-purple':   '0 0 20px rgba(191,0,255,0.3), 0 0 60px rgba(191,0,255,0.1)',
        'glow-green':    '0 0 20px rgba(0,255,136,0.3)',
        'inset-top':     'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      // ── Backdrop Blur ──────────────────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        '2.5xl': '28px',
        '4xl': '72px',
      },
      // ── Border Radius ──────────────────────────────────────────────────
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      // ── Typography ─────────────────────────────────────────────────────
      fontFamily: {
        // Syne — geometric, space-age feel for headings
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        // DM Sans — clean, modern for body text
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        // JetBrains Mono — for code/terminal aesthetics
        mono:    ['var(--font-jetbrains)', 'Fira Code', 'monospace'],
      },
      // ── Animations ─────────────────────────────────────────────────────
      animation: {
        'glow-pulse':     'glowPulse 2.5s ease-in-out infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'float-slow':     'float 8s ease-in-out infinite',
        'spin-slow':      'spin 12s linear infinite',
        'fade-in':        'fadeIn 0.4s ease-out forwards',
        'slide-up':       'slideUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
        'scale-in':       'scaleIn 0.2s ease-out forwards',
        'orb-1':          'orbDrift1 22s ease-in-out infinite',
        'orb-2':          'orbDrift2 28s ease-in-out infinite',
        'orb-3':          'orbDrift3 18s ease-in-out infinite alternate',
        'scan-line':      'scanLine 1.5s linear infinite',
        'progress-bar':   'progressBar 1.8s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(0,245,255,0.3), 0 0 40px rgba(0,245,255,0.08)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 40px rgba(0,245,255,0.6), 0 0 80px rgba(0,245,255,0.2)',
          },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':      { transform: 'translateY(-12px) rotate(0.5deg)' },
          '66%':      { transform: 'translateY(-6px) rotate(-0.5deg)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.93)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        orbDrift1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%':      { transform: 'translate(40px, -60px) scale(1.08)' },
          '50%':      { transform: 'translate(80px, 20px) scale(0.95)' },
          '75%':      { transform: 'translate(-20px, 40px) scale(1.04)' },
        },
        orbDrift2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '30%':      { transform: 'translate(-50px, 40px) scale(0.92)' },
          '60%':      { transform: 'translate(30px, -50px) scale(1.1)' },
        },
        orbDrift3: {
          '0%':   { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(60px, -40px) scale(1.15)' },
        },
        scanLine: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
        progressBar: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
    },
  },
  plugins: [],
}

export default config