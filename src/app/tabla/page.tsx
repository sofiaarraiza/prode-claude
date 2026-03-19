"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Group, type LeaderboardEntry, type GlobalRankingEntry } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import {
  Trophy01,
  HelpCircle,
  Target01,
  CheckCircle,
  Users01,
  ChevronDown,
  TrendUp01,
  TrendDown01,
  Award01,
  BarChart07,
  Globe01,
  Zap,
} from "@untitledui/icons";

// ── Level system (mirrors perfil/ayuda) ─────────────────────────────
const LEVELS = [
  { emoji: "✨", label: "Novato",    min: 0,   max: 0,   color: "var(--color-gray-500, #717680)",  bg: "rgba(100,116,139,0.10)" },
  { emoji: "🌱", label: "Aprendiz", min: 1,   max: 9,   color: "#16a34a",                         bg: "rgba(22,163,74,0.10)" },
  { emoji: "⚡", label: "En forma", min: 10,  max: 29,  color: "#d97706",                         bg: "rgba(217,119,6,0.10)" },
  { emoji: "🔥", label: "Adivino",  min: 30,  max: 59,  color: "#ea580c",                         bg: "rgba(234,88,12,0.10)" },
  { emoji: "🏆", label: "Experto",  min: 60,  max: 99,  color: "var(--color-brand-600, #003da5)", bg: "var(--color-brand-50, #eff4ff)" },
  { emoji: "👑", label: "Leyenda",  min: 100, max: Infinity, color: "#7c3aed",                    bg: "rgba(124,58,237,0.10)" },
];

function getLevel(pts: number) {
  return LEVELS.find((l) => pts >= l.min && pts <= l.max) ?? LEVELS[0];
}

// ── Avatar component ─────────────────────────────────────────────────
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
          style={{ width: size, height: size, background: cfg.color }}
        >
          <span style={{ fontSize: size * 0.45 }}>{cfg.emoji}</span>
        </div>
      );
    } catch {}
  }
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

// ── Position medal chip ──────────────────────────────────────────────
function PositionChip({ pos }: { pos: number }) {
  const configs = [
    { bg: "#C8A84B", text: "white" },
    { bg: "var(--color-gray-400, #a4a7ae)", text: "white" },
    { bg: "#b45309", text: "white" },
  ];
  const cfg = configs[pos - 1] ?? { bg: "var(--color-gray-100, #f5f5f5)", text: "var(--color-gray-500, #717680)" };
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {pos}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
export default function TablaPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [viewMode, setViewMode] = useState<"global" | "group">("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalRanking, setGlobalRanking] = useState<GlobalRankingEntry[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [levelsOpen, setLevelsOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      setUserId(session.user.id);

      const { data: memberData } = await supabase
        .from("group_members")
        .select("groups(*)")
        .eq("user_id", session.user.id);

      const g = memberData?.map((m: any) => m.groups).filter(Boolean) ?? [];
      // Sort: global group first, then private groups
      const sorted = [...g].sort((a: Group, b: Group) => {
        if (a.is_global) return -1;
        if (b.is_global) return 1;
        return 0;
      });
      setGroups(sorted);

      // Load global ranking
      const { data: globalData } = await supabase.rpc("get_global_ranking");
      setGlobalRanking(globalData ?? []);

      // Default: global view
      const privateGroups = sorted.filter((grp: Group) => !grp.is_global);
      if (privateGroups.length > 0) setSelectedGroup(privateGroups[0].id);

      setLoading(false);
    };
    load();
  }, [router]);

  useEffect(() => {
    if (!selectedGroup || viewMode !== "group") return;
    const load = async () => {
      const { data } = await supabase
        .from("leaderboard")
        .select("*")
        .eq("group_id", selectedGroup)
        .order("total_points", { ascending: false });
      setLeaderboard(data ?? []);
    };
    load();
  }, [selectedGroup, viewMode]);

  // ── Derived state for group mode ─────────────────────────────────
  const myGroupEntry = leaderboard.find((e) => e.user_id === userId);
  const myGroupPos = leaderboard.findIndex((e) => e.user_id === userId) + 1;
  const groupLeader = leaderboard[0];
  const myGroupGap = groupLeader && myGroupEntry ? groupLeader.total_points - myGroupEntry.total_points : 0;

  // ── Derived state for global mode ────────────────────────────────
  const myGlobalEntry = globalRanking.find((e) => e.user_id === userId);
  const myGlobalPos = globalRanking.findIndex((e) => e.user_id === userId) + 1;
  const globalLeader = globalRanking[0];
  const myGlobalGap = globalLeader && myGlobalEntry ? globalLeader.max_points - myGlobalEntry.max_points : 0;

  const privateGroups = groups.filter((g) => !g.is_global);

  // ── Loading skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: "var(--color-bg, #f5f7ff)" }}
      >
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand-600, #003da5)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  // ── Shared rendering helpers ─────────────────────────────────────
  const isGlobal = viewMode === "global";
  const activeEntries = isGlobal ? globalRanking : leaderboard;
  const hasEntries = activeEntries.length > 0;

  const myEntry = isGlobal ? myGlobalEntry : myGroupEntry;
  const myPos = isGlobal ? myGlobalPos : myGroupPos;
  const myGap = isGlobal ? myGlobalGap : myGroupGap;
  const getPoints = (e: LeaderboardEntry | GlobalRankingEntry) =>
    isGlobal ? (e as GlobalRankingEntry).max_points : (e as LeaderboardEntry).total_points;
  const myPoints = myEntry ? getPoints(myEntry as any) : 0;

  return (
    <div
      className="min-h-dvh pb-28"
      style={{ background: "var(--color-bg, #f5f7ff)" }}
    >
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div
        className="px-5 pb-5"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 1rem)",
          background: "var(--color-surface, white)",
          borderBottom: "1px solid var(--color-gray-100, #f5f5f5)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #003da5, #1a55bd)" }}
            >
              <BarChart07 width={22} height={22} className="text-white" />
            </div>
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-gray-400, #a4a7ae)" }}
              >
                Copa del Mundo 2026
              </p>
              <h1
                className="text-xl font-extrabold leading-tight"
                style={{ color: "var(--color-gray-900, #181d27)" }}
              >
                Tabla de Posiciones
              </h1>
            </div>
          </div>
          <div
            className="flex items-center gap-1 px-2 py-2 rounded-2xl"
            style={{ background: "var(--color-gray-50, #fafafa)", border: "1px solid var(--color-gray-200, #e9eaeb)" }}
          >
            <ThemeToggle />
            <button
              onClick={() => router.push("/ayuda")}
              className="p-1.5 rounded-xl active:opacity-70"
              style={{ color: "var(--color-gray-400, #a4a7ae)" }}
            >
              <HelpCircle width={18} height={18} />
            </button>
          </div>
        </div>

        {/* Group selector tabs */}
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {/* Global tab — always first */}
          <button
            onClick={() => setViewMode("global")}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={
              isGlobal
                ? { background: "linear-gradient(135deg, #C8A84B, #b8942e)", color: "white" }
                : { background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }
            }
          >
            <Globe01 width={13} height={13} />
            Global
          </button>

          {/* Private group tabs */}
          {privateGroups.map((g) => {
            const isActive = viewMode === "group" && g.id === selectedGroup;
            return (
              <button
                key={g.id}
                onClick={() => { setViewMode("group"); setSelectedGroup(g.id); }}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                style={
                  isActive
                    ? { background: "var(--color-brand-600, #003da5)", color: "white" }
                    : { background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }
                }
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── EMPTY STATE ─────────────────────────────────────────────── */}
        {!hasEntries && (
          <div
            className="card-white rounded-2xl px-5 py-10 text-center"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.1)" }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--color-gray-100, #f5f5f5)" }}
            >
              <Trophy01 width={22} height={22} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
            </div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--color-gray-900, #181d27)" }}>
              Sin datos todavía
            </p>
            <p className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
              Los puntos van apareciendo a medida que se juegan los partidos.
            </p>
          </div>
        )}

        {/* ── FULL LEADERBOARD ─────────────────────────────────────────── */}
        {hasEntries && (
          <>
            {/* ── MY POSITION BANNER ──────────────────────────────────── */}
            {myEntry && (
              <div
                className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
                style={{
                  background: isGlobal
                    ? "linear-gradient(135deg, #C8A84B 0%, #b8942e 100%)"
                    : "linear-gradient(135deg, #003da5 0%, #1a55bd 100%)",
                  boxShadow: isGlobal
                    ? "0 4px 12px rgba(200,168,75,0.3)"
                    : "0 4px 12px rgba(0,61,165,0.25)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base font-bold text-white"
                  style={{ background: "rgba(255,255,255,0.15)" }}
                >
                  {myPos}°
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold leading-tight">
                    {isGlobal ? "Tu posición en el ranking global" : "Tu posición en el grupo"}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {myPos === 1
                      ? isGlobal ? "Sos el líder del ranking global 🏆" : "Sos el líder del grupo"
                      : myGap === 0
                        ? `Empatado en el ${myPos}° puesto`
                        : `A ${myGap} pts del primero`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white text-xl font-extrabold tabular-nums" style={{ fontFamily: "Inter, sans-serif" }}>
                    {myPoints}
                  </p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {isGlobal ? "mejor pts" : "puntos"}
                  </p>
                </div>
              </div>
            )}

            {/* ── PODIUM (top 3) ───────────────────────────────────────── */}
            {activeEntries.length >= 3 && (
              <div
                className="card-white rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
              >
                <div className="px-4 pt-3.5 pb-1 flex items-center gap-2">
                  <Award01 width={14} height={14} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                  <p
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    Podio
                  </p>
                  {isGlobal && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto"
                      style={{ background: "var(--color-brand-50, #eff4ff)", color: "var(--color-brand-600, #003da5)" }}
                    >
                      Mejor puntaje de cada jugador
                    </span>
                  )}
                </div>
                <div className="px-4 pb-5 pt-2 flex items-end justify-center gap-3">
                  {[1, 0, 2].map((lbIdx) => {
                    const entry = activeEntries[lbIdx];
                    const pos = lbIdx + 1;
                    const isFirst = lbIdx === 0;
                    const isMe = entry?.user_id === userId;
                    const displayName = entry?.username
                      ? `@${entry.username}`
                      : (entry?.full_name?.split(" ")[0] ?? "?");
                    const pts = entry ? getPoints(entry as any) : 0;

                    const sizeMap: Record<number, { avatar: number; barH: string; pts: string }> = {
                      0: { avatar: 56, barH: "64px", pts: "text-xl" },
                      1: { avatar: 44, barH: "44px", pts: "text-lg" },
                      2: { avatar: 44, barH: "36px", pts: "text-base" },
                    };
                    const { avatar, barH, pts: ptsSize } = sizeMap[lbIdx];

                    const barColors: Record<number, string> = {
                      0: "#C8A84B",
                      1: "var(--color-gray-300, #d5d7da)",
                      2: "#b45309",
                    };

                    return (
                      <div key={lbIdx} className={`flex flex-col items-center ${isFirst ? "-mt-3" : ""}`}>
                        {isFirst && (
                          <Trophy01
                            width={20}
                            height={20}
                            className="mb-1.5"
                            style={{ color: "#C8A84B" }}
                          />
                        )}
                        <div
                          className="rounded-full overflow-hidden flex-shrink-0"
                          style={{
                            width: avatar,
                            height: avatar,
                            border: `2px solid ${barColors[lbIdx]}`,
                            boxShadow: isMe ? "0 0 0 3px rgba(0,61,165,0.2)" : "none",
                          }}
                        >
                          <AvatarBubble avatarUrl={entry?.avatar_url} name={entry?.full_name ?? "?"} size={avatar} />
                        </div>
                        <p
                          className="text-[11px] font-semibold mt-1.5 text-center truncate max-w-[72px]"
                          style={{
                            color: isMe
                              ? "var(--color-brand-600, #003da5)"
                              : "var(--color-gray-700, #414651)",
                          }}
                        >
                          {isMe ? "Vos" : displayName}
                        </p>
                        <div
                          className="mt-1 w-16 rounded-t-xl flex items-center justify-center"
                          style={{ height: barH, background: `${barColors[lbIdx]}22` }}
                        >
                          <span
                            className={`font-extrabold tabular-nums ${ptsSize}`}
                            style={{ fontFamily: "Inter, sans-serif", color: barColors[lbIdx] }}
                          >
                            {pts}
                          </span>
                        </div>
                        <div
                          className="w-16 h-5 rounded-b flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: barColors[lbIdx] }}
                        >
                          {pos}°
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── FULL TABLE ───────────────────────────────────────────── */}
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
            >
              {/* Table header */}
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
              >
                <BarChart07 width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                <p
                  className="text-xs font-semibold uppercase tracking-wider flex-1"
                  style={{ color: "var(--color-gray-500, #717680)" }}
                >
                  {isGlobal ? "Ranking Global" : "Clasificación"}
                </p>
                <div className="flex items-center gap-4 pr-1">
                  {!isGlobal && (
                    <>
                      <div className="flex items-center gap-1" title="Resultados exactos">
                        <Target01 width={12} height={12} style={{ color: "#16a34a" }} />
                        <span className="text-[10px] font-semibold" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                          Exact
                        </span>
                      </div>
                      <div className="flex items-center gap-1" title="Solo ganador correcto">
                        <CheckCircle width={12} height={12} style={{ color: "#d97706" }} />
                        <span className="text-[10px] font-semibold" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                          Ganó
                        </span>
                      </div>
                    </>
                  )}
                  <span
                    className="text-[10px] font-bold w-8 text-right"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    {isGlobal ? "Mejor" : "Pts"}
                  </span>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y" style={{ borderColor: "var(--color-gray-100, #f5f5f5)" }}>
                {activeEntries.map((entry, index) => {
                  const isMe = entry.user_id === userId;
                  const pos = index + 1;
                  const pts = getPoints(entry as any);
                  const myPts = myEntry ? getPoints(myEntry as any) : 0;

                  const displayName = isMe
                    ? `@${entry.username ?? entry.full_name?.split(" ")[0] ?? "vos"}`
                    : entry.username
                      ? `@${entry.username}`
                      : (entry.full_name?.split(" ")[0] ?? "Jugador");
                  const gap = myEntry && !isMe ? pts - myPts : null;

                  return (
                    <div
                      key={entry.user_id}
                      className="px-4 py-3"
                      style={{
                        background: isMe ? "var(--color-brand-50, #eff4ff)" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <PositionChip pos={pos} />
                        <AvatarBubble avatarUrl={entry.avatar_url} name={entry.full_name ?? "?"} size={36} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-sm font-semibold truncate"
                              style={{
                                color: isMe
                                  ? "var(--color-brand-700, #003da5)"
                                  : "var(--color-gray-800, #1d2939)",
                              }}
                            >
                              {displayName}
                            </span>
                            {isMe && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0"
                                style={{ background: "var(--color-brand-100, #d1e0ff)", color: "var(--color-brand-700, #003da5)" }}
                              >
                                VOS
                              </span>
                            )}
                          </div>
                          {(() => {
                            const lv = getLevel(pts);
                            return (
                              <span
                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md mt-0.5"
                                style={{ background: lv.bg, color: lv.color }}
                              >
                                <span style={{ fontSize: 10 }}>{lv.emoji}</span>
                                {lv.label}
                              </span>
                            );
                          })()}
                          {gap !== null && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {gap > 0 ? (
                                <>
                                  <TrendDown01 width={11} height={11} style={{ color: "#ef4444", flexShrink: 0 }} />
                                  <span className="text-[10px]" style={{ color: "#ef4444" }}>
                                    {gap} pts arriba tuyo
                                  </span>
                                </>
                              ) : (
                                <>
                                  <TrendUp01 width={11} height={11} style={{ color: "#16a34a", flexShrink: 0 }} />
                                  <span className="text-[10px]" style={{ color: "#16a34a" }}>
                                    {Math.abs(gap)} pts abajo tuyo
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          {!isGlobal && (
                            <>
                              <span
                                className="w-8 text-center text-sm font-semibold tabular-nums"
                                style={{ color: "#16a34a" }}
                              >
                                {(entry as LeaderboardEntry).exact_results ?? 0}
                              </span>
                              <span
                                className="w-8 text-center text-sm font-semibold tabular-nums"
                                style={{ color: "#d97706" }}
                              >
                                {(entry as LeaderboardEntry).partial_results ?? 0}
                              </span>
                            </>
                          )}
                          <span
                            className="w-8 text-right text-base font-extrabold tabular-nums"
                            style={{
                              fontFamily: "Inter, sans-serif",
                              color: isMe
                                ? "var(--color-brand-700, #003da5)"
                                : "var(--color-gray-900, #181d27)",
                            }}
                          >
                            {pts}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── NIVELES legend ──────────────────────────────────────── */}
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.06)" }}
            >
              <button
                onClick={() => setLevelsOpen((o) => !o)}
                className="w-full px-4 py-3 flex items-center gap-2 active:opacity-70 transition-opacity"
              >
                <Zap width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                <p
                  className="text-xs font-semibold uppercase tracking-wider flex-1 text-left"
                  style={{ color: "var(--color-gray-500, #717680)" }}
                >
                  Niveles
                </p>
                <ChevronDown
                  width={15}
                  height={15}
                  style={{
                    color: "var(--color-gray-400, #a4a7ae)",
                    transform: levelsOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
              {levelsOpen && (
                <div
                  className="px-4 pb-3 pt-1 space-y-2"
                  style={{ borderTop: "1px solid var(--color-gray-100, #f5f5f5)" }}
                >
                  {LEVELS.map((lv) => (
                    <div key={lv.label} className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: lv.bg }}
                      >
                        {lv.emoji}
                      </span>
                      <p className="flex-1 text-sm font-semibold" style={{ color: lv.color }}>
                        {lv.label}
                      </p>
                      <span
                        className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full"
                        style={{ background: lv.bg, color: lv.color }}
                      >
                        {lv.min === lv.max ? `${lv.min} pts` : lv.max === Infinity ? `${lv.min}+ pts` : `${lv.min}–${lv.max} pts`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div
              className="card-white rounded-2xl px-4 py-3 flex items-center justify-center gap-6"
              style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.06)" }}
            >
              <div className="flex items-center gap-2">
                <Target01 width={14} height={14} style={{ color: "#16a34a" }} />
                <span className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
                  Resultado exacto = <strong>3 pts</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle width={14} height={14} style={{ color: "#d97706" }} />
                <span className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
                  Solo ganador = <strong>1 pt</strong>
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active="tabla" />
    </div>
  );
}
