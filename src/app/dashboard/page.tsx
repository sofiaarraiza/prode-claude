"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Profile, type Group, type Match } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import FlipClock from "@/components/FlipClock";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const WORLD_CUP_START = new Date("2026-06-11T19:00:00Z");
const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      started: false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function getLiveStatus(match: Match): "upcoming" | "live" | "finished" {
  const start = parseISO(match.match_date).getTime();
  const now = Date.now();
  if (match.status === "finished") return "finished";
  if (now >= start && now <= start + MATCH_DURATION_MS) return "live";
  return "upcoming";
}

function getMinute(match: Match): number {
  const start = parseISO(match.match_date).getTime();
  return Math.min(90, Math.floor((Date.now() - start) / 60000));
}

// Avatar mini display
function AvatarBubble({ avatarUrl, name, size = 44 }: { avatarUrl?: string | null; name: string; size?: number }) {
  if (!avatarUrl) {
    return (
      <div className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/30"
        style={{ width: size, height: size, background: "linear-gradient(135deg, #003DA5, #1A5FBF)" }}>
        <span className="text-white font-bold" style={{ fontSize: size * 0.38 }}>{name[0]}</span>
      </div>
    );
  }
  if (avatarUrl.startsWith("avatar:")) {
    try {
      const cfg = JSON.parse(avatarUrl.slice(7));
      return (
        <div className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-white/20"
          style={{ width: size, height: size, background: cfg.color }}>
          <span style={{ fontSize: size * 0.45 }}>{cfg.emoji}</span>
        </div>
      );
    } catch {}
  }
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30" style={{ width: size, height: size }}>
      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [todayMatches, setTodayMatches] = useState<Match[]>([]);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);
  const countdown = useCountdown(WORLD_CUP_START);

  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }

      // Pending invite code (email/password flow)
      const pendingCode = typeof window !== "undefined" ? localStorage.getItem("pending_invite_code") : null;
      if (pendingCode) {
        localStorage.removeItem("pending_invite_code");
        const { data: group } = await supabase.from("groups").select("id").eq("invite_code", pendingCode.toUpperCase()).single();
        if (group) {
          const { data: existing } = await supabase.from("group_members").select("id").eq("group_id", group.id).eq("user_id", session.user.id).single();
          if (!existing) await supabase.from("group_members").insert({ group_id: group.id, user_id: session.user.id });
          router.replace(`/grupos/${group.id}`);
          return;
        }
      }

      const [{ data: prof }, { data: memberGroups }, { data: matchData }, { data: predsData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", session.user.id).single(),
        supabase.from("group_members").select("groups(*)").eq("user_id", session.user.id),
        supabase.from("matches").select("*").eq("phase", "group").order("match_date"),
        supabase.from("predictions").select("points").eq("user_id", session.user.id).not("points", "is", null),
      ]);

      setProfile(prof);
      const g = memberGroups?.map((m: any) => m.groups).filter(Boolean) ?? [];
      setGroups(g);

      const now = Date.now();
      const all = matchData ?? [];
      setLiveMatches(all.filter((m) => getLiveStatus(m) === "live"));
      setUpcomingMatches(all.filter((m) => parseISO(m.match_date).getTime() > now).slice(0, 3));

      const todayStr = new Date().toISOString().slice(0, 10);
      setTodayMatches(all.filter((m) => m.match_date.slice(0, 10) === todayStr).slice(0, 5));

      const pts = (predsData ?? []).reduce((sum: number, p: any) => sum + (p.points ?? 0), 0);
      setTotalPoints(pts);

      const firstGroup = g[0];
      if (firstGroup) {
        const { data: lb } = await supabase
          .from("leaderboard")
          .select("user_id, full_name, avatar_url, total_points")
          .eq("group_id", firstGroup.id)
          .order("total_points", { ascending: false })
          .limit(5);
        setLeaderboard(lb ?? []);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Campeón";

  return (
    <div className="min-h-dvh bg-app pb-24">

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-16 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -left-4 bottom-2 w-24 h-24 rounded-full bg-white/5" />

        <div className="flex items-center justify-between mb-1 relative z-10">
          <div>
            <p className="text-white/60 text-xs tracking-widest">BIENVENIDO</p>
            <h1 className="text-white text-2xl font-bold">{firstName} 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <ThemeToggle variant="header" />
            {/* Help */}
            <button onClick={() => router.push("/ayuda")}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center border border-white/20 active:scale-90 transition-transform">
              <span className="text-white font-bold text-sm leading-none">?</span>
            </button>
            {/* Avatar */}
            <button onClick={() => router.push("/perfil")} className="active:scale-90 transition-transform">
              <AvatarBubble avatarUrl={profile?.avatar_url} name={firstName} size={44} />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex gap-2 mt-5 relative z-10">
          <button
            onClick={() => groups[0] && router.push(`/grupos/${groups[0].id}`)}
            className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5 text-center active:scale-95 transition-transform border border-white/10">
            <p className="text-white/60 text-xs mb-0.5">Mis puntos</p>
            <p className="text-white font-bold text-xl leading-tight" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
              {totalPoints ?? "—"}
            </p>
          </button>
          <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5 text-center border border-white/10">
            <p className="text-white/60 text-xs mb-0.5">Inicio</p>
            <p className="text-white font-bold text-sm leading-tight">11 Jun</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl px-3 py-2.5 text-center border border-white/10">
            <p className="text-white/60 text-xs mb-0.5">Partidos</p>
            <p className="text-white font-bold text-xl leading-tight" style={{ fontFamily: "Bebas Neue, sans-serif" }}>72</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 relative z-10 space-y-3">

        {/* ── EN VIVO ─────────────────────────────────────────────── */}
        {liveMatches.length > 0 && (
          <div className="rounded-3xl overflow-hidden shadow-md" style={{ background: "linear-gradient(135deg, #0a2a6e, #003DA5)" }}>
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-white text-xs font-bold tracking-widest">EN VIVO</span>
            </div>
            <div className="divide-y divide-white/10">
              {liveMatches.map((match) => {
                const min = getMinute(match);
                const hasScore = match.home_score !== null && match.away_score !== null;
                return (
                  <div key={match.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-2xl flex-shrink-0">{match.home_flag}</span>
                        <span className="text-white text-sm font-semibold truncate">{match.home_team}</span>
                      </div>
                      <div className="flex-shrink-0 text-center px-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-bold text-2xl tabular-nums" style={{ fontFamily: "Bebas Neue, sans-serif" }}>{hasScore ? match.home_score : "?"}</span>
                          <span className="text-white/30 text-lg">-</span>
                          <span className="text-white font-bold text-2xl tabular-nums" style={{ fontFamily: "Bebas Neue, sans-serif" }}>{hasScore ? match.away_score : "?"}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-red-300 text-xs font-bold">{min}'</span>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                        <span className="text-white text-sm font-semibold truncate text-right">{match.away_team}</span>
                        <span className="text-2xl flex-shrink-0">{match.away_flag}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COUNTDOWN ───────────────────────────────────────────── */}
        {!countdown.started && (
          <div className="bg-surface rounded-3xl shadow-sm px-5 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 bg-[#F0F4FF] text-[color:var(--color-primary)] text-xs font-bold px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#003DA5]" />
                FALTAN PARA EL MUNDIAL
              </span>
              <span className="text-[color:var(--color-muted)] text-xs">11 Jun 2026</span>
            </div>
            <div className="flex justify-center mb-4">
              <FlipClock />
            </div>
            <div className="flex items-center justify-center gap-2 py-2.5 bg-surface-2 rounded-2xl">
              <span className="text-lg">🇲🇽</span>
              <span className="text-gray-500 text-xs font-semibold">México vs Sudáfrica · Estadio Azteca</span>
              <span className="text-lg">🇿🇦</span>
            </div>
          </div>
        )}

        {/* ── PRÓXIMOS (solo cuando ya arrancó) ───────────────────── */}
        {countdown.started && liveMatches.length === 0 && upcomingMatches.length > 0 && (
          <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-2 border-b border-soft">
              <p className="text-gray-400 text-xs font-bold tracking-widest">📅 PRÓXIMOS PARTIDOS</p>
            </div>
            <div className="divide-y divide-soft">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="px-5 py-3 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-xl">{match.home_flag}</span>
                    <span className="text-[color:var(--color-text-2)] text-sm font-semibold truncate">{match.home_team}</span>
                  </div>
                  <span className="text-gray-300 text-xs flex-shrink-0">
                    {format(parseISO(match.match_date), "d MMM · HH'h'mm", { locale: es })}
                  </span>
                  <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                    <span className="text-[color:var(--color-text-2)] text-sm font-semibold truncate text-right">{match.away_team}</span>
                    <span className="text-xl">{match.away_flag}</span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/partidos")} className="w-full py-3 text-[color:var(--color-primary)] text-sm font-semibold border-t border-soft">
              Ver todos los partidos →
            </button>
          </div>
        )}

        {/* ── PARTIDOS DE HOY ─────────────────────────────────────── */}
        {(() => {
          const displayMatches = todayMatches.length > 0 ? todayMatches : (countdown.started ? upcomingMatches : []);
          const title = todayMatches.length > 0 ? "⚽ Partidos de hoy" : "📅 Próximos partidos";
          if (displayMatches.length === 0 || !countdown.started) return null;
          return (
            <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2 border-b border-soft flex items-center justify-between">
                <p className="font-bold text-gray-800 text-sm">{title}</p>
                <button onClick={() => router.push("/partidos")} className="text-[color:var(--color-primary)] text-xs font-semibold">Ver todos</button>
              </div>
              <div className="divide-y divide-soft">
                {displayMatches.map((match) => {
                  const live = getLiveStatus(match) === "live";
                  const finished = match.status === "finished";
                  return (
                    <button key={match.id} onClick={() => router.push("/partidos")}
                      className="w-full flex items-center gap-2 px-5 py-3 active:bg-surface-2 transition-colors">
                      <span className="text-xl flex-shrink-0">{match.home_flag}</span>
                      <span className="text-xs font-semibold text-[color:var(--color-text-2)] flex-1 text-left truncate">{match.home_team}</span>
                      <div className="flex-shrink-0 text-center min-w-[72px]">
                        {finished ? (
                          <span className="text-sm font-bold text-[color:var(--color-primary)]" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
                            {match.home_score} - {match.away_score}
                          </span>
                        ) : live ? (
                          <span className="flex items-center justify-center gap-1 text-xs font-bold text-red-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />EN VIVO
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {format(parseISO(match.match_date), "HH'h'mm", { locale: es })}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-[color:var(--color-text-2)] flex-1 text-right truncate">{match.away_team}</span>
                      <span className="text-xl flex-shrink-0">{match.away_flag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ── CTA PREDICCIONES ────────────────────────────────────── */}
        <button onClick={() => router.push("/predicciones")}
          className="w-full rounded-3xl p-5 text-left active:scale-95 transition-transform relative overflow-hidden shadow-sm"
          style={{ background: "linear-gradient(135deg, #E30613, #B30010)" }}>
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 select-none">⚽</div>
          <p className="text-white/70 text-xs font-bold tracking-widest mb-1">FASE DE GRUPOS</p>
          <h3 className="text-white font-bold text-xl mb-1">Cargá tus predicciones</h3>
          <p className="text-white/70 text-sm">72 partidos · Apertura 11 Jun 2026</p>
          <div className="flex items-center gap-1 mt-3">
            <span className="text-white text-sm font-semibold">Ver partidos</span>
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* ── MINI TABLA ──────────────────────────────────────────── */}
        {leaderboard.length > 0 && (
          <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-soft flex items-center justify-between">
              <h2 className="font-bold text-[color:var(--color-text)] text-base flex items-center gap-2">🏆 Tabla</h2>
              <button onClick={() => router.push("/tabla")} className="text-[color:var(--color-primary)] text-xs font-semibold">Ver todos</button>
            </div>
            <div className="divide-y divide-soft">
              {leaderboard.map((entry, i) => {
                const isMe = entry.user_id === profile?.id;
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <div key={entry.user_id} className={`flex items-center gap-3 px-5 py-3 ${isMe ? "bg-surface-2" : ""}`}>
                    <div className="w-6 text-center flex-shrink-0">
                      {medal
                        ? <span className="text-base">{medal}</span>
                        : <span className="text-gray-400 font-bold text-xs">{i + 1}</span>}
                    </div>
                    <AvatarBubble avatarUrl={entry.avatar_url} name={entry.full_name ?? "?"} size={34} />
                    <span className={`flex-1 text-sm font-semibold truncate ${isMe ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-text)]"}`}>
                      {isMe ? "Vos" : (entry.full_name ?? "Usuario")}
                    </span>
                    <span className={`text-xl font-bold tabular-nums ${isMe ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-text-2)]"}`}
                      style={{ fontFamily: "Bebas Neue, sans-serif" }}>
                      {entry.total_points}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MIS GRUPOS ──────────────────────────────────────────── */}
        <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-soft flex items-center justify-between">
            <h2 className="font-bold text-[color:var(--color-text)] text-base">👥 Mis Grupos</h2>
            <button onClick={() => router.push("/grupos")} className="text-[color:var(--color-primary)] text-xs font-semibold">Ver todos</button>
          </div>
          {groups.length === 0 ? (
            <div className="text-center py-8 px-5">
              <span className="text-4xl block mb-3">👥</span>
              <p className="text-[color:var(--color-muted)] text-sm mb-4">Todavía no estás en ningún grupo</p>
              <div className="flex gap-2">
                <button onClick={() => router.push("/grupos/crear")}
                  className="flex-1 bg-[#003DA5] text-white py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                  Crear grupo
                </button>
                <button onClick={() => router.push("/grupos/unirse")}
                  className="flex-1 border-2 border-[#003DA5] text-[color:var(--color-primary)] py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                  Unirme
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="divide-y divide-soft">
                {groups.slice(0, 3).map((group) => (
                  <button key={group.id} onClick={() => router.push(`/grupos/${group.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 active:bg-surface-2 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #003DA5, #1A5FBF)" }}>🏆</div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-semibold text-[color:var(--color-text)] text-sm truncate">{group.name}</p>
                      <p className="text-[color:var(--color-muted)] text-xs">Código: {group.invite_code}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 p-4 border-t border-soft">
                <button onClick={() => router.push("/grupos/crear")}
                  className="flex-1 bg-[#003DA5] text-white py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                  + Crear grupo
                </button>
                <button onClick={() => router.push("/grupos/unirse")}
                  className="flex-1 border-2 border-[#003DA5] text-[color:var(--color-primary)] py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform">
                  Unirme
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── SISTEMA DE PUNTOS ───────────────────────────────────── */}
        <button
          onClick={() => router.push("/ayuda")}
          className="w-full text-left active:scale-95 transition-transform rounded-3xl overflow-hidden shadow-sm"
          style={{ background: "linear-gradient(150deg, #0a1f5c 0%, #003DA5 60%, #1A5FBF 100%)" }}
        >
          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/60 text-xs font-bold tracking-widest mb-1">CÓMO FUNCIONA</p>
                <h2 className="text-white font-bold text-lg leading-tight">Sistema de puntos</h2>
              </div>
              <span className="text-3xl">🏆</span>
            </div>

            {/* Points pills */}
            <div className="flex gap-2 mb-4">
              {[
                { pts: 3, label: "Exacto", bg: "bg-white", text: "text-[color:var(--color-primary)]" },
                { pts: 1, label: "Ganador", bg: "bg-white/20", text: "text-white" },
                { pts: 0, label: "Error", bg: "bg-white/10", text: "text-white/60" },
              ].map(({ pts, label, bg, text }) => (
                <div key={pts} className={`flex-1 ${bg} rounded-2xl py-3 text-center`}>
                  <p className={`font-bold text-2xl leading-tight ${text}`} style={{ fontFamily: "Bebas Neue, sans-serif" }}>{pts} pts</p>
                  <p className={`text-xs font-semibold mt-0.5 ${text}`}>{label}</p>
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {[
                { pts: "3", emoji: "🎯", title: "Resultado exacto", desc: "Marcador exacto · ej: 2-1 → 2-1" },
                { pts: "1", emoji: "✅", title: "Ganador / Empate", desc: "Acertás el resultado pero no el marcador" },
                { pts: "0", emoji: "❌", title: "Sin puntos", desc: "El resultado no coincide" },
              ].map(({ pts, emoji, title, desc }) => (
                <div key={pts} className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2.5">
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-semibold">{title}</p>
                    <p className="text-white/50 text-xs">{desc}</p>
                  </div>
                  <span className="text-white font-bold text-lg flex-shrink-0" style={{ fontFamily: "Bebas Neue, sans-serif" }}>{pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-between px-5 py-3 bg-white/10 border-t border-white/10">
            <span className="text-white/70 text-xs">⏰ Hasta 24hs antes de cada partido</span>
            <span className="text-white text-xs font-bold flex items-center gap-1">
              Ver reglas completas
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </button>

      </div>
      <BottomNav active="home" />
    </div>
  );
}
