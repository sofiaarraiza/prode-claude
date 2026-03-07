'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
      <div className="min-h-dvh bg-fifa-pattern flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-dvh bg-fifa-pattern flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute bottom-1/4 right-8 w-24 h-24 rounded-full bg-fifa-red/20" />
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative z-10">
        {/* Trophy icon */}
        <div className="w-24 h-24 mb-6 flex items-center justify-center">
          <span className="text-8xl">🏆</span>
        </div>

        <p className="font-display text-white/70 text-xl tracking-[0.3em] mb-1">COPA DEL MUNDO</p>
        <h1
          className="text-white text-center leading-none mb-2"
          style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3.5rem, 16vw, 5rem)' }}
        >
          PRODE
        </h1>
        <p
          className="text-white text-center leading-none mb-8"
          style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.5rem, 12vw, 3.5rem)', color: '#C8A84B' }}
        >
          USA · CANADÁ · MÉXICO
        </p>

        <p className="text-white/60 text-center text-sm mb-10 max-w-xs leading-relaxed">
          Predicí los resultados de la Copa del Mundo 2026 y competí con tus amigos en grupos privados.
        </p>

        {/* CTA Buttons */}
        <div className="w-full max-w-xs space-y-3">
          <a
            href="/auth/login"
            className="flex items-center justify-center gap-3 w-full bg-white text-fifa-blue font-semibold py-4 px-6 rounded-2xl text-base shadow-lg active:scale-95 transition-transform"
            style={{ color: 'var(--fifa-blue)' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar con Google
          </a>

          <a
            href="/auth/login"
            className="flex items-center justify-center w-full border-2 border-white/30 text-white font-medium py-4 px-6 rounded-2xl text-base active:scale-95 transition-transform"
          >
            Entrar con Email
          </a>
        </div>
      </div>

      {/* Bottom info */}
      <div className="px-6 pb-10 relative z-10">
        <div className="flex items-center justify-center gap-8 text-white/50 text-xs">
          <div className="flex items-center gap-1.5">
            <span>⚽</span>
            <span>72 partidos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>👥</span>
            <span>Grupos privados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>🏅</span>
            <span>Tabla en vivo</span>
          </div>
        </div>
      </div>
    </main>
  )
}
