'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CrearGrupoPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/auth/login'); return }

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: name.trim(), description: description.trim() || null, admin_id: session.user.id })
      .select()
      .single()

    if (groupError || !group) {
      setError('No se pudo crear el grupo. Intentá de nuevo.')
      setLoading(false)
      return
    }

    // Add creator as member
    await supabase.from('group_members').insert({ group_id: group.id, user_id: session.user.id })

    router.replace(`/grupos/${group.id}`)
  }

  return (
    <main className="min-h-dvh bg-[#F0F4FF]">
      <div className="bg-fifa-pattern px-5 pt-14 pb-12">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <p className="text-white/60 text-xs tracking-widest">GRUPOS</p>
            <h1 className="text-white font-display text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>CREAR GRUPO</h1>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase">Nombre del grupo *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Los Cracks de la Familia"
                required
                maxLength={50}
                className="w-full bg-[#F0F4FF] border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-800 text-base focus:outline-none focus:border-[#003DA5] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 tracking-wide uppercase">Descripción (opcional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Prode de la familia con $500 de apuesta"
                maxLength={150}
                rows={3}
                className="w-full bg-[#F0F4FF] border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-800 text-base focus:outline-none focus:border-[#003DA5] transition-colors resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="bg-[#F0F4FF] rounded-2xl p-4">
              <p className="text-gray-500 text-xs flex items-start gap-2">
                <span>💡</span>
                <span>Al crear el grupo, vas a obtener un <strong>código de invitación</strong> para compartir con tus amigos.</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creando...
                </span>
              ) : 'Crear grupo 🏆'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
