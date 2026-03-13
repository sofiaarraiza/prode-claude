'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trophy01, Users01, ClipboardCheck, BarChart01, HelpCircle, Calendar } from '@untitledui/icons'
import ThemeToggle from '@/components/layout/ThemeToggle'

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: '72 partidos',
    desc: 'Predecí todos los partidos de la fase de grupos y eliminatorias',
  },
  {
    icon: Users01,
    title: 'Grupos privados',
    desc: 'Competí con amigos, familia o el trabajo en grupos por invitación',
  },
  {
    icon: BarChart01,
    title: 'Tabla en vivo',
    desc: 'Seguí el ranking actualizado a medida que se juegan los partidos',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
      } else {
        setLoading(false)
      }
    }
    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-dvh page-gradient flex items-center justify-center">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-brand-200, #b2ccff)', borderTopColor: 'var(--color-brand-600, #003da5)' }}
        />
      </div>
    )
  }

  return (
    <main className="min-h-dvh page-gradient flex flex-col" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        {/* Public links */}
        <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl glass-pill">
          <a
            href="/partidos"
            className="w-8 h-8 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-btn"
            title="Partidos"
          >
            <Calendar width={17} height={17} className="glass-btn" />
          </a>
          <a
            href="/ayuda"
            className="w-8 h-8 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-btn"
            title="Ayuda"
          >
            <HelpCircle width={17} height={17} className="glass-btn" />
          </a>
        </div>

        {/* Theme toggle */}
        <div className="px-1.5 py-1.5 rounded-2xl glass-pill">
          <ThemeToggle variant="header" />
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pt-8 pb-6">

        {/* Icon */}
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{
            background: 'linear-gradient(135deg, #003da5 0%, #1a55bd 100%)',
            boxShadow: '0 8px 32px rgba(0,61,165,0.3)',
          }}
        >
          <Trophy01 width={36} height={36} style={{ color: 'white' }} />
        </div>

        {/* Label */}
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--color-gray-500, #717680)', letterSpacing: '0.18em' }}
        >
          Copa del Mundo 2026
        </p>

        {/* Title */}
        <h1
          className="text-center mb-2"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(2.5rem, 14vw, 3.5rem)',
            fontWeight: 900,
            color: 'var(--color-gray-900, #181d27)',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          Prode
        </h1>
        <p
          className="text-center font-bold mb-2"
          style={{
            fontSize: 'clamp(0.7rem, 3.2vw, 0.9rem)',
            color: 'var(--color-brand-600, #003da5)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          USA · CANADÁ · MÉXICO
        </p>

        <p
          className="text-center text-sm mb-8 max-w-xs leading-relaxed"
          style={{ color: 'var(--color-gray-500, #717680)' }}
        >
          Predecí los resultados, competí con tus amigos y seguí la tabla en tiempo real.
        </p>

        {/* CTA buttons */}
        <div className="w-full max-w-xs space-y-2.5">
          <a
            href="/auth/login"
            className="flex items-center justify-center gap-2.5 w-full py-3 px-6 rounded-xl text-sm font-semibold text-white active:opacity-80 transition-opacity"
            style={{ background: 'var(--color-brand-600, #003da5)', boxShadow: '0 2px 8px rgba(0,61,165,0.25)' }}
          >
            {/* Google logo — white monochrome */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar con Google
          </a>

          <a
            href="/auth/login"
            className="flex items-center justify-center w-full py-3 px-6 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity card-white"
            style={{
              border: '1px solid var(--color-gray-300, #d5d7da)',
              color: 'var(--color-gray-700, #414651)',
            }}
          >
            Entrar con Email
          </a>
        </div>

        {/* Public links hint */}
        <div className="flex items-center gap-4 mt-5">
          <a
            href="/partidos"
            className="flex items-center gap-1 text-xs font-medium active:opacity-70"
            style={{ color: 'var(--color-gray-500, #717680)' }}
          >
            <Calendar width={13} height={13} />
            Ver partidos
          </a>
          <span style={{ color: 'var(--color-gray-300, #d5d7da)' }}>·</span>
          <a
            href="/ayuda"
            className="flex items-center gap-1 text-xs font-medium active:opacity-70"
            style={{ color: 'var(--color-gray-500, #717680)' }}
          >
            <HelpCircle width={13} height={13} />
            Cómo funciona
          </a>
        </div>
      </div>

      {/* ── FEATURE LIST ─────────────────────────────────────────────────── */}
      <div className="px-5 pb-10">
        <div
          className="card-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-gray-200, #e9eaeb)', boxShadow: '0 1px 3px rgba(10,13,18,0.08)' }}
        >
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderTop: i > 0 ? '1px solid var(--color-gray-100, #f5f5f5)' : 'none' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-brand-50, #eff4ff)' }}
                >
                  <Icon width={17} height={17} style={{ color: 'var(--color-brand-600, #003da5)' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-gray-900, #181d27)' }}>
                    {f.title}
                  </p>
                  <p className="text-xs leading-snug" style={{ color: 'var(--color-gray-500, #717680)' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
