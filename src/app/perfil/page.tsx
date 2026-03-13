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
import {
  Edit01,
  Trophy01,
  Bell01,
  BellOff01,
  LogOut01,
  ChevronRight,
  Moon01,
  UserCircle,
  HelpCircle,
} from "@untitledui/icons"

const PRESET_AVATARS = [
  '⚽', '🏆', '🦁', '🐯', '🦊', '🐺', '🦅', '🦋',
  '🔥', '⚡', '🌟', '💎', '🚀', '🎯', '👑', '🏅',
  '🇦🇷', '🇧🇷', '🇫🇷', '🇩🇪', '🇪🇸', '🇵🇹', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🇲🇽',
]
const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg, #003da5, #1a55bd)', label: 'Azul FIFA' },
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
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [usernameError, setUsernameError] = useState('')
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
      setUsername(profileData?.username ?? '')
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
    setUsernameError('')
    const trimmedUsername = username.trim().toLowerCase().replace(/^@/, '')
    if (trimmedUsername && !/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
      setUsernameError('Solo letras, números y guión bajo. Entre 3 y 20 caracteres.')
      return
    }
    setSaving(true)
    const updates: any = { full_name: name.trim() }
    if (trimmedUsername) updates.username = trimmedUsername
    const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (error?.code === '23505') {
      setUsernameError('Ese username ya está en uso.')
      setSaving(false)
      return
    }
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
    return (
      <div className="min-h-dvh flex items-center justify-center page-gradient">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#003da5", borderTopColor: "transparent" }} />
      </div>
    )
  }

  const winPct = stats && stats.total > 0 ? Math.round(((stats.exact + stats.partial) / stats.total) * 100) : 0
  const firstName = profile?.full_name?.split(" ")[0] ?? "Perfil"

  // ── Level badge ──────────────────────────────────────────────────────
  const getLevel = () => {
    const pts = stats?.total_points ?? 0
    const streak = stats?.best_streak ?? 0
    const onStreak = streak >= 3
    if (pts === 0)   return { emoji: "✨", label: "Novato",      bg: "rgba(100,116,139,0.12)", color: "var(--color-gray-600, #535862)" }
    if (pts < 10)   return { emoji: onStreak ? "🔥" : "🌱", label: onStreak ? "En racha" : "Aprendiz",   bg: "rgba(22,163,74,0.1)",   color: "#16a34a" }
    if (pts < 30)   return { emoji: onStreak ? "🔥" : "⚡", label: onStreak ? "En racha" : "En forma",    bg: "rgba(217,119,6,0.1)",   color: "#d97706" }
    if (pts < 60)   return { emoji: "🔥",   label: "Adivino",    bg: "rgba(234,88,12,0.12)",  color: "#ea580c" }
    if (pts < 100)  return { emoji: "🏆",   label: "Experto",    bg: "rgba(0,61,165,0.1)",    color: "var(--color-brand-700, #003da5)" }
    return           { emoji: "👑",   label: "Leyenda",    bg: "rgba(124,58,237,0.12)", color: "#7c3aed" }
  }
  const level = getLevel()

  return (
    <div className="min-h-dvh pb-24 page-gradient" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        className="relative px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: 20,
        }}
      >
        {/* Top bar: back + actions */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-pill"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#374151" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl glass-pill"
          >
            <ThemeToggle variant="header" />
            <button
              onClick={() => router.push("/ayuda")}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-btn"
            >
              <HelpCircle className="glass-btn" width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Avatar centrado + nombre */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div
              className="rounded-full overflow-hidden"
              style={{ width: 80, height: 80, border: "3px solid rgba(255,255,255,0.9)", boxShadow: "0 4px 16px rgba(0,61,165,0.15)" }}
            >
              <AvatarDisplay config={avatarConfig} size={80} />
            </div>
            <button
              onClick={() => setShowAvatarEditor(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "var(--color-brand-600, #003da5)", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
            >
              <Edit01 width={12} height={12} style={{ color: "white" }} />
            </button>
          </div>

          <div className="text-center">
            <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 800, color: "var(--color-gray-900, #181d27)", lineHeight: 1.2 }}>
              {profile?.full_name ?? "Mi perfil"}
            </h1>
            {profile?.username && (
              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-gray-500, #717680)" }}>@{profile.username}</p>
            )}
            {/* Level badge */}
            <div className="flex justify-center mt-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: level.bg, color: level.color }}
              >
                {level.emoji} {level.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── AVATAR EDITOR MODAL ──────────────────────────────────────────── */}
      {showAvatarEditor && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowAvatarEditor(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full rounded-t-3xl p-5 pb-10 max-h-[85vh] overflow-y-auto"
            style={{ background: "var(--color-surface)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "var(--color-gray-200, #e9eaeb)" }} />
            <h2 className="font-bold text-lg mb-4 text-center" style={{ color: "var(--color-gray-900, #181d27)" }}>Personalizar avatar</h2>
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full overflow-hidden" style={{ border: "3px solid var(--color-brand-100, #d1e0ff)" }}>
                <AvatarDisplay config={{ type: 'emoji', emoji: selectedEmoji, color: selectedColor }} size={80} />
              </div>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>Elegí un ícono</p>
            <div className="grid grid-cols-8 gap-2 mb-5">
              {PRESET_AVATARS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => setSelectedEmoji(emoji)}
                  className="w-full aspect-square rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90"
                  style={{
                    background: selectedEmoji === emoji ? "var(--color-brand-50, #eff4ff)" : "var(--color-gray-100, #f5f5f5)",
                    outline: selectedEmoji === emoji ? "2px solid #003da5" : "none",
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>Elegí un color</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {AVATAR_COLORS.map(({ bg, label }) => (
                <button
                  key={bg}
                  onClick={() => setSelectedColor(bg)}
                  className="h-12 rounded-xl transition-all active:scale-90"
                  style={{ background: bg, outline: selectedColor === bg ? "3px solid #003da5" : "none", outlineOffset: 2 }}
                  title={label}
                >
                  {selectedColor === bg && (
                    <svg className="w-5 h-5 text-white mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={handleSaveAvatar}
              disabled={savingAvatar}
              className="w-full py-3.5 rounded-2xl font-semibold text-white text-base active:scale-95 transition-transform disabled:opacity-50"
              style={{ background: "#003da5" }}
            >
              {savingAvatar ? 'Guardando...' : 'Guardar avatar'}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 relative z-10 space-y-4">

        {/* ── EDITAR PERFIL ─────────────────────────────────────────────── */}
        <div className="card-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.1)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}>
            <UserCircle width={14} height={14} style={{ color: "var(--color-gray-400, #a4a7ae)", flexShrink: 0 }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>Editar perfil</span>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gray-500, #717680)" }}>Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full rounded-xl px-4 py-3 text-sm transition-colors focus:outline-none"
                style={{
                  background: "var(--color-gray-50, #fafafa)",
                  border: "1px solid var(--color-gray-200, #e9eaeb)",
                  color: "var(--color-gray-900, #181d27)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gray-500, #717680)" }}>Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setUsernameError('') }}
                  placeholder="tu_username"
                  className="w-full rounded-xl pl-8 pr-4 py-3 text-sm transition-colors focus:outline-none"
                  style={{
                    background: "var(--color-gray-50, #fafafa)",
                    border: `1px solid ${usernameError ? "#ef4444" : "var(--color-gray-200, #e9eaeb)"}`,
                    color: "var(--color-gray-900, #181d27)",
                  }}
                />
              </div>
              {usernameError && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{usernameError}</p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white active:opacity-80 transition-opacity disabled:opacity-50"
              style={{ background: "var(--color-brand-600, #003da5)" }}
            >
              {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* ── ESTADÍSTICAS ──────────────────────────────────────────────── */}
        {stats && (
          <div className="card-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.1)" }}>
            <div className="px-4 pt-3.5 pb-1 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>Mis estadísticas</p>
              {stats.total > 0 && (
                <span className="text-xs font-medium" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>{winPct}% de acierto</span>
              )}
            </div>

            {stats.total === 0 ? (
              <div className="px-4 py-8 flex flex-col items-center gap-2 text-center">
                <span style={{ fontSize: 32 }}>🏆</span>
                <p className="text-sm font-semibold" style={{ color: "var(--color-gray-700, #414651)" }}>¡El torneo no empezó!</p>
                <p className="text-xs" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>Tus estadísticas aparecen cuando se jueguen los primeros partidos el 11 Jun.</p>
              </div>
            ) : (
              <>
                {/* Points + streak */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between" style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-gray-500, #717680)" }}>Puntos totales</p>
                    <div className="flex items-baseline gap-1.5">
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 42, fontWeight: 800, color: "var(--color-gray-900, #181d27)", lineHeight: 1 }}>
                        {stats.total_points}
                      </span>
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 700, color: "var(--color-gray-400, #a4a7ae)" }}>pts</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>{stats.total} partidos jugados</p>
                  </div>
                  {stats.best_streak > 0 && (
                    <div className="rounded-2xl px-3 py-2.5 text-center" style={{ background: "var(--color-brand-50, #eff4ff)", border: "1px solid var(--color-brand-100, #d1e0ff)", minWidth: 64 }}>
                      <p className="font-bold text-2xl leading-tight" style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, color: "var(--color-brand-700, #003da5)" }}>{stats.best_streak}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--color-brand-400, #528bff)" }}>racha</p>
                    </div>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3">
                  {[
                    { value: stats.exact, label: 'Exactas', color: "#16a34a" },
                    { value: stats.partial, label: 'Parciales', color: "#d97706" },
                    { value: stats.wrong, label: 'Erróneas', color: "var(--color-gray-400, #a4a7ae)" },
                  ].map(({ value, label, color }, i) => (
                    <div
                      key={label}
                      className="py-4 text-center"
                      style={i > 0 ? { borderLeft: "1px solid var(--color-gray-100, #f5f5f5)" } : {}}
                    >
                      <p className="font-bold text-2xl leading-tight" style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, color }}>{value}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="px-4 pb-4">
                  <div className="h-1.5 rounded-full overflow-hidden flex gap-0.5" style={{ background: "var(--color-gray-100, #f5f5f5)" }}>
                    {stats.exact > 0 && <div className="h-full rounded-full bg-green-400" style={{ width: `${(stats.exact / stats.total) * 100}%` }} />}
                    {stats.partial > 0 && <div className="h-full rounded-full bg-amber-400" style={{ width: `${(stats.partial / stats.total) * 100}%` }} />}
                    {stats.wrong > 0 && <div className="h-full rounded-full" style={{ width: `${(stats.wrong / stats.total) * 100}%`, background: "var(--color-gray-200, #e9eaeb)" }} />}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── RANKING POR GRUPO ─────────────────────────────────────────── */}
        {groupRanks.length > 0 && (
          <div className="card-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.1)" }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}>
              <Trophy01 width={14} height={14} style={{ color: "var(--color-gray-400, #a4a7ae)", flexShrink: 0 }} />
              <span className="flex-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>Ranking por grupo</span>
            </div>
            <div>
              {groupRanks.map((gr, i) => {
                const medal = gr.rank === 1 ? '🥇' : gr.rank === 2 ? '🥈' : gr.rank === 3 ? '🥉' : null
                return (
                  <button
                    key={gr.group_id}
                    onClick={() => router.push(`/grupos/${gr.group_id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity text-left"
                    style={i < groupRanks.length - 1 ? { borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" } : {}}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                      style={{ background: "var(--color-brand-50, #eff4ff)", border: "1px solid var(--color-brand-100, #d1e0ff)" }}
                    >
                      {medal ?? <span className="font-bold text-sm" style={{ color: "var(--color-brand-700, #003da5)" }}>#{gr.rank}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-gray-900, #181d27)" }}>{gr.group_name}</p>
                      <p className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
                        {gr.rank > 0 ? `Puesto ${gr.rank} de ${gr.total_members}` : 'Sin predicciones aún'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-baseline gap-0.5 mr-1">
                      <span className="font-bold text-xl tabular-nums" style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, color: "var(--color-brand-700, #003da5)" }}>{gr.points}</span>
                      <span className="text-xs" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>pts</span>
                    </div>
                    <ChevronRight width={14} height={14} style={{ color: "var(--color-gray-300, #d5d7da)", flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CONFIGURACIÓN ─────────────────────────────────────────────── */}
        <div className="card-white rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.1)" }}>

          {/* Notificaciones */}
          {notifStatus !== 'checking' && (
            <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-gray-100, #f5f5f5)" }}>
                {notifStatus === 'granted'
                  ? <Bell01 width={16} height={16} style={{ color: "var(--color-brand-600, #003da5)" }} />
                  : <BellOff01 width={16} height={16} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--color-gray-900, #181d27)" }}>Notificaciones</p>
                <p className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
                  {notifStatus === 'denied' ? 'Bloqueadas en este navegador'
                    : notifStatus === 'granted' ? 'Activadas'
                    : 'Desactivadas'}
                </p>
              </div>
              {notifStatus === 'denied' ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: "#fef2f2", color: "#dc2626" }}>Bloqueadas</span>
              ) : (
                <button
                  onClick={handleNotifToggle}
                  disabled={notifLoading}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 disabled:opacity-50"
                  style={{ background: notifStatus === 'granted' ? "var(--color-brand-600, #003da5)" : "var(--color-gray-200, #e9eaeb)" }}
                >
                  {notifLoading
                    ? <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </span>
                    : <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                        style={{ transform: notifStatus === 'granted' ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                  }
                </button>
              )}
            </div>
          )}

          {/* Apariencia */}
          <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-gray-100, #f5f5f5)" }}>
              <Moon01 width={16} height={16} style={{ color: "var(--color-gray-500, #717680)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--color-gray-900, #181d27)" }}>Modo oscuro</p>
              <p className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>Cambia el tema de la app</p>
            </div>
            <ThemeToggle variant="settings" />
          </div>

          {/* Ayuda */}
          <button
            onClick={() => router.push('/ayuda')}
            className="w-full px-4 py-3.5 flex items-center gap-3 active:opacity-70 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-gray-100, #f5f5f5)" }}>
              <HelpCircle width={16} height={16} style={{ color: "var(--color-gray-500, #717680)" }} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold" style={{ color: "var(--color-gray-900, #181d27)" }}>Ayuda y preguntas frecuentes</p>
              <p className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>Cómo funciona el puntaje y más</p>
            </div>
            <ChevronRight width={14} height={14} style={{ color: "var(--color-gray-300, #d5d7da)" }} />
          </button>
        </div>

        {/* ── CERRAR SESIÓN ─────────────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
          style={{ background: "var(--color-gray-50, #fafafa)", border: "1px solid #fecdd3", color: "#e11d48", boxShadow: "0 1px 3px rgba(10,13,18,0.06)" }}
        >
          <LogOut01 width={16} height={16} />
          Cerrar sesión
        </button>

      </div>
      <BottomNav active="perfil" />
    </div>
  )
}
