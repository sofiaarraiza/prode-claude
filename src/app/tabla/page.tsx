'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Group, type LeaderboardEntry } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'

export default function TablaPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }
      setUserId(session.user.id)

      const { data: memberData } = await supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', session.user.id)

      const g = memberData?.map((m: any) => m.groups).filter(Boolean) ?? []
      setGroups(g)
      if (g.length > 0) setSelectedGroup(g[0].id)
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (!selectedGroup) return
    const load = async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('group_id', selectedGroup)
        .order('total_points', { ascending: false })
      setLeaderboard(data ?? [])
    }
    load()
  }, [selectedGroup])

  const maxPoints = leaderboard[0]?.total_points ?? 1

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F0F4FF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#F0F4FF] pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-8 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <p className="text-white/60 text-xs tracking-widest mb-1 relative z-10">COPA DEL MUNDO 2026</p>
        <h1 className="text-white font-display text-3xl mb-5 relative z-10" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          TABLA DE POSICIONES
        </h1>

        {groups.length > 0 && (
          <select
            value={selectedGroup}
            onChange={e => setSelectedGroup(e.target.value)}
            className="w-full bg-white/20 text-white rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none appearance-none relative z-10"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'white\' viewBox=\'0 0 20 20\'%3E%3Cpath fill-rule=\'evenodd\' d=\'M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '16px' }}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id} style={{ color: '#003DA5', background: 'white' }}>{g.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="px-5 -mt-3 relative z-10">
        {leaderboard.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center shadow-sm">
            <span className="text-5xl block mb-3">📊</span>
            <p className="font-bold text-gray-700 mb-2">Sin datos todavía</p>
            <p className="text-gray-400 text-sm">Los puntos van a aparecer cuando comiencen los partidos.</p>
          </div>
        ) : (
          <>
            {/* Top 3 podio */}
            {leaderboard.length >= 3 && (
              <div className="flex items-end justify-center gap-3 mb-6 pt-2">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 mb-1" style={{ background: 'linear-gradient(135deg, #888, #aaa)' }}>
                    {leaderboard[1]?.avatar_url
                      ? <img src={leaderboard[1].avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-white font-bold">{(leaderboard[1]?.full_name ?? 'U')[0]}</span>
                    }
                  </div>
                  <p className="text-xs font-semibold text-gray-600 max-w-[70px] text-center truncate">{leaderboard[1]?.full_name?.split(' ')[0]}</p>
                  <div className="w-16 bg-gray-200 rounded-t-xl flex items-center justify-center py-2 mt-1">
                    <span className="font-display text-gray-600 text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{leaderboard[1]?.total_points}</span>
                  </div>
                  <div className="w-16 h-6 bg-gray-300 rounded-b flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-600">🥈 2°</span>
                  </div>
                </div>

                {/* 1st */}
                <div className="flex flex-col items-center -mt-4">
                  <span className="text-2xl mb-1">👑</span>
                  <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-[#C8A84B] mb-1" style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)', borderWidth: '3px', borderColor: '#C8A84B' }}>
                    {leaderboard[0]?.avatar_url
                      ? <img src={leaderboard[0].avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-white font-bold text-lg">{(leaderboard[0]?.full_name ?? 'U')[0]}</span>
                    }
                  </div>
                  <p className="text-sm font-bold text-gray-800 max-w-[80px] text-center truncate">{leaderboard[0]?.full_name?.split(' ')[0]}</p>
                  <div className="w-20 bg-[#003DA5] rounded-t-xl flex items-center justify-center py-3 mt-1">
                    <span className="font-display text-white text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{leaderboard[0]?.total_points}</span>
                  </div>
                  <div className="w-20 h-7 rounded-b flex items-center justify-center" style={{ background: '#C8A84B' }}>
                    <span className="text-xs font-bold text-white">🥇 1°</span>
                  </div>
                </div>

                {/* 3rd */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-600 mb-1" style={{ background: 'linear-gradient(135deg, #b45309, #d97706)' }}>
                    {leaderboard[2]?.avatar_url
                      ? <img src={leaderboard[2].avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center text-white font-bold">{(leaderboard[2]?.full_name ?? 'U')[0]}</span>
                    }
                  </div>
                  <p className="text-xs font-semibold text-gray-600 max-w-[70px] text-center truncate">{leaderboard[2]?.full_name?.split(' ')[0]}</p>
                  <div className="w-16 bg-amber-200 rounded-t-xl flex items-center justify-center py-1.5 mt-1">
                    <span className="font-display text-amber-700 text-xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{leaderboard[2]?.total_points}</span>
                  </div>
                  <div className="w-16 h-6 bg-amber-400 rounded-b flex items-center justify-center">
                    <span className="text-xs font-bold text-white">🥉 3°</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full table */}
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-[#F8FAFF] border-b border-gray-100 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span className="col-span-1">#</span>
                <span className="col-span-5">Jugador</span>
                <span className="col-span-2 text-center">🎯</span>
                <span className="col-span-2 text-center">🟡</span>
                <span className="col-span-2 text-right">Pts</span>
              </div>
              <div className="divide-y divide-gray-50">
                {leaderboard.map((entry, index) => {
                  const isMe = entry.user_id === userId
                  return (
                    <div
                      key={entry.user_id}
                      className={`grid grid-cols-12 gap-2 px-5 py-3.5 items-center ${isMe ? 'bg-blue-50' : ''}`}
                    >
                      <span className={`col-span-1 text-sm font-bold ${index < 3 ? 'text-[#C8A84B]' : 'text-gray-400'}`}>
                        {index + 1}
                      </span>
                      <div className="col-span-5 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}>
                          {entry.avatar_url
                            ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                            : <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{(entry.full_name ?? 'U')[0]}</span>
                          }
                        </div>
                        <span className={`text-sm font-semibold truncate ${isMe ? 'text-[#003DA5]' : 'text-gray-700'}`}>
                          {entry.full_name?.split(' ')[0] ?? 'Jugador'}
                        </span>
                      </div>
                      <span className="col-span-2 text-center text-sm text-gray-500">{entry.exact_results}</span>
                      <span className="col-span-2 text-center text-sm text-gray-500">{entry.partial_results}</span>
                      <span className="col-span-2 text-right font-display text-xl text-[#003DA5]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                        {entry.total_points}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
              <span>🎯 = Resultados exactos</span>
              <span>🟡 = Solo ganador</span>
            </div>
          </>
        )}
      </div>

      <BottomNav active="tabla" />
    </div>
  )
}
