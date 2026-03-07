'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase, type Group, type LeaderboardEntry } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'

export default function GrupoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }
      setCurrentUserId(session.user.id)

      const [{ data: grp }, { data: lb }] = await Promise.all([
        supabase.from('groups').select('*').eq('id', groupId).single(),
        supabase.from('leaderboard').select('*').eq('group_id', groupId).order('total_points', { ascending: false }),
      ])

      setGroup(grp)
      setLeaderboard(lb ?? [])
      setLoading(false)
    }
    load()
  }, [groupId, router])

  const copyCode = () => {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const medalEmoji = (pos: number) => {
    if (pos === 0) return '🥇'
    if (pos === 1) return '🥈'
    if (pos === 2) return '🥉'
    return `${pos + 1}`
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F0F4FF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-dvh bg-[#F0F4FF] flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Grupo no encontrado</p>
          <button onClick={() => router.push('/grupos')} className="text-[#003DA5] font-semibold">Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F0F4FF] pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-14 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.push('/grupos')} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <p className="text-white/60 text-xs tracking-widest">GRUPO</p>
            <h1 className="text-white font-bold text-xl leading-tight">{group.name}</h1>
          </div>
        </div>

        {/* Invite code card */}
        <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs mb-0.5">Código de invitación</p>
            <p className="text-white font-display text-3xl tracking-widest" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {group.invite_code}
            </p>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 bg-white/20 text-white text-sm font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Copiado
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10">
        {/* Quick action */}
        <button
          onClick={() => router.push(`/predicciones?grupo=${groupId}`)}
          className="w-full bg-[#E30613] text-white rounded-2xl p-4 text-left mb-4 active:scale-95 transition-transform shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-base">⚽ Cargar predicciones</p>
              <p className="text-white/70 text-xs mt-0.5">Predecí los resultados para este grupo</p>
            </div>
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
        </button>

        {/* Leaderboard */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <span>🏆</span> Tabla de posiciones
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-10 px-5">
              <span className="text-4xl block mb-3">📊</span>
              <p className="text-gray-500 text-sm">Todavía no hay predicciones cargadas. Los puntos van a aparecer cuando se jueguen los primeros partidos.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {leaderboard.map((entry, index) => {
                const isMe = entry.user_id === currentUserId
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 px-5 py-4 ${isMe ? 'bg-[#F0F4FF]' : ''}`}
                  >
                    {/* Position */}
                    <div className="w-8 text-center text-lg">
                      {typeof medalEmoji(index) === 'string' && medalEmoji(index).includes('🥇')
                        ? <span className="text-xl">{medalEmoji(index)}</span>
                        : <span className="text-gray-400 font-bold text-sm">{medalEmoji(index)}</span>
                      }
                    </div>

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${isMe ? 'ring-2 ring-[#003DA5]' : ''}`}
                      style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}>
                      {entry.avatar_url
                        ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-white font-bold text-sm">{(entry.full_name ?? 'U')[0]}</span>
                      }
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${isMe ? 'text-[#003DA5]' : 'text-gray-800'}`}>
                        {entry.full_name ?? 'Jugador'} {isMe && <span className="text-xs text-gray-400">(yo)</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-green-600">✅ {entry.exact_results}</span>
                        <span className="text-xs text-amber-500">🟡 {entry.partial_results}</span>
                        <span className="text-xs text-gray-400">❌ {entry.wrong_results}</span>
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <p className="font-display text-2xl text-[#003DA5]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                        {entry.total_points}
                      </p>
                      <p className="text-xs text-gray-400">pts</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="grupos" />
    </div>
  )
}
