'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Group } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'

export default function GruposPage() {
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      const { data } = await supabase
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', session.user.id)

      setGroups(data?.map((m: any) => m.groups).filter(Boolean) ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  return (
    <div className="min-h-dvh bg-[#F0F4FF] pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-12 relative">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <p className="text-white/60 text-xs tracking-widest">PRODE MUNDIAL</p>
            <h1 className="text-white font-display text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MIS GRUPOS</h1>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10">
        {/* Action buttons */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={() => router.push('/grupos/crear')}
            className="flex-1 bg-[#003DA5] text-white py-3.5 rounded-2xl font-semibold text-sm shadow-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Crear grupo
          </button>
          <button
            onClick={() => router.push('/grupos/unirse')}
            className="flex-1 bg-white border-2 border-[#003DA5] text-[#003DA5] py-3.5 rounded-2xl font-semibold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Unirme
          </button>
        </div>

        {/* Groups list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-3xl skeleton" />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center">
            <span className="text-5xl block mb-3">👥</span>
            <p className="font-bold text-gray-700 mb-2">Sin grupos todavía</p>
            <p className="text-gray-400 text-sm">Creá un grupo o usá un código para unirte al de tus amigos.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => router.push(`/grupos/${group.id}`)}
                className="w-full bg-white rounded-3xl p-5 text-left shadow-sm active:scale-98 transition-transform"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}>
                      🏆
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{group.name}</p>
                      {group.description && <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{group.description}</p>}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="bg-[#F0F4FF] text-[#003DA5] text-xs font-semibold px-2 py-0.5 rounded-full">
                          {group.invite_code}
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="grupos" />
    </div>
  )
}
