"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Profile, type Group, type Match } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const WORLD_CUP_START = new Date("2026-06-11T19:00:00Z");
const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

function useCountdown(target: Date) {
  const calc = () => {
    const diff = target.getTime() - Date.now();
    if (diff <= 0)
      return { days: 0, hours: 0, minutes: 0, seconds: 0, started: true };
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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [, forceUpdate] = useState(0);
  const countdown = useCountdown(WORLD_CUP_START);

  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }

      const [
        { data: prof },
        { data: memberGroups },
        { data: matchData },
        { data: predsData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single(),
        supabase
          .from("group_members")
          .select("groups(*)")
          .eq("user_id", session.user.id),
        supabase
          .from("matches")
          .select("*")
          .eq("phase", "group")
          .order("match_date"),
        supabase
          .from("predictions")
          .select("points")
          .eq("user_id", session.user.id)
          .not("points", "is", null),
      ]);

      setProfile(prof);
      const g = memberGroups?.map((m: any) => m.groups).filter(Boolean) ?? [];
      setGroups(g);

      const now = Date.now();
      const all = matchData ?? [];
      setLiveMatches(all.filter((m) => getLiveStatus(m) === "live"));
      setUpcomingMatches(
        all.filter((m) => parseISO(m.match_date).getTime() > now).slice(0, 3),
      );

      const pts = (predsData ?? []).reduce(
        (sum: number, p: any) => sum + (p.points ?? 0),
        0,
      );
      setTotalPoints(pts);

      setLoading(false);
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F0F4FF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Campeón";
  const pad = (n: number) => String(n).padStart(2, "0");

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
            onClick={() => router.push("/perfil")}
            className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-lg">
                {firstName[0]}
              </span>
            )}
          </button>
        </div>

        {/* Quick stats */}
        <div className="flex gap-3 mt-5 relative z-10">
          <div
            className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center cursor-pointer active:scale-95 transition-transform"
            onClick={() => groups[0] && router.push(`/grupos/${groups[0].id}`)}
          >
            <p className="text-white/60 text-xs mb-0.5">Mis puntos</p>
            <p
              className="text-white font-bold text-xl leading-tight"
              style={{ fontFamily: "Bebas Neue, sans-serif" }}
            >
              {totalPoints ?? "—"}
            </p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-xs mb-0.5">Inicio</p>
            <p className="text-white font-bold text-sm leading-tight">11 Jun</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-2xl px-3 py-2.5 text-center">
            <p className="text-white/60 text-xs mb-0.5">Partidos</p>
            <p className="text-white font-bold text-xl leading-tight">72</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-6 relative z-10 space-y-4">
        {/* ===================== EN VIVO ===================== */}
        {liveMatches.length > 0 && (
          <div
            className="rounded-3xl overflow-hidden shadow-sm"
            style={{ background: "linear-gradient(135deg, #0a2a6e, #003DA5)" }}
          >
            <div className="px-5 pt-4 pb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-white text-xs font-bold tracking-widest">
                EN VIVO
              </span>
            </div>
            <div className="divide-y divide-white/10">
              {liveMatches.map((match) => {
                const min = getMinute(match);
                const hasScore =
                  match.home_score !== null && match.away_score !== null;
                return (
                  <div key={match.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-2xl flex-shrink-0">
                          {match.home_flag}
                        </span>
                        <span className="text-white text-sm font-semibold truncate">
                          {match.home_team}
                        </span>
                      </div>
                      <div className="flex-shrink-0 text-center px-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-white font-bold text-2xl tabular-nums"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {hasScore ? match.home_score : "?"}
                          </span>
                          <span className="text-white/30 text-lg">-</span>
                          <span
                            className="text-white font-bold text-2xl tabular-nums"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {hasScore ? match.away_score : "?"}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-red-300 text-xs font-bold">
                            {min}'
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                        <span className="text-white text-sm font-semibold truncate text-right">
                          {match.away_team}
                        </span>
                        <span className="text-2xl flex-shrink-0">
                          {match.away_flag}
                        </span>
                      </div>
                    </div>
                    {!hasScore && (
                      <p className="text-white/30 text-xs text-center mt-2">
                        Score pendiente · el admin lo cargará al terminar
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== COUNTDOWN o PRÓXIMOS ===================== */}
        {!countdown.started ? (
          <div className="bg-white rounded-3xl shadow-sm p-5 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 text-7xl opacity-5 select-none">
              🏆
            </div>
            <p className="text-gray-400 text-xs font-semibold tracking-widest mb-3">
              ⏳ FALTAN PARA EL MUNDIAL
            </p>
            <div className="flex items-end justify-between gap-2">
              {[
                { value: countdown.days, label: "días" },
                { value: countdown.hours, label: "horas" },
                { value: countdown.minutes, label: "min" },
                { value: countdown.seconds, label: "seg" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-1 text-center">
                  <div className="bg-blue-100 rounded-2xl py-3 mb-1.5">
                    <span
                      className="text-gray-800 text-3xl font-bold tabular-nums"
                      style={{ fontFamily: "Bebas Neue, sans-serif" }}
                    >
                      {pad(value)}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-400 text-xs mt-3">
              México 🇲🇽 vs Sudáfrica 🇿🇦 · 11 Jun · Estadio Azteca
            </p>
          </div>
        ) : (
          liveMatches.length === 0 &&
          upcomingMatches.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="px-5 pt-4 pb-2 border-b border-gray-100">
                <p className="text-gray-400 text-xs font-semibold tracking-widest">
                  📅 PRÓXIMOS PARTIDOS
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingMatches.map((match) => (
                  <div
                    key={match.id}
                    className="px-5 py-3 flex items-center gap-2"
                  >
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">
                        {match.home_flag}
                      </span>
                      <span className="text-gray-700 text-sm font-semibold truncate">
                        {match.home_team}
                      </span>
                    </div>
                    <span className="text-gray-300 text-xs flex-shrink-0">
                      {format(parseISO(match.match_date), "d MMM · HH'h'mm", {
                        locale: es,
                      })}
                    </span>
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span className="text-gray-700 text-sm font-semibold truncate text-right">
                        {match.away_team}
                      </span>
                      <span className="text-xl flex-shrink-0">
                        {match.away_flag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => router.push("/partidos")}
                className="w-full py-3 text-[#003DA5] text-sm font-semibold border-t border-gray-100"
              >
                Ver todos los partidos →
              </button>
            </div>
          )
        )}

        {/* ===================== PREDICCIONES CTA ===================== */}
        <button
          onClick={() => router.push("/predicciones")}
          className="w-full rounded-3xl p-5 text-left active:scale-95 transition-transform relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-20">
            ⚽
          </div>
          <p className="text-white/70 text-xs font-semibold tracking-widest mb-1">
            FASE DE GRUPOS
          </p>
          <h3 className="text-white font-bold text-xl mb-1">
            Cargá tus predicciones
          </h3>
          <p className="text-white/70 text-sm">
            72 partidos · Apertura 11 Jun 2026
          </p>
          <div className="flex items-center gap-1 mt-3">
            <span className="text-white text-sm font-semibold">
              Ver partidos
            </span>
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        {/* ===================== MIS GRUPOS ===================== */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg">Mis Grupos</h2>
            <button
              onClick={() => router.push("/grupos")}
              className="text-[#003DA5] text-sm font-semibold"
            >
              Ver todos
            </button>
          </div>
          {groups.length === 0 ? (
            <div className="text-center py-6">
              <span className="text-4xl block mb-3">👥</span>
              <p className="text-gray-500 text-sm mb-4">
                Todavía no estás en ningún grupo
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/grupos/crear")}
                  className="flex-1 bg-[#003DA5] text-white py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                >
                  Crear grupo
                </button>
                <button
                  onClick={() => router.push("/grupos/unirse")}
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
                      style={{
                        background: "linear-gradient(135deg, #003DA5, #1A5FBF)",
                      }}
                    >
                      🏆
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">
                        {group.name}
                      </p>
                      <p className="text-gray-400 text-xs">
                        Código: {group.invite_code}
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => router.push("/grupos/crear")}
                  className="flex-1 bg-[#003DA5] text-white py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                >
                  + Crear grupo
                </button>
                <button
                  onClick={() => router.push("/grupos/unirse")}
                  className="flex-1 border-2 border-[#003DA5] text-[#003DA5] py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
                >
                  Unirme
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================== SISTEMA DE PUNTOS ===================== */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
            <span>📋</span> Sistema de puntos
          </h2>
          <div className="space-y-3">
            {[
              {
                pts: 3,
                color: "#003DA5",
                title: "Resultado exacto",
                desc: "Predecís el marcador exacto (ej: 2-1 → 2-1)",
              },
              {
                pts: 1,
                color: "#F59E0B",
                title: "Ganador / Empate",
                desc: "Acertás quién gana o si empatan, pero no el marcador",
              },
              {
                pts: 0,
                color: "#E5E7EB",
                textColor: "#9CA3AF",
                title: "Sin puntos",
                desc: "El resultado no coincide con tu predicción",
              },
            ].map(({ pts, color, textColor, title, desc }) => (
              <div key={pts} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color }}
                >
                  <span
                    className="font-bold text-lg"
                    style={{
                      color: textColor ?? "white",
                      fontFamily: "Bebas Neue, sans-serif",
                    }}
                  >
                    {pts}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{title}</p>
                  <p className="text-gray-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-amber-700 text-xs flex items-start gap-1.5">
              <span>⏰</span>
              <span>
                Podés cargar y editar predicciones hasta{" "}
                <strong>7 días antes</strong> de cada partido.
              </span>
            </p>
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
