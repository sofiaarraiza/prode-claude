'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
      setName(data?.full_name ?? '')
      setLoading(false)
    }
    load()
  }, [router])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="min-h-dvh bg-[#F0F4FF] pb-24">
      <div className="bg-fifa-pattern px-5 pt-14 pb-20 flex flex-col items-center relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 mb-3 relative z-10" style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            : <span className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">{(profile?.full_name ?? 'U')[0]}</span>
          }
        </div>
        <h1 className="text-white font-bold text-xl relative z-10">{profile?.full_name ?? 'Mi perfil'}</h1>
        <p className="text-white/60 text-sm relative z-10">{profile?.email}</p>
      </div>

      <div className="px-5 -mt-8 relative z-10 space-y-4">
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">Editar perfil</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-[#F0F4FF] border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-[#003DA5] transition-colors"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}
            >
              {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* Sistema de puntos */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><span>📋</span> Reglas del prode</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#003DA5] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <div><strong>Resultado exacto:</strong> Acertás el marcador exacto del partido (ej: predecís 2-1 y sale 2-1)</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-400 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <div><strong>Ganador o empate:</strong> Acertás quién gana o que empatan, pero no el marcador exacto</div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded-lg bg-gray-200 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">0</span>
              <div><strong>Sin puntos:</strong> El resultado no coincide con tu predicción</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-2">
              <p className="text-amber-700 text-xs flex items-start gap-1.5">
                <span>⏰</span>
                <span>Podés cargar y modificar predicciones hasta <strong>7 días antes</strong> de cada partido. Pasada esa fecha, se bloquean.</span>
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <p className="text-gray-500 text-xs flex items-start gap-1.5">
                <span>💰</span>
                <span>El sistema de apuestas se organiza por fuera de la app. El ganador del grupo es quien más puntos acumule al final de la fase de grupos.</span>
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl font-semibold text-[#E30613] border-2 border-[#E30613] bg-white active:scale-95 transition-transform"
        >
          Cerrar sesión
        </button>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
