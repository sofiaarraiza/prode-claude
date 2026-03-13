"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Profile, type Group, type Match } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Users01,
  HelpCircle,
  ArrowNarrowRight,
  Trophy01,
  ClipboardCheck,
  ChevronRight,
} from "@untitledui/icons";

const WORLD_CUP_START = new Date("2026-06-11T19:00:00Z");
const ARGENTINA_DEBUT = new Date("2026-06-15T01:00:00Z"); // 14 Jun 22:00 ART
const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;
const TOTAL_MATCHES = 72;

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

function AvatarBubble({
  avatarUrl,
  name,
  size = 44,
}: {
  avatarUrl?: string | null;
  name: string;
  size?: number;
}) {
  if (!avatarUrl) {
    return (
      <div
        className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{
          width: size,
          height: size,
          border: "2px solid rgba(255,255,255,0.3)",
          background: "linear-gradient(135deg, #003da5, #002d7a)",
        }}
      >
        <span
          className="text-white font-bold"
          style={{ fontSize: size * 0.38 }}
        >
          {(name[0] ?? "?").toUpperCase()}
        </span>
      </div>
    );
  }
  if (avatarUrl.startsWith("avatar:")) {
    try {
      const cfg = JSON.parse(avatarUrl.slice(7));
      return (
        <div
          className="rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{
            width: size,
            height: size,
            border: "2px solid rgba(255,255,255,0.2)",
            background: cfg.color,
          }}
        >
          <span style={{ fontSize: size * 0.45 }}>{cfg.emoji}</span>
        </div>
      );
    } catch {}
  }
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(255,255,255,0.3)",
      }}
    >
      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

// Mini countdown panel — used inside the dual-countdown card
function MiniCountdown({
  target,
  label,
  flag,
  matchup,
  accent,
}: {
  target: Date;
  label: string;
  flag: string;
  matchup: string;
  accent: string;
}) {
  const cd = useCountdown(target);
  const units = [
    { value: cd.days, label: "d", isSeconds: false },
    { value: cd.hours, label: "h", isSeconds: false },
    { value: cd.minutes, label: "m", isSeconds: false },
    { value: cd.seconds, label: "s", isSeconds: true },
  ];
  return (
    <div className="flex-1 flex flex-col px-3 py-3">
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span style={{ fontSize: 14 }}>{flag}</span>
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{
            color: "var(--color-gray-500, #717680)",
            letterSpacing: "0.1em",
          }}
        >
          {label}
        </span>
      </div>
      {/* Digits */}
      <div className="flex gap-1.5 mb-2">
        {units.map(({ value, label: unit, isSeconds }) => {
          const str = String(value).padStart(2, "0");
          return (
            <div
              key={unit}
              className="flex-1 flex flex-col items-center gap-0.5"
            >
              <div
                className="w-full rounded-lg flex items-center justify-center"
                style={{
                  background: "var(--color-gray-50, #fafafa)",
                  border: `1px solid ${"var(--color-gray-100, #f5f5f5)"}`,
                  height: 36,
                  animation: isSeconds
                    ? "secondPulse 1s ease-in-out infinite"
                    : undefined,
                }}
              >
                <span
                  key={str}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 18,
                    fontWeight: 800,
                    color: accent,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                    animation: "digitPop 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                >
                  {str}
                </span>
              </div>
              <span
                style={{
                  fontSize: "8px",
                  fontWeight: 600,
                  color: "var(--color-gray-400, #a4a7ae)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {unit}
              </span>
            </div>
          );
        })}
      </div>
      {/* Matchup footer */}
      <span
        className="text-[10px] font-medium leading-tight"
        style={{ color: "var(--color-gray-500, #717680)" }}
      >
        {matchup}
      </span>
    </div>
  );
}

// Dual countdown card
function CountdownCard() {
  const wc = useCountdown(WORLD_CUP_START);
  const arg = useCountdown(ARGENTINA_DEBUT);
  if (wc.started && arg.started) return null;
  return (
    <div
      className="card-white rounded-2xl overflow-hidden"
      style={{
        border: "1px solid var(--color-gray-200, #e9eaeb)",
        boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
      }}
    >
      <div className="flex">
        {/* Mundial */}
        {!wc.started && (
          <MiniCountdown
            target={WORLD_CUP_START}
            label="Mundial · 11 Jun"
            flag="⚽"
            matchup="México vs Sudáfrica · Azteca"
            accent="var(--color-brand-600, #003da5)"
          />
        )}

        {/* Divisor */}
        {!wc.started && !arg.started && (
          <div
            className="w-px my-3"
            style={{ background: "var(--color-gray-100, #f5f5f5)" }}
          />
        )}

        {/* Argentina */}
        {!arg.started && (
          <MiniCountdown
            target={ARGENTINA_DEBUT}
            label="Argentina · 14 Jun"
            flag="🇦🇷"
            matchup="Argentina vs Perú · Grupo D"
            accent="#2a7ca8"
          />
        )}
      </div>
    </div>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

// Position chip — matches /tabla style
function DashPositionChip({ pos }: { pos: number }) {
  const cfg =
    pos === 1 ? { bg: "#C8A84B", color: "white" }
    : pos === 2 ? { bg: "var(--color-gray-400, #a4a7ae)", color: "white" }
    : pos === 3 ? { bg: "#b45309", color: "white" }
    : { bg: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-500, #717680)" };
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {pos}
    </div>
  );
}

const DEMO_UPCOMING = [
  {
    id: "d1",
    home_flag: "🇲🇽",
    away_flag: "🇿🇦",
    home_team: "México",
    away_team: "Sudáfrica",
    group: "Grupo A",
    display_date: "11 Jun · 19h00",
  },
  {
    id: "d2",
    home_flag: "🇺🇸",
    away_flag: "🇨🇦",
    home_team: "EEUU",
    away_team: "Canadá",
    group: "Grupo B",
    display_date: "12 Jun · 16h00",
  },
  {
    id: "d3",
    home_flag: "🇧🇷",
    away_flag: "🇨🇷",
    home_team: "Brasil",
    away_team: "Costa Rica",
    group: "Grupo C",
    display_date: "13 Jun · 19h00",
  },
  {
    id: "d4",
    home_flag: "🇦🇷",
    away_flag: "🇵🇪",
    home_team: "Argentina",
    away_team: "Perú",
    group: "Grupo D",
    display_date: "14 Jun · 22h00",
  },
  {
    id: "d5",
    home_flag: "🇫🇷",
    away_flag: "🇵🇹",
    home_team: "Francia",
    away_team: "Portugal",
    group: "Grupo E",
    display_date: "15 Jun · 16h00",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [, setTodayMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [groupStats, setGroupStats] = useState<
    Array<{ points: number; predCount: number; leaderboard: any[] }>
  >([]);
  const [, forceUpdate] = useState(0);

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

      const pendingCode =
        typeof window !== "undefined"
          ? localStorage.getItem("pending_invite_code")
          : null;
      if (pendingCode) {
        localStorage.removeItem("pending_invite_code");
        const { data: group } = await supabase
          .from("groups")
          .select("id")
          .eq("invite_code", pendingCode.toUpperCase())
          .single();
        if (group) {
          const { data: existing } = await supabase
            .from("group_members")
            .select("id")
            .eq("group_id", group.id)
            .eq("user_id", session.user.id)
            .single();
          if (!existing)
            await supabase
              .from("group_members")
              .insert({ group_id: group.id, user_id: session.user.id });
          router.replace(`/grupos/${group.id}`);
          return;
        }
      }

      const [{ data: prof }, { data: memberGroups }, { data: matchData }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single<Profile>(),
          supabase
            .from("group_members")
            .select("groups(*)")
            .eq("user_id", session.user.id),
          supabase
            .from("matches")
            .select("*")
            .eq("phase", "group")
            .order("match_date"),
        ]);

      if (prof && !prof.username) {
        router.replace("/auth/username");
        return;
      }
      setProfile(prof);
      const g = memberGroups?.map((m: any) => m.groups).filter(Boolean) ?? [];
      setGroups(g);

      const now = Date.now();
      const all = matchData ?? [];
      setLiveMatches(all.filter((m) => getLiveStatus(m) === "live"));
      setUpcomingMatches(
        all.filter((m) => parseISO(m.match_date).getTime() > now).slice(0, 5),
      );

      const todayStr = new Date().toISOString().slice(0, 10);
      setTodayMatches(
        all.filter((m) => m.match_date.slice(0, 10) === todayStr).slice(0, 5),
      );

      if (g.length > 0) {
        const stats = await Promise.all(
          g.map(async (grp: Group) => {
            const [{ data: preds }, { data: lb }] = await Promise.all([
              supabase
                .from("predictions")
                .select("points")
                .eq("user_id", session.user.id)
                .eq("group_id", grp.id),
              supabase
                .from("leaderboard")
                .select(
                  "user_id, username, full_name, avatar_url, total_points",
                )
                .eq("group_id", grp.id)
                .order("total_points", { ascending: false })
                .limit(3),
            ]);
            const pts = (preds ?? []).reduce(
              (s: number, p: any) => s + (p.points ?? 0),
              0,
            );
            return {
              points: pts,
              predCount: (preds ?? []).length,
              leaderboard: lb ?? [],
            };
          }),
        );
        setGroupStats(stats);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center page-gradient">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#1e6a94", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "Campeón";
  const currentGroup = groups[selectedGroupIdx] ?? null;
  const stats = groupStats[selectedGroupIdx] ?? {
    points: 0,
    predCount: 0,
    leaderboard: [],
  };
  const progressPct =
    TOTAL_MATCHES > 0 ? Math.round((stats.predCount / TOTAL_MATCHES) * 100) : 0;

  return (
    <div
      className="min-h-dvh pb-24 page-gradient"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        className="relative px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: 16,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Izquierda: avatar + saludo */}
          <button
            onClick={() => router.push("/perfil")}
            className="flex items-center gap-3 active:opacity-75 transition-opacity min-w-0"
          >
            <AvatarBubble
              avatarUrl={profile?.avatar_url}
              name={firstName}
              size={42}
            />
            <div className="min-w-0 text-left">
              <p className="text-[11px] font-medium leading-none mb-0.5 text-muted">
                Bienvenida de vuelta
              </p>
              <h1
                className="leading-tight truncate"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--color-gray-900, #181d27)",
                }}
              >
                Hola, {firstName} 👋
              </h1>
            </div>
          </button>

          {/* Derecha: action buttons en pill */}
          <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-1.5 rounded-2xl glass-pill">
            <ThemeToggle variant="header" />
            <button
              onClick={() => router.push("/ayuda")}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-btn"
            >
              <HelpCircle className="glass-btn" width={18} height={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 relative z-10 space-y-5">
        {/* ── EN VIVO ──────────────────────────────────────────────────── */}
        {liveMatches.length > 0 && (
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{
              border: "1px solid var(--color-gray-200, #e9eaeb)",
              boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
            }}
          >
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{
                borderBottom: "1px solid var(--color-gray-100, #f5f5f5)",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-semibold text-red-600 tracking-wide uppercase">
                En vivo
              </span>
            </div>
            {liveMatches.map((match, idx) => {
              const min = getMinute(match);
              const hasScore =
                match.home_score !== null && match.away_score !== null;
              return (
                <div
                  key={match.id}
                  className="px-4 py-3"
                  style={
                    idx < liveMatches.length - 1
                      ? {
                          borderBottom:
                            "1px solid var(--color-gray-100, #f5f5f5)",
                        }
                      : {}
                  }
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-xl flex-shrink-0">
                        {match.home_flag}
                      </span>
                      <span
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--color-gray-900, #181d27)" }}
                      >
                        {match.home_team}
                      </span>
                    </div>
                    <div className="flex-shrink-0 text-center">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-bold text-xl tabular-nums"
                          style={{
                            color: "var(--color-gray-900, #181d27)",
                            fontFamily: "Bebas Neue, sans-serif",
                          }}
                        >
                          {hasScore ? match.home_score : "–"}
                        </span>
                        <span
                          className="text-sm font-light"
                          style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                        >
                          ·
                        </span>
                        <span
                          className="font-bold text-xl tabular-nums"
                          style={{
                            color: "var(--color-gray-900, #181d27)",
                            fontFamily: "Bebas Neue, sans-serif",
                          }}
                        >
                          {hasScore ? match.away_score : "–"}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-red-500">
                        {min}&apos;
                      </span>
                    </div>
                    <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
                      <span
                        className="text-sm font-semibold truncate text-right"
                        style={{ color: "var(--color-gray-900, #181d27)" }}
                      >
                        {match.away_team}
                      </span>
                      <span className="text-xl flex-shrink-0">
                        {match.away_flag}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── COUNTDOWN ────────────────────────────────────────────────── */}
        <CountdownCard />

        {/* ── CTA PREDICCIONES ─────────────────────────────────────────── */}
        <button
          onClick={() => router.push("/predicciones")}
          className="w-full rounded-2xl text-left active:scale-[0.98] transition-transform relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #2a7ca8 0%, #4a9fc0 40%, #75c2e0 100%)",
            boxShadow: "0 4px 12px rgba(42,124,168,0.4)",
          }}
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
            <Trophy01 width={80} height={80} className="text-white" />
          </div>
          <div className="px-5 py-5">
            <p
              className="text-xs font-semibold tracking-widest uppercase mb-1"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              Mundial 2026 · 72 partidos
            </p>
            <h3 className="font-bold text-xl leading-snug mb-4 text-white">
              Cargá tus
              <br />
              predicciones
            </h3>
            <div
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5"
              style={{
                background: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{ color: "#2a7ca8" }}
              >
                Empezar ahora
              </span>
              <ArrowNarrowRight
                width={14}
                height={14}
                style={{ color: "#2a7ca8" }}
              />
            </div>
          </div>
        </button>

        {/* ── MIS GRUPOS ────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-gray-500, #717680)" }}
            >
              Mis grupos
            </p>
            <button
              onClick={() => router.push("/grupos")}
              className="text-xs font-semibold flex items-center gap-0.5 active:opacity-70"
              style={{ color: "var(--color-brand-600, #003da5)" }}
            >
              Ver todos <ChevronRight width={12} height={12} />
            </button>
          </div>

          {groups.length > 0 ? (
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid var(--color-gray-200, #e9eaeb)",
                boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
              }}
            >
              {/* Group tab selector */}
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{
                  borderBottom: "1px solid var(--color-gray-100, #f5f5f5)",
                }}
              >
                <Users01
                  width={14}
                  height={14}
                  style={{
                    color: "var(--color-gray-400, #a4a7ae)",
                    flexShrink: 0,
                  }}
                />
                {groups.length > 1 ? (
                  <div
                    className="flex gap-1.5 flex-1 overflow-x-auto"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {groups.map((g, i) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGroupIdx(i)}
                        className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all active:scale-95"
                        style={
                          selectedGroupIdx === i
                            ? {
                                background: "var(--color-brand-600, #003da5)",
                                color: "white",
                              }
                            : {
                                background: "var(--color-gray-100, #f5f5f5)",
                                color: "var(--color-gray-600, #535862)",
                              }
                        }
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span
                    className="flex-1 text-sm font-semibold"
                    style={{ color: "var(--color-gray-900, #181d27)" }}
                  >
                    {currentGroup?.name}
                  </span>
                )}
                <button
                  onClick={() =>
                    currentGroup && router.push(`/grupos/${currentGroup.id}`)
                  }
                  className="flex-shrink-0 flex items-center gap-0.5 text-xs font-semibold active:opacity-70"
                  style={{ color: "var(--color-brand-600, #003da5)" }}
                >
                  Ver <ChevronRight width={12} height={12} />
                </button>
              </div>

              {/* Predictions progress */}
              <div
                className="px-4 pt-4 pb-3"
                style={{
                  borderBottom: "1px solid var(--color-gray-100, #f5f5f5)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                      style={{ color: "var(--color-gray-500, #717680)" }}
                    >
                      Tus predicciones
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--color-gray-900, #181d27)" }}
                    >
                      {stats.predCount === 0
                        ? "¡Empezá a predecir!"
                        : stats.predCount === TOTAL_MATCHES
                          ? "¡Completaste todo! 🎉"
                          : `Faltan ${TOTAL_MATCHES - stats.predCount} partidos`}
                    </p>
                  </div>
                  <ClipboardCheck
                    width={20}
                    height={20}
                    style={{
                      color: "var(--color-brand-600, #003da5)",
                      flexShrink: 0,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    {progressPct}% completado
                  </span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: "var(--color-gray-700, #414651)" }}
                  >
                    {stats.predCount} / {TOTAL_MATCHES}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--color-gray-100, #f5f5f5)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${progressPct}%`,
                      background:
                        progressPct === 100
                          ? "var(--color-success-500, #17b26a)"
                          : "var(--color-brand-600, #003da5)",
                    }}
                  />
                </div>
                <button
                  onClick={() => router.push("/predicciones")}
                  className="mt-3 w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
                  style={{
                    background: "var(--color-brand-600, #003da5)",
                    color: "white",
                  }}
                >
                  {stats.predCount === 0
                    ? "Cargar predicciones"
                    : "Completar predicciones"}
                  <ArrowNarrowRight width={15} height={15} />
                </button>
              </div>

              {/* Mini leaderboard */}
              <div>
                <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    Tabla
                  </p>
                </div>
                {stats.leaderboard.length > 0 ? (
                  <div className="px-3 pb-2 space-y-1">
                    {stats.leaderboard.map((entry, i) => {
                      const isMe = entry.user_id === profile?.id;
                      return (
                        <div
                          key={entry.user_id}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                          style={{
                            background: isMe
                              ? "var(--color-brand-50, #eff4ff)"
                              : "transparent",
                            border: isMe
                              ? "1px solid var(--color-brand-200, #b2ccff)"
                              : "1px solid transparent",
                          }}
                        >
                          <DashPositionChip pos={i + 1} />
                          <AvatarBubble
                            avatarUrl={entry.avatar_url}
                            name={entry.full_name ?? "?"}
                            size={30}
                          />
                          <span
                            className="flex-1 text-sm font-medium truncate"
                            style={{
                              color: isMe
                                ? "var(--color-brand-700, #003da5)"
                                : "var(--color-gray-700, #414651)",
                            }}
                          >
                            {isMe
                              ? `@${entry.username ?? entry.full_name?.split(" ")[0] ?? "vos"} (Vos)`
                              : entry.username
                                ? `@${entry.username}`
                                : (entry.full_name?.split(" ")[0] ?? "Usuario")}
                          </span>
                          <div className="flex items-baseline gap-0.5">
                            <span
                              className="font-bold text-sm tabular-nums"
                              style={{
                                color: isMe
                                  ? "var(--color-brand-700, #003da5)"
                                  : "var(--color-gray-900, #181d27)",
                              }}
                            >
                              {entry.total_points}
                            </span>
                            <span
                              className="text-xs"
                              style={{
                                color: "var(--color-gray-400, #a4a7ae)",
                              }}
                            >
                              pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-center">
                    <p
                      className="text-sm"
                      style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                    >
                      Cargá predicciones para ver la tabla
                    </p>
                  </div>
                )}
                <div className="px-3 pb-3 pt-1">
                  <button
                    onClick={() => router.push("/tabla")}
                    className="w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 active:opacity-80 transition-opacity"
                    style={{
                      background: "var(--color-gray-50, #fafafa)",
                      border: "1px solid var(--color-gray-200, #e9eaeb)",
                      color: "var(--color-gray-700, #414651)",
                    }}
                  >
                    Ver tabla completa <ChevronRight width={14} height={14} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid var(--color-gray-200, #e9eaeb)",
                boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
              }}
            >
              <div className="px-5 pt-8 pb-6 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "var(--color-brand-50, #eff4ff)" }}
                >
                  <Users01
                    width={24}
                    height={24}
                    style={{ color: "var(--color-brand-600, #003da5)" }}
                  />
                </div>
                <h3
                  className="text-base font-semibold mb-1"
                  style={{ color: "var(--color-gray-900, #181d27)" }}
                >
                  Jugá con tus amigos
                </h3>
                <p
                  className="text-sm mb-5"
                  style={{ color: "var(--color-gray-500, #717680)" }}
                >
                  Creá o unite a un grupo para competir en el prode del Mundial
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push("/grupos/crear")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity"
                    style={{
                      background: "var(--color-brand-600, #003da5)",
                      color: "white",
                    }}
                  >
                    Crear grupo
                  </button>
                  <button
                    onClick={() => router.push("/grupos/unirse")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity"
                    style={{
                      background: "white",
                      border: "1px solid var(--color-gray-300, #d5d7da)",
                      color: "var(--color-gray-700, #414651)",
                    }}
                  >
                    Unirme
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── PRÓXIMOS PARTIDOS (scroll horizontal) ────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-gray-500, #717680)" }}
            >
              Próximos partidos
            </p>
            <button
              onClick={() => router.push("/partidos")}
              className="text-xs font-semibold flex items-center gap-0.5 active:opacity-70"
              style={{ color: "var(--color-brand-600, #003da5)" }}
            >
              Ver todos <ChevronRight width={12} height={12} />
            </button>
          </div>
          <div
            className="flex gap-2.5 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {(upcomingMatches.length > 0 ? upcomingMatches : DEMO_UPCOMING).map(
              (m: any, i: number) => (
                <button
                  key={m.id ?? i}
                  onClick={() => router.push("/partidos")}
                  className="flex-shrink-0 card-white rounded-2xl active:scale-[0.97] transition-transform"
                  style={{
                    width: 130,
                    border: "1px solid var(--color-gray-200, #e9eaeb)",
                    boxShadow: "0 1px 3px rgba(10,13,18,0.08)",
                  }}
                >
                  <div className="p-3 flex flex-col items-center gap-2">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--color-gray-100, #f5f5f5)",
                        color: "var(--color-gray-500, #717680)",
                      }}
                    >
                      {m.group ?? "Grupo A"}
                    </span>
                    <div className="flex items-center gap-2 w-full justify-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{m.home_flag}</span>
                        <span
                          className="text-[10px] font-semibold text-center leading-tight"
                          style={{
                            color: "var(--color-gray-700, #414651)",
                            maxWidth: 44,
                          }}
                        >
                          {m.home_team}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold"
                        style={{ color: "var(--color-gray-300, #d5d7da)" }}
                      >
                        vs
                      </span>
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{m.away_flag}</span>
                        <span
                          className="text-[10px] font-semibold text-center leading-tight"
                          style={{
                            color: "var(--color-gray-700, #414651)",
                            maxWidth: 44,
                          }}
                        >
                          {m.away_team}
                        </span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-medium tabular-nums"
                      style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                    >
                      {m.display_date ??
                        format(parseISO(m.match_date), "d MMM · HH'h'mm", {
                          locale: es,
                        })}
                    </span>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>

        {/* ── SISTEMA DE PUNTOS ────────────────────────────────────────── */}
        <div
          className="card-white rounded-2xl overflow-hidden"
          style={{
            border: "1px solid var(--color-gray-200, #e9eaeb)",
            boxShadow: "0 1px 3px rgba(10,13,18,0.08)",
          }}
        >
          <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-gray-500, #717680)" }}
            >
              Sistema de puntos
            </p>
            <button
              onClick={() => router.push("/ayuda")}
              className="text-xs font-semibold flex items-center gap-0.5 active:opacity-70"
              style={{ color: "var(--color-brand-600, #003da5)" }}
            >
              Ver más <ChevronRight width={12} height={12} />
            </button>
          </div>
          <div className="px-4 pb-4 pt-2 flex gap-2">
            {[
              {
                pts: "3",
                label: "Exacto",
                sub: "Marcador exacto",
                bg: "var(--color-brand-600, #003da5)",
              },
              {
                pts: "1",
                label: "Ganador",
                sub: "Resultado correcto",
                bg: "#d97706",
              },
              {
                pts: "0",
                label: "Fallo",
                sub: "Sin puntos",
                bg: "var(--color-gray-300, #d5d7da)",
              },
            ].map(({ pts, label, sub, bg }) => (
              <div
                key={label}
                className="flex-1 rounded-xl p-2.5 text-center"
                style={{
                  background: "var(--color-gray-50, #fafafa)",
                  border: "1px solid var(--color-gray-100, #f5f5f5)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1.5"
                  style={{ background: bg }}
                >
                  <span className="text-white text-sm font-bold">{pts}</span>
                </div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-gray-800, #1d2939)" }}
                >
                  {label}
                </p>
                <p
                  className="text-[10px] leading-tight mt-0.5"
                  style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                >
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BANNER GRUPOS ─────────────────────────────────────────────── */}
        <button
          onClick={() => router.push("/grupos/crear")}
          className="w-full rounded-2xl text-left active:scale-[0.98] transition-transform overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #001a4d 0%, #002d7a 55%, #003da5 100%)",
            boxShadow: "0 4px 12px rgba(0,26,77,0.45)",
          }}
        >
          <div className="px-5 py-4 flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <Users01 width={22} height={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">
                Invitá a tus amigos
              </p>
              <p
                className="text-xs mt-0.5 leading-tight"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Creá un grupo y compitan juntos en el Mundial
              </p>
            </div>
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <ChevronRight width={14} height={14} className="text-white" />
            </div>
          </div>
        </button>
      </div>
      <BottomNav active="home" />
    </div>
  );
}
