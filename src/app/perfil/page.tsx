'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Profile } from '@/lib/supabase'
import BottomNav from '@/components/layout/BottomNav'
import ThemeToggle from '@/components/layout/ThemeToggle'
import {
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  getSubscriptionStatus,
} from "@/lib/pushClient"

const PRESET_AVATARS = [
  '⚽', '🏆', '🦁', '🐯', '🦊', '🐺', '🦅', '🦋',
  '🔥', '⚡', '🌟', '💎', '🚀', '🎯', '👑', '🏅',
  '🇦🇷', '🇧🇷', '🇫🇷', '🇩🇪', '🇪🇸', '🇵🇹', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇲🇽',
]
const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg, #003DA5, #1A5FBF)', label: 'Azul FIFA' },
  { bg: 'linear-gradient(135deg, #E30613, #B30010)', label: 'Rojo' },
  { bg: 'linear-gradient(135deg, #16a34a, #15803d)', label: 'Verde' },
  { bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)', label: 'Violeta' },
  { bg: 'linear-gradient(135deg, #d97706, #b45309)', label: 'Dorado' },
  { bg: 'linear-gradient(135deg, #0891b2, #0e7490)', label: 'Celeste' },
  { bg: 'linear-gradient(135deg, #be185d, #9d174d)', label: 'Rosa' },
  { bg: 'linear-gradient(135deg, #374151, #1f2937)', label: 'Negro' },
]

type AvatarConfig = { type: 'emoji' | 'photo'; emoji?: string; color?: string; photoUrl?: string }

function parseAvatarConfig(avatarUrl: string | null | undefined): AvatarConfig {
  if (!avatarUrl) return { type: 'emoji', emoji: '⚽', color: AVATAR_COLORS[0].bg }
  if (avatarUrl.startsWith('avatar:')) {
    try { return JSON.parse(avatarUrl.slice(7)) } catch {}
    return { type: 'emoji', emoji: '⚽', color: AVATAR_COLORS[0].bg }
  }
  return { type: 'photo', photoUrl: avatarUrl }
}

function AvatarDisplay({ config, size = 96 }: { config: AvatarConfig; size?: number }) {
  if (config.type === 'photo' && config.photoUrl)
    return <img src={config.photoUrl} alt="" className="w-full h-full object-cover" />
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: config.color ?? AVATAR_COLORS[0].bg }}>
      <span style={{ fontSize: size * 0.45 }}>{config.emoji ?? '⚽'}</span>
    </div>
  )
}

type GroupRank = { group_id: string; group_name: string; rank: number; total_members: number; points: number }
type Stats = { total_points: number; exact: number; partial: number; wrong: number; total: number; best_streak: number }

export default function PerfilPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [groupRanks, setGroupRanks] = useState<GroupRank[]>([])
  const [notifStatus, setNotifStatus] = useState<'checking' | 'granted' | 'denied' | 'default'>('checking')
  const [notifLoading, setNotifLoading] = useState(false)
  const [showAvatarEditor, setShowAvatarEditor] = useState(false)
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>({ type: 'emoji', emoji: '⚽', color: AVATAR_COLORS[0].bg })
  const [selectedEmoji, setSelectedEmoji] = useState('⚽')
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0].bg)
  const [savingAvatar, setSavingAvatar] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/auth/login'); return }
      const userId = session.user.id

      const [{ data: profileData }, { data: predsData }, { data: memberships }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('predictions').select('points, matches:match_id(match_date, status)').eq('user_id', userId),
        supabase.from('group_members').select('group_id, groups:group_id(id, name)').eq('user_id', userId),
      ])

      setProfile(profileData)
      setName(profileData?.full_name ?? '')
      const parsed = parseAvatarConfig(profileData?.avatar_url)
      setAvatarConfig(parsed)
      if (parsed.emoji) setSelectedEmoji(parsed.emoji)
      if (parsed.color) setSelectedColor(parsed.color)

      const finished = (predsData ?? []).filter((p: any) => p.matches?.status === 'finished') as any[]
      let totalPts = 0, exact = 0, partial = 0, wrong = 0
      finished.forEach(p => {
        if (p.points === 3) { totalPts += 3; exact++ }
        else if (p.points === 1) { totalPts += 1; partial++ }
        else { wrong++ }
      })
      const sorted = [...finished].sort((a, b) => new Date(a.matches?.match_date ?? 0).getTime() - new Date(b.matches?.match_date ?? 0).getTime())
      let bestStreak = 0, curStreak = 0
      sorted.forEach(p => { if (p.points > 0) { curStreak++; bestStreak = Math.max(bestStreak, curStreak) } else { curStreak = 0 } })
      setStats({ total_points: totalPts, exact, partial, wrong, total: finished.length, best_streak: bestStreak })

      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map((m: any) => m.group_id)
        const { data: lbAll } = await supabase.from('leaderboard').select('group_id, user_id, total_points').in('group_id', groupIds)
        const ranks: GroupRank[] = memberships.map((m: any) => {
          const entries = (lbAll ?? []).filter((e: any) => e.group_id === m.group_id).sort((a: any, b: any) => b.total_points - a.total_points)
          const rank = entries.findIndex((e: any) => e.user_id === userId) + 1
          const mine = entries.find((e: any) => e.user_id === userId)
          return { group_id: m.group_id, group_name: (m.groups as any)?.name ?? 'Grupo', rank: rank || 0, total_members: entries.length, points: mine?.total_points ?? 0 }
        })
        setGroupRanks(ranks)
      }

      const perm = await getSubscriptionStatus()
      if (perm === 'granted') {
        const sub = await getCurrentSubscription()
        setNotifStatus(sub ? 'granted' : 'default')
      } else {
        setNotifStatus(perm)
      }

      setLoading(false)
    }
    load()
  }, [router])

  const handleSaveAvatar = async () => {
    if (!profile) return
    const newConfig: AvatarConfig = { type: 'emoji', emoji: selectedEmoji, color: selectedColor }
    const avatarUrl = 'avatar:' + JSON.stringify(newConfig)
    setSavingAvatar(true)
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id)
    setAvatarConfig(newConfig)
    setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev)
    setSavingAvatar(false)
    setShowAvatarEditor(false)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', profile.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  const handleNotifToggle = async () => {
    if (!profile) return
    setNotifLoading(true)
    try {
      if (notifStatus === 'granted') {
        const sub = await getCurrentSubscription()
        await unsubscribeFromPush()
        if (sub) await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: profile.id, subscription: sub.toJSON(), action: 'unsubscribe' }) })
        setNotifStatus('default')
      } else {
        const sub = await subscribeToPush()
        if (sub) {
          await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: profile.id, subscription: sub.toJSON() }) })
          setNotifStatus('granted')
        } else {
          const perm = await getSubscriptionStatus()
          setNotifStatus(perm === 'denied' ? 'denied' : 'default')
        }
      }
    } finally { setNotifLoading(false) }
  }

  if (loading) {
    return <div className="min-h-dvh flex items-center justify-center bg-app">
      <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
    </div>
  }

  const winPct = stats && stats.total > 0 ? Math.round(((stats.exact + stats.partial) / stats.total) * 100) : 0

  return (
    <div className="min-h-dvh bg-app pb-24">

      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-20 flex flex-col items-center relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -left-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative z-10 mb-3">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
            <AvatarDisplay config={avatarConfig} size={96} />
          </div>
          <button onClick={() => setShowAvatarEditor(true)}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md border-2 border-[#F0F4FF] active:scale-90 transition-transform">
            <svg className="w-4 h-4 text-[color:var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
        <h1 className="text-white font-bold text-xl relative z-10">{profile?.full_name ?? 'Mi perfil'}</h1>
        <p className="text-white/50 text-sm relative z-10">{profile?.email}</p>
      </div>

      {/* ── AVATAR EDITOR ─────────────────────────────────────── */}
      {showAvatarEditor && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowAvatarEditor(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative w-full bg-surface rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="font-bold text-gray-800 text-lg mb-4 text-center">Personalizar avatar</h2>
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#F0F4FF]">
                <AvatarDisplay config={{ type: 'emoji', emoji: selectedEmoji, color: selectedColor }} size={80} />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 tracking-widest mb-2">ELEGÍ UN ÍCONO</p>
            <div className="grid grid-cols-8 gap-2 mb-5">
              {PRESET_AVATARS.map(emoji => (
                <button key={emoji} onClick={() => setSelectedEmoji(emoji)}
                  className={`w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90 ${selectedEmoji === emoji ? 'bg-[#003DA5]/10 ring-2 ring-[#003DA5]' : 'bg-gray-100'}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-gray-400 tracking-widest mb-2">ELEGÍ UN COLOR</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {AVATAR_COLORS.map(({ bg, label }) => (
                <button key={bg} onClick={() => setSelectedColor(bg)}
                  className={`h-12 rounded-xl transition-all active:scale-90 ${selectedColor === bg ? 'ring-4 ring-[#003DA5] ring-offset-2' : ''}`}
                  style={{ background: bg }} title={label}>
                  {selectedColor === bg && (
                    <svg className="w-5 h-5 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button onClick={handleSaveAvatar} disabled={savingAvatar}
              className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}>
              {savingAvatar ? 'Guardando...' : 'Guardar avatar'}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 -mt-8 relative z-10 space-y-3">

        {/* ── ESTADÍSTICAS ──────────────────────────────────────── */}
        {stats && (
          <div className="rounded-3xl overflow-hidden shadow-sm"
            style={{ background: 'linear-gradient(150deg, #0a1f5c 0%, #003DA5 60%, #1A5FBF 100%)' }}>

            {/* Fila superior: puntos + racha */}
            <div className="px-5 pt-5 pb-3 flex items-start justify-between">
              <div>
                <p className="text-white/50 text-xs font-bold tracking-widest mb-1">MIS ESTADÍSTICAS</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white font-bold text-5xl leading-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {stats.total_points}
                  </span>
                  <span className="text-white/40 text-lg font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>PTS</span>
                </div>
                {stats.total > 0 && (
                  <p className="text-white/40 text-xs mt-1">{winPct}% de acierto · {stats.total} partidos jugados</p>
                )}
              </div>
              {stats.best_streak > 0 && (
                <div className="bg-white/10 border border-white/10 rounded-2xl px-3 py-2.5 text-center min-w-[64px]">
                  <span className="text-2xl leading-none block">🔥</span>
                  <p className="text-white font-bold text-2xl leading-tight mt-0.5" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{stats.best_streak}</p>
                  <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wide">racha</p>
                </div>
              )}
            </div>

            {/* Barra tricolor */}
            {stats.total > 0 && (
              <div className="px-5 pb-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                  {stats.exact > 0 && (
                    <div className="h-full rounded-full bg-green-400" style={{ width: `${(stats.exact / stats.total) * 100}%` }} />
                  )}
                  {stats.partial > 0 && (
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${(stats.partial / stats.total) * 100}%` }} />
                  )}
                  {stats.wrong > 0 && (
                    <div className="h-full rounded-full bg-white/20" style={{ width: `${(stats.wrong / stats.total) * 100}%` }} />
                  )}
                </div>
              </div>
            )}

            {/* Tiles: exactas / parciales / erróneas */}
            <div className="grid grid-cols-3 border-t border-white/10">
              {[
                { value: stats.exact,   label: 'Exactas',   emoji: '🎯', color: 'text-green-300', divider: false },
                { value: stats.partial, label: 'Parciales', emoji: '✅', color: 'text-amber-300', divider: true },
                { value: stats.wrong,   label: 'Erróneas',  emoji: '❌', color: 'text-white/40',  divider: true },
              ].map(({ value, label, emoji, color, divider }) => (
                <div key={label} className={`py-4 text-center ${divider ? 'border-l border-white/10' : ''}`}>
                  <p className={`font-bold text-2xl leading-tight ${color}`} style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{emoji} {label}</p>
                </div>
              ))}
            </div>

            {stats.total === 0 && (
              <div className="px-5 pb-5 pt-1 text-center">
                <p className="text-white/30 text-sm">Tus stats aparecen cuando arranque el Mundial 🌍</p>
              </div>
            )}
          </div>
        )}

        {/* ── RANKING POR GRUPO ─────────────────────────────────── */}
        {groupRanks.length > 0 && (
          <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-soft">
              <h2 className="font-bold text-[color:var(--color-text)] text-base flex items-center gap-2">🏆 Ranking por grupo</h2>
            </div>
            <div className="divide-y divide-soft">
              {groupRanks.map(gr => {
                const medal = gr.rank === 1 ? '🥇' : gr.rank === 2 ? '🥈' : gr.rank === 3 ? '🥉' : null
                return (
                  <button key={gr.group_id} onClick={() => router.push(`/grupos/${gr.group_id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 active:bg-surface-2 transition-colors text-left">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                      style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}>
                      {medal ?? <span className="text-white font-bold text-sm">#{gr.rank}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[color:var(--color-text)] text-sm truncate">{gr.group_name}</p>
                      <p className="text-[color:var(--color-muted)] text-xs">
                        {gr.rank > 0 ? `Puesto ${gr.rank} de ${gr.total_members}` : 'Sin predicciones aún'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[color:var(--color-primary)] text-xl leading-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{gr.points}</p>
                      <p className="text-xs text-[color:var(--color-muted)]">pts</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── EDITAR PERFIL ─────────────────────────────────────── */}
        <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-soft">
            <h2 className="font-bold text-[color:var(--color-text)] text-base">Editar perfil</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 tracking-widest uppercase">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
                className="w-full bg-surface-2 border-2 border-transparent rounded-2xl px-4 py-3.5 text-[color:var(--color-text)] focus:outline-none focus:border-[#003DA5] transition-colors" />
            </div>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #003DA5, #1A5FBF)' }}>
              {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* ── REGLAS (compacto, clickeable → /ayuda) ────────────── */}
        <button onClick={() => router.push('/ayuda')}
          className="w-full text-left bg-surface rounded-3xl shadow-sm overflow-hidden active:scale-95 transition-transform">
          <div className="px-5 pt-4 pb-3 border-b border-soft flex items-center justify-between">
            <h2 className="font-bold text-[color:var(--color-text)] text-base">📋 Reglas del prode</h2>
            <span className="text-[color:var(--color-primary)] text-xs font-semibold flex items-center gap-0.5">
              Ver todo
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
          {/* Pills de puntos */}
          <div className="px-5 pt-3 pb-2 flex gap-2">
            {[
              { pts: '3', label: 'Exacto',  bg: '#003DA5', text: 'white' },
              { pts: '1', label: 'Ganador', bg: '#F59E0B', text: 'white' },
              { pts: '0', label: 'Error',   bg: '#F3F4F6', text: '#9CA3AF' },
            ].map(({ pts, label, bg, text }) => (
              <div key={pts} className="flex-1 rounded-2xl py-2.5 text-center" style={{ background: bg }}>
                <p className="font-bold text-xl leading-tight" style={{ color: text, fontFamily: 'Bebas Neue, sans-serif' }}>{pts} pts</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: text }}>{label}</p>
              </div>
            ))}
          </div>
          <p className="px-5 pb-4 text-xs text-gray-400 flex items-center gap-1.5 mt-1">
            <span>⏰</span>
            Hasta <strong className="text-[color:var(--color-text-2)]">24hs antes</strong> de cada partido
          </p>
        </button>

        {/* ── NOTIFICACIONES ────────────────────────────────────── */}
        {notifStatus !== 'checking' && (
          <div className="bg-surface rounded-3xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center text-xl flex-shrink-0">🔔</div>
                <div>
                  <p className="font-bold text-[color:var(--color-text)] text-sm">Notificaciones</p>
                  <p className="text-xs text-[color:var(--color-muted)]">
                    {notifStatus === 'denied' ? 'Bloqueadas en este navegador'
                      : notifStatus === 'granted' ? 'Activadas'
                      : 'Desactivadas'}
                  </p>
                </div>
              </div>
              {notifStatus === 'denied' ? (
                <span className="text-xs text-red-400 font-semibold bg-red-50 px-2.5 py-1 rounded-lg">Bloqueadas</span>
              ) : (
                <button onClick={handleNotifToggle} disabled={notifLoading}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50 ${notifStatus === 'granted' ? 'bg-[#003DA5]' : 'bg-gray-200'}`}>
                  {notifLoading
                    ? <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </span>
                    : <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${notifStatus === 'granted' ? 'translate-x-6' : 'translate-x-0'}`} />
                  }
                </button>
              )}
            </div>
            {notifStatus === 'denied' && (
              <p className="mt-2.5 text-xs text-gray-400 leading-relaxed">
                Para habilitarlas, gestioná los permisos en la configuración del navegador.
              </p>
            )}
          </div>
        )}

        {/* ── APARIENCIA ────────────────────────────────────────── */}
        <div className="bg-surface rounded-3xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-surface-2 flex items-center justify-center text-xl flex-shrink-0">🎨</div>
              <div>
                <p className="font-bold text-[color:var(--color-text)] text-sm">Modo oscuro</p>
                <p className="text-xs text-[color:var(--color-muted)]">Cambia el tema de la app</p>
              </div>
            </div>
            <ThemeToggle variant="settings" />
          </div>
        </div>

        {/* ── CERRAR SESIÓN ─────────────────────────────────────── */}
        <button onClick={handleLogout}
          className="w-full py-4 rounded-2xl font-semibold text-[#E30613] border-2 border-[#E30613]/20 bg-surface active:scale-95 transition-transform">
          Cerrar sesión
        </button>

      </div>
      <BottomNav active="perfil" />
    </div>
  )
}
