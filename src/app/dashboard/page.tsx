'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Profile, type Group } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(prof)

      const { data: memberGroups } = await supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', session.user.id)

      const g = memberGroups?.map((m: any) => m.groups).filter(Boolean) ?? []
      setGroups(g)
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F0F4FF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Campeón'

  return (
    <div className="min-h-dvh bg-[#F0F4FF] pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-16 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -left-4 bottom-2 w-24 h-24 rounded-full bg-white/5" />
        <div className="flex items-center justify-between mb-1 relative z-10">
          <div>
            <p className="text-white/60 text-xs tracking-widest">BIENVENIDO</p>
            <h1 className="text-white text-2xl font-bold">{firstName} 👋</h1>
          </div>
          <button
            onClick={() => router.push('/perfil')}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30"
          >
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-lg">{firstName[0]}</span>
            }
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 mt-5 relative z-10">
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-xs mb-0.5">Grupos</p>
            <p className="text-white font-bold text-xl">{groups.length}</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-xs mb-0.5">Inicio</p>
            <p className="text-white font-bold text-sm leading-tight">11 Jun</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-xs mb-0.5">Partidos</p>
            <p className="text-white font-bold text-xl">72</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-6 relative z-10">
        {/* Groups section */}
        <div className="bg-white rounded-3xl shadow-sm p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg">Mis Grupos</h2>
            <button
              onClick={() => router.push('/grupos')}
              className="text-[#003DA5] text-sm font-semibold"
            >
              Ver todos
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-4xl block mb-3">👥</span>
              <p className="text-gray-500 text-sm mb-4">Todavía no estás en ningún grupo</p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/grupos/crear')}
                  className="flex-1 bg-[#003DA5] text-white py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                >
                  Crear grupo
                </button>
                <button
                  onClick={() => router.push('/grupos/unirse')}
                  className="flex-1 border-2 border-[#003DA5] text-[#003DA5] py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                >
                  Unirme
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 3).map((group) => (
                <button
                  key={group.id}
                  onClick={() => router.push(`/grupos/${group.id}`)}
                  className="w-full flex items-center justify-between bg-[#F0F4FF] rounded-2xl px-4 py-3.5 active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}
                    >
                      🏆
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">{group.name}</p>
                      <p className="text-gray-400 text-xs">Código: {group.invite_code}</p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => router.push('/grupos/crear')}
                  className="flex-1 bg-[#003DA5] text-white py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                >
                  + Crear grupo
                </button>
                <button
                  onClick={() => router.push('/grupos/unirse')}
                  className="flex-1 border-2 border-[#003DA5] text-[#003DA5] py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                >
                  Unirme
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick action: predicciones */}
        <button
          onClick={() => router.push('/predicciones')}
          className="w-full rounded-3xl p-5 text-left active:scale-95 transition-transform relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #E30613, #B30010)' }}
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-20">⚽</div>
          <p className="text-white/70 text-xs font-semibold tracking-widest mb-1">FASE DE GRUPOS</p>
          <h3 className="text-white font-bold text-xl mb-1">Cargá tus predicciones</h3>
          <p className="text-white/70 text-sm">72 partidos · Apertura 11 Jun 2026</p>
          <div className="flex items-center gap-1 mt-3">
            <span className="text-white text-sm font-semibold">Ver partidos</span>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Sistema de puntos */}
        <div className="bg-white rounded-3xl shadow-sm p-5 mt-4">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span>📋</span> Sistema de puntos
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#003DA5] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-display text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Resultado exacto</p>
                <p className="text-gray-400 text-xs">Predecís el marcador exacto (ej: 2-1 → 2-1)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
                <span className="text-white font-display text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Ganador / Empate</p>
                <p className="text-gray-400 text-xs">Acertás quién gana o si empatan, pero no el marcador</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 font-display text-lg" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>0</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Sin puntos</p>
                <p className="text-gray-400 text-xs">El resultado no coincide con tu predicción</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-amber-700 text-xs flex items-start gap-1.5">
              <span>⏰</span>
              <span>Podés cargar y editar predicciones hasta <strong>7 días antes</strong> de cada partido.</span>
            </p>
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
