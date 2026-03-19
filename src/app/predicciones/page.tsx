"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  supabase,
  type Match,
  type Prediction,
  type Group,
} from "@/lib/supabase";
import { GROUPS, isMatchEditable } from "@/lib/fixture";
import BottomNav from "@/components/layout/BottomNav";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { format, parseISO, differenceInHours, differenceInMinutes } from "date-fns";
import { es } from "date-fns/locale";
import {
  Trophy01,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  CheckDone01,
  SearchLg,
  Calendar,
  List,
  Lock01,
  Target01,
  CheckCircle,
  XCircle,
  Check,
  Globe01,
} from "@untitledui/icons";

type PredictionMap = Record<
  string,
  { home: string; away: string; saved?: boolean; points?: number }
>;
type ViewMode = "grupos" | "fechas" | "buscar";

type TeammatePred = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number | null;
};
type TeammatesMap = Record<string, TeammatePred[]>;

// ─── Urgent countdown (< 24 h to kick-off) ──────────────────────────────────
function UrgentCountdown({ match }: { match: Match }) {
  const getTimeLeft = () => {
    const diff = parseISO(match.match_date).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return { h, m };
  };
  const [t, setT] = useState(getTimeLeft);
  useEffect(() => {
    const id = setInterval(() => setT(getTimeLeft()), 30000);
    return () => clearInterval(id);
  }, []);
  if (!t) return null;
  return (
    <span
      className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
    >
      {t.h > 0 ? `${t.h}h ${t.m}m` : `${t.m}m`}
    </span>
  );
}

function PrediccionesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get("grupo");

  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(groupIdParam ?? "");
  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [teammates, setTeammates] = useState<TeammatesMap>({});
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("A");
  const [viewMode, setViewMode] = useState<ViewMode>("grupos");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [pendingCopySource, setPendingCopySource] = useState<Group | null>(null);
  const [copying, setCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      setUserId(session.user.id);

      const [{ data: matchData }, { data: memberData }] = await Promise.all([
        supabase
          .from("matches")
          .select("*")
          .eq("phase", "group")
          .order("match_date"),
        supabase
          .from("group_members")
          .select("groups(*)")
          .eq("user_id", session.user.id),
      ]);

      setMatches(matchData ?? []);
      const g = memberData?.map((m: any) => m.groups).filter(Boolean) ?? [];
      const privateGroups = g.filter((grp: Group) => !grp.is_global);
      setGroups(privateGroups);
      if (!selectedGroup && privateGroups.length > 0) setSelectedGroup(privateGroups[0].id);
      setLoading(false);
    };
    load();
  }, [router]);

  useEffect(() => {
    if (!selectedGroup || !userId) return;
    const loadPreds = async () => {
      const { data } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", userId)
        .eq("group_id", selectedGroup);

      const map: PredictionMap = {};
      data?.forEach((p: Prediction) => {
        map[p.match_id] = {
          home: String(p.predicted_home_score),
          away: String(p.predicted_away_score),
          saved: true,
          points: p.points,
        };
      });
      setPredictions(map);
    };
    loadPreds();
  }, [selectedGroup, userId]);

  useEffect(() => {
    if (!selectedGroup) return;
    const loadTeammates = async () => {
      const finishedMatchIds = matches
        .filter((m) => m.status === "finished")
        .map((m) => m.id);
      if (finishedMatchIds.length === 0) return;

      const { data } = await supabase
        .from("predictions")
        .select("*, profiles(full_name, avatar_url)")
        .eq("group_id", selectedGroup)
        .in("match_id", finishedMatchIds)
        .neq("user_id", userId);

      const map: TeammatesMap = {};
      data?.forEach((p: any) => {
        if (!map[p.match_id]) map[p.match_id] = [];
        map[p.match_id].push({
          user_id: p.user_id,
          full_name: p.profiles?.full_name ?? "Jugador",
          avatar_url: p.profiles?.avatar_url ?? null,
          predicted_home_score: p.predicted_home_score,
          predicted_away_score: p.predicted_away_score,
          points: p.points,
        });
      });
      setTeammates(map);
    };
    if (matches.length > 0) loadTeammates();
  }, [matches, selectedGroup, userId]);

  const handlePredictionChange = (
    matchId: string,
    side: "home" | "away",
    value: string,
  ) => {
    const clean = value.replace(/[^0-9]/g, "").slice(0, 2);
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: clean, saved: false },
    }));
  };

  const savePrediction = async (match: Match) => {
    if (!selectedGroup) return;
    const pred = predictions[match.id];
    if (!pred || pred.home === "" || pred.home === undefined || pred.away === "" || pred.away === undefined) return;

    setSaving(match.id);
    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: userId,
        match_id: match.id,
        group_id: selectedGroup,
        predicted_home_score: parseInt(pred.home),
        predicted_away_score: parseInt(pred.away),
      },
      { onConflict: "user_id,match_id,group_id" },
    );
    if (!error) {
      setPredictions((prev) => ({
        ...prev,
        [match.id]: { ...prev[match.id], saved: true },
      }));
    }
    setSaving(null);
  };

  const copyFromGroup = async (sourceGroupId: string) => {
    if (!selectedGroup || sourceGroupId === selectedGroup) return;
    setCopying(true);
    setCopyError(false);

    const { error: rpcError } = await supabase.rpc("copy_predictions", {
      p_source_group_id: sourceGroupId,
      p_target_group_id: selectedGroup,
    });

    if (rpcError) {
      console.error("copy_predictions error:", rpcError);
      setCopying(false);
      setShowCopyModal(false);
      setPendingCopySource(null);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 4000);
      return;
    }

    // Reload predictions for current group
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    const uid = currentSession?.user?.id;
    const { data: updated } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", uid)
      .eq("group_id", selectedGroup);
    const map: PredictionMap = {};
    updated?.forEach((p: any) => {
      map[p.match_id] = {
        home: String(p.predicted_home_score),
        away: String(p.predicted_away_score),
        saved: true,
        points: p.points,
      };
    });
    setPredictions(map);

    setCopying(false);
    setShowCopyModal(false);
    setPendingCopySource(null);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const getMatchStatus = (match: Match): "open" | "locked" | "finished" => {
    if (match.status === "finished") return "finished";
    if (!isMatchEditable(match.match_date)) return "locked";
    return "open";
  };

  // ─── Partidos urgentes: open + cierra en < 24h ──────────────────────────
  const urgentMatches = useMemo(() => {
    const now = Date.now();

    // 🔧 DEMO — partidos fake urgentes para previsualización (borrar cuando el torneo arranque)
    const DEMO_URGENT: Match[] = [
      {
        id: "demo-urgent-1",
        home_team: "Francia",
        away_team: "España",
        home_flag: "🇫🇷",
        away_flag: "🇪🇸",
        home_score: null,
        away_score: null,
        group_name: "E",
        phase: "group",
        status: "scheduled",
        match_date: new Date(now + 2 * 60 * 60 * 1000).toISOString(), // cierra en 2 horas
        city: "Dallas",
      } as any,
      {
        id: "demo-urgent-2",
        home_team: "Alemania",
        away_team: "Portugal",
        home_flag: "🇩🇪",
        away_flag: "🇵🇹",
        home_score: null,
        away_score: null,
        group_name: "F",
        phase: "group",
        status: "scheduled",
        match_date: new Date(now + 5 * 60 * 60 * 1000).toISOString(), // cierra en 5 horas
        city: "Los Ángeles",
      } as any,
    ];

    const real = matches.filter((m) => {
      if (m.status === "finished") return false;
      const ms = parseISO(m.match_date).getTime();
      const hoursDiff = (ms - now) / 3600000;
      const hasPred = predictions[m.id]?.saved;
      return hoursDiff >= 0 && hoursDiff < 24 && !hasPred;
    });

    // DEMO siempre sin predicción guardada, los reales filtran normalmente
    return [...DEMO_URGENT, ...real];
  }, [matches, predictions]);


  // ─── Progreso por grupo de copa (A-L) ───────────────────────────────────
  const groupProgress = useMemo(() => {
    return GROUPS.map((g) => {
      const groupMatches = matches.filter((m) => m.group_name === g);
      const total = groupMatches.length;
      const done = groupMatches.filter((m) => predictions[m.id]?.saved).length;
      return { group: g, total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    });
  }, [matches, predictions]);

  const totalMatches = matches.length;
  const totalDone = matches.filter((m) => predictions[m.id]?.saved).length;
  const overallPct = totalMatches > 0 ? Math.round((totalDone / totalMatches) * 100) : 0;

  const matchesByDate = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    matches.forEach((m) => {
      const dateKey = format(parseISO(m.match_date), "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(m);
    });
    return grouped;
  }, [matches]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return matches.filter(
      (m) =>
        m.home_team.toLowerCase().includes(q) ||
        m.away_team.toLowerCase().includes(q),
    );
  }, [matches, searchQuery]);

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

  const matchCardProps = (match: Match) => ({
    match,
    prediction: predictions[match.id],
    status: getMatchStatus(match),
    saving: saving === match.id,
    selectedGroup,
    teammatesPreds: teammates[match.id] ?? [],
    expanded: expandedMatch === match.id,
    onToggleExpand: () =>
      setExpandedMatch((prev) => (prev === match.id ? null : match.id)),
    onChange: handlePredictionChange,
    onSave: savePrediction,
  });

  return (
    <div
      className="min-h-dvh pb-24 page-gradient"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div
        className="relative px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: 16,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #003da5 0%, #1a55bd 100%)",
                boxShadow: "0 2px 8px rgba(0,61,165,0.35)",
              }}
            >
              <Trophy01 width={20} height={20} style={{ color: "white" }} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium leading-none mb-0.5 text-muted">
                Copa del Mundo 2026
              </p>
              <h1
                className="leading-tight"
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--color-gray-900, #181d27)",
                }}
              >
                Mis Predicciones
              </h1>
            </div>
          </div>

          {/* Right: action pills */}
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

      <div className="px-4 relative z-10 space-y-4">

        {/* ── NO GRUPO ────────────────────────────────────────────────────── */}
        {groups.length === 0 && (
          <div
            className="card-white rounded-2xl p-5 text-center"
            style={{
              border: "1px solid var(--color-gray-200, #e9eaeb)",
              boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "var(--color-gray-100, #f5f5f5)" }}
            >
              <Trophy01 width={22} height={22} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
            </div>
            <p
              className="font-bold text-sm mb-1"
              style={{ color: "var(--color-gray-900, #181d27)" }}
            >
              Necesitás un grupo para predecir
            </p>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--color-gray-500, #717680)" }}
            >
              Las predicciones se guardan dentro de un grupo.
            </p>
            <button
              onClick={() => router.push("/grupos")}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
              style={{ background: "var(--color-brand-600, #003da5)" }}
            >
              Crear o unirme a un grupo <ChevronRight width={14} height={14} />
            </button>
          </div>
        )}

        {groups.length > 0 && (
          <>
            {/* ── SELECTOR DE GRUPO ──────────────────────────────────────── */}
            {groups.length > 1 && (
              <div
                className="card-white rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid var(--color-gray-200, #e9eaeb)",
                  boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
                }}
              >
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
                >
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    Jugando en
                  </span>
                </div>
                <div className="px-3 py-2.5 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroup(g.id)}
                      className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                      style={
                        selectedGroup === g.id
                          ? g.is_global
                            ? { background: "linear-gradient(135deg, #C8A84B, #b8942e)", color: "white" }
                            : { background: "var(--color-brand-600, #003da5)", color: "white" }
                          : {
                              background: "var(--color-gray-100, #f5f5f5)",
                              color: "var(--color-gray-600, #535862)",
                            }
                      }
                    >
                      {g.is_global ? "RANKING GLOBAL" : g.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── COPIAR PREDICCIONES BANNER ──────────────────────────────── */}
            {groups.length > 1 && (
              <button
                onClick={() => setShowCopyModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left active:scale-[0.98] transition-transform relative overflow-hidden"
                style={
                  copySuccess
                    ? { background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.25)" }
                    : copyError
                      ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }
                      : { background: "linear-gradient(135deg, #2a7ca8 0%, #4a9fc0 40%, #75c2e0 100%)", boxShadow: "0 4px 12px rgba(42,124,168,0.25)" }
                }
              >
                {/* Decorative icon watermark */}
                {!copySuccess && !copyError && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-15">
                    <CheckDone01 width={52} height={52} style={{ color: "white" }} />
                  </div>
                )}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
                  style={{
                    background: copySuccess ? "rgba(22,163,74,0.12)" : copyError ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.2)",
                  }}
                >
                  {copySuccess
                    ? <CheckCircle width={18} height={18} style={{ color: "#16a34a" }} />
                    : copyError
                      ? <AlertCircle width={18} height={18} style={{ color: "#ef4444" }} />
                      : <CheckDone01 width={18} height={18} style={{ color: "white" }} />
                  }
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{ color: copySuccess ? "#16a34a" : copyError ? "#ef4444" : "white" }}
                  >
                    {copySuccess ? "¡Predicciones copiadas!" : copyError ? "No se pudo copiar" : "Copiar de otro grupo"}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-snug" style={{ color: copySuccess ? "#16a34a" : copyError ? "#ef4444" : "rgba(255,255,255,0.8)" }}>
                    {copySuccess
                      ? "Tus predicciones fueron copiadas exitosamente."
                      : copyError
                        ? "Revisá tu conexión e intentá de nuevo."
                        : "Si ya completaste otro grupo, copiá todos los resultados con un toque."}
                  </p>
                </div>
                {!copySuccess && !copyError && (
                  <span className="text-sm font-bold flex-shrink-0 relative z-10" style={{ color: "white" }}>
                    →
                  </span>
                )}
              </button>
            )}

            {/* ── PROGRESO TOTAL ─────────────────────────────────────────── */}
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{
                border: "1px solid var(--color-gray-200, #e9eaeb)",
                boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
              }}
            >
              {/* Header row */}
              <div
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
              >
                <div className="flex items-center gap-2">
                  <CheckDone01
                    width={14}
                    height={14}
                    style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    Tu progreso
                  </span>
                </div>
                <span
                  className="text-xs font-bold tabular-nums"
                  style={{ color: "var(--color-gray-900, #181d27)" }}
                >
                  {totalDone}/{totalMatches}
                </span>
              </div>

              {/* Overall progress bar */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    {totalDone === 0
                      ? "¡Empezá a predecir!"
                      : totalDone === totalMatches
                        ? "¡Completaste todo! 🎉"
                        : `Faltan ${totalMatches - totalDone} partidos`}
                  </span>
                  <span
                    className="text-xs font-bold"
                    style={{ color: overallPct === 100 ? "#16a34a" : "var(--color-brand-600, #003da5)" }}
                  >
                    {overallPct}%
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "var(--color-gray-100, #f5f5f5)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${overallPct}%`,
                      background:
                        overallPct === 100
                          ? "linear-gradient(90deg, #16a34a, #22c55e)"
                          : "linear-gradient(90deg, #2a7ca8, #4a9fc0)",
                    }}
                  />
                </div>
              </div>

              {/* Per-group mini bars */}
              <div className="px-4 pb-3 pt-1">
                <div className="grid grid-cols-6 gap-1.5">
                  {groupProgress.map(({ group, total, done, pct }) => (
                    <button
                      key={group}
                      onClick={() => {
                        setViewMode("grupos");
                        setActiveTab(group);
                        // scroll to content
                        setTimeout(() => {
                          document.getElementById("match-list")?.scrollIntoView({ behavior: "smooth" });
                        }, 50);
                      }}
                      className="flex flex-col items-center gap-1 active:scale-90 transition-transform"
                    >
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--color-gray-100, #f5f5f5)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct === 100
                                ? "#16a34a"
                                : pct > 0
                                  ? "#2a7ca8"
                                  : "transparent",
                          }}
                        />
                      </div>
                      <span
                        className="text-[9px] font-bold"
                        style={{
                          color:
                            pct === 100
                              ? "#16a34a"
                              : pct > 0
                                ? "var(--color-brand-600, #003da5)"
                                : "var(--color-gray-400, #a4a7ae)",
                        }}
                      >
                        {group}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── URGENTES: CIERRA EN < 24H ──────────────────────────────── */}
            {urgentMatches.length > 0 && (
              <div
                className="card-white rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid rgba(239,68,68,0.25)",
                  boxShadow: "0 1px 8px rgba(239,68,68,0.08)",
                }}
              >
                <div
                  className="px-4 py-2.5 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(239,68,68,0.12)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                  <AlertCircle
                    width={13}
                    height={13}
                    style={{ color: "#ef4444", flexShrink: 0 }}
                  />
                  <span className="text-xs font-bold tracking-wide" style={{ color: "#ef4444" }}>
                    Cerrán pronto — completá estas primero
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(239,68,68,0.08)" }}>
                  {urgentMatches.map((match, idx) => {
                    const pred = predictions[match.id];
                    const hasPred = pred?.saved;
                    return (
                      <button
                        key={match.id}
                        onClick={() => {
                          setViewMode("grupos");
                          setActiveTab(match.group_name ?? "A");
                          setTimeout(() => {
                            document.getElementById(`match-${match.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 150);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 active:opacity-75 transition-opacity text-left"
                        style={idx < urgentMatches.length - 1 ? { borderBottom: "1px solid rgba(239,68,68,0.08)" } : {}}
                      >
                        {/* Flags */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span style={{ fontSize: 18 }}>{match.home_flag}</span>
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                          >
                            vs
                          </span>
                          <span style={{ fontSize: 18 }}>{match.away_flag}</span>
                        </div>

                        {/* Teams */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs font-semibold truncate"
                            style={{ color: "var(--color-gray-900, #181d27)" }}
                          >
                            {match.home_team} vs {match.away_team}
                          </p>
                          <p
                            className="text-[10px] mt-0.5"
                            style={{ color: "var(--color-gray-500, #717680)" }}
                          >
                            Grupo {match.group_name} ·{" "}
                            {format(parseISO(match.match_date), "d MMM · HH'h'mm", { locale: es })}
                          </p>
                        </div>

                        {/* State */}
                        <div className="flex-shrink-0">
                          {hasPred ? (
                            <span
                              className="text-[10px] font-bold px-2 py-1 rounded-lg"
                              style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}
                            >
                              ✓ {pred.home}-{pred.away}
                            </span>
                          ) : (
                            <UrgentCountdown match={match} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── VIEW MODE TABS ──────────────────────────────────────────── */}
            <div
              className="card-white rounded-2xl p-1.5 flex gap-1.5"
              style={{
                border: "1px solid var(--color-gray-200, #e9eaeb)",
                boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
              }}
            >
              {(["grupos", "fechas", "buscar"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    if (mode === "buscar")
                      setTimeout(() => document.getElementById("search-input")?.focus(), 100);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={
                    viewMode === mode
                      ? {
                          background: "var(--color-brand-600, #003da5)",
                          color: "white",
                          boxShadow: "0 2px 6px rgba(0,61,165,0.25)",
                        }
                      : {
                          color: "var(--color-gray-500, #717680)",
                        }
                  }
                >
                  <span className="flex items-center justify-center gap-1.5">
                {mode === "grupos" ? (
                  <><List width={13} height={13} /> Grupos</>
                ) : mode === "fechas" ? (
                  <><Calendar width={13} height={13} /> Fechas</>
                ) : (
                  <><SearchLg width={13} height={13} /> Buscar</>
                )}
              </span>
                </button>
              ))}
            </div>

            {/* ── SEARCH BAR ─────────────────────────────────────────────── */}
            {viewMode === "buscar" && (
              <div
                className="card-white rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid var(--color-gray-200, #e9eaeb)",
                  boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
                }}
              >
                <div className="px-4 py-3">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      id="search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscá un equipo... ej: Argentina"
                      className="w-full rounded-xl pl-9 pr-9 py-2.5 text-sm transition-colors focus:outline-none"
                      style={{
                        background: "var(--color-gray-50, #fafafa)",
                        border: "1px solid var(--color-gray-200, #e9eaeb)",
                        color: "var(--color-gray-900, #181d27)",
                      }}
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-lg leading-none"
                        style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {searchQuery && (
                    <p
                      className="text-xs mt-1.5 pl-1"
                      style={{ color: "var(--color-gray-400, #a4a7ae)" }}
                    >
                      {searchResults.length} partido{searchResults.length !== 1 ? "s" : ""} encontrado{searchResults.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── GROUP LETTER TABS ───────────────────────────────────────── */}
            {viewMode === "grupos" && (
              <div
                className="card-white rounded-2xl overflow-hidden"
                style={{
                  border: "1px solid var(--color-gray-200, #e9eaeb)",
                  boxShadow: "0 1px 3px rgba(10,13,18,0.1)",
                }}
              >
                {/* Group progress label */}
                <div
                  className="px-4 py-2 flex items-center justify-between"
                  style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
                >
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    Grupo {activeTab}
                  </span>
                  {(() => {
                    const gp = groupProgress.find((g) => g.group === activeTab);
                    if (!gp) return null;
                    return (
                      <span
                        className="text-xs font-bold flex items-center gap-1"
                        style={{
                          color:
                            gp.pct === 100
                              ? "#16a34a"
                              : gp.pct > 0
                                ? "var(--color-brand-600, #003da5)"
                                : "var(--color-gray-400, #a4a7ae)",
                        }}
                      >
                        {gp.pct === 100 && <Check width={12} height={12} />}
                        {gp.done}/{gp.total}
                      </span>
                    );
                  })()}
                </div>

                {/* Letter pills */}
                <div
                  className="flex px-3 py-2.5 gap-1.5 overflow-x-auto"
                  style={{ scrollbarWidth: "none" }}
                >
                  {GROUPS.map((g) => {
                    const gp = groupProgress.find((gp) => gp.group === g);
                    const isComplete = gp?.pct === 100;
                    const isActive = activeTab === g;
                    return (
                      <button
                        key={g}
                        onClick={() => setActiveTab(g)}
                        className="flex-shrink-0 flex flex-col items-center gap-1 active:scale-90 transition-all"
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                          style={
                            isActive
                              ? {
                                  background: "var(--color-brand-600, #003da5)",
                                  color: "white",
                                }
                              : isComplete
                                ? {
                                    background: "rgba(22,163,74,0.1)",
                                    color: "#16a34a",
                                    border: "1px solid rgba(22,163,74,0.2)",
                                  }
                                : {
                                    background: "var(--color-gray-100, #f5f5f5)",
                                    color: "var(--color-gray-600, #535862)",
                                  }
                          }
                        >
                          {isComplete && !isActive ? <Check width={14} height={14} /> : g}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── MATCH LIST ──────────────────────────────────────────────── */}
            <div id="match-list" className="space-y-3">
              {viewMode === "grupos" &&
                matches
                  .filter((m) => m.group_name === activeTab)
                  .map((match) => (
                    <div key={match.id} id={`match-${match.id}`}>
                      <MatchCard {...matchCardProps(match)} />
                    </div>
                  ))}

              {viewMode === "fechas" &&
                Object.entries(matchesByDate).map(([dateKey, dayMatches]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      <div
                        className="h-px flex-1"
                        style={{ background: "var(--color-gray-200, #e9eaeb)" }}
                      />
                      <span
                        className="text-xs font-bold uppercase tracking-wide px-1"
                        style={{ color: "var(--color-gray-500, #717680)" }}
                      >
                        {format(parseISO(dateKey + "T12:00:00"), "EEEE d 'de' MMMM", { locale: es })}
                      </span>
                      <div
                        className="h-px flex-1"
                        style={{ background: "var(--color-gray-200, #e9eaeb)" }}
                      />
                    </div>
                    <div className="space-y-3">
                      {dayMatches.map((match) => (
                        <div key={match.id} id={`match-${match.id}`}>
                          <MatchCard {...matchCardProps(match)} showGroup />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {viewMode === "buscar" && !searchQuery && (
                <div className="text-center py-10">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "var(--color-gray-100, #f5f5f5)" }}
                  >
                    <SearchLg width={22} height={22} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                  </div>
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--color-gray-500, #717680)" }}
                  >
                    Escribí el nombre de un equipo
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Argentina", "Brasil", "Francia", "España", "Alemania", "México", "Inglaterra", "Portugal"].map(
                      (team) => (
                        <button
                          key={team}
                          onClick={() => setSearchQuery(team)}
                          className="text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                          style={{
                            background: "var(--color-gray-100, #f5f5f5)",
                            color: "var(--color-gray-700, #414651)",
                            border: "1px solid var(--color-gray-200, #e9eaeb)",
                          }}
                        >
                          {team}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}

              {viewMode === "buscar" && searchQuery && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "var(--color-gray-100, #f5f5f5)" }}
                  >
                    <XCircle width={22} height={22} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                  </div>
                  <p style={{ color: "var(--color-gray-500, #717680)" }} className="text-sm">
                    No encontramos &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              )}

              {viewMode === "buscar" &&
                searchResults.map((match) => (
                  <div key={match.id} id={`match-${match.id}`}>
                    <MatchCard {...matchCardProps(match)} showGroup />
                  </div>
                ))}
            </div>
          </>
        )}
      </div>

      <BottomNav active="predicciones" />

      {/* ── COPY MODAL ─────────────────────────────────────────────────── */}
      {showCopyModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => { setShowCopyModal(false); setPendingCopySource(null); }}
        >
          <div
            className="w-full rounded-t-3xl overflow-hidden"
            style={{ maxWidth: 480, background: "var(--color-surface, white)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: "var(--color-gray-200, #e9eaeb)" }} />
            </div>

            {pendingCopySource ? (
              /* ── PASO 2: CONFIRMACIÓN ── */
              <div className="px-5 pt-2">
                <p className="text-base font-extrabold mb-0.5" style={{ color: "var(--color-gray-900, #181d27)" }}>
                  Confirmá la copia
                </p>
                <p className="text-sm mb-5" style={{ color: "var(--color-gray-500, #717680)" }}>
                  Se sobreescribirán las predicciones existentes en el grupo destino.
                </p>

                {/* FROM → TO diagram */}
                <div
                  className="rounded-2xl p-4 mb-5 flex items-center gap-3"
                  style={{ background: "var(--color-gray-50, #fafafa)", border: "1px solid var(--color-gray-200, #e9eaeb)" }}
                >
                  {/* Source */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                      Desde
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--color-brand-50, #eff4ff)", border: "1px solid var(--color-brand-100, #d1e0ff)" }}
                      >
                        <Trophy01 width={14} height={14} style={{ color: "var(--color-brand-600, #003da5)" }} />
                      </div>
                      <p className="text-sm font-bold truncate" style={{ color: "var(--color-gray-900, #181d27)" }}>
                        {pendingCopySource.name}
                      </p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 px-1">
                    <ChevronRight width={18} height={18} style={{ color: "var(--color-gray-300, #d5d7da)" }} />
                  </div>

                  {/* Destination */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                      Hacia
                    </p>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(42,124,168,0.12)", border: "1px solid rgba(42,124,168,0.2)" }}
                      >
                        <Trophy01 width={14} height={14} style={{ color: "#2a7ca8" }} />
                      </div>
                      <p className="text-sm font-bold truncate" style={{ color: "var(--color-gray-900, #181d27)" }}>
                        {groups.find((g) => g.id === selectedGroup)?.name ?? "Grupo actual"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  disabled={copying}
                  onClick={() => copyFromGroup(pendingCopySource.id)}
                  className="w-full py-3 rounded-2xl text-sm font-bold active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #2a7ca8, #4a9fc0)", color: "white" }}
                >
                  {copying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "white", borderTopColor: "transparent" }} />
                      Copiando...
                    </>
                  ) : (
                    "Confirmar copia"
                  )}
                </button>
                <button
                  disabled={copying}
                  onClick={() => setPendingCopySource(null)}
                  className="mt-2 w-full py-3 rounded-2xl text-sm font-semibold active:opacity-70 disabled:opacity-50"
                  style={{ background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }}
                >
                  Volver
                </button>
              </div>
            ) : (
              /* ── PASO 1: ELEGIR ORIGEN ── */
              <div className="px-5 pt-2">
                <p className="text-base font-extrabold mb-0.5" style={{ color: "var(--color-gray-900, #181d27)" }}>
                  Copiar predicciones
                </p>
                <p className="text-sm mb-4" style={{ color: "var(--color-gray-500, #717680)" }}>
                  ¿De qué grupo querés copiar al grupo actual?
                </p>
                <div className="space-y-2">
                  {groups
                    .filter((g) => g.id !== selectedGroup)
                    .map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setPendingCopySource(g)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left active:opacity-70 transition-opacity"
                        style={{ background: "var(--color-gray-50, #fafafa)", border: "1px solid var(--color-gray-200, #e9eaeb)" }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--color-brand-50, #eff4ff)" }}
                        >
                          <Trophy01 width={15} height={15} style={{ color: "var(--color-brand-600, #003da5)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-gray-900, #181d27)" }}>
                            {g.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                            Copiar todos los resultados de este grupo
                          </p>
                        </div>
                        <ChevronRight width={15} height={15} style={{ color: "var(--color-gray-300, #d5d7da)", flexShrink: 0 }} />
                      </button>
                    ))}
                </div>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="mt-3 w-full py-3 rounded-2xl text-sm font-semibold active:opacity-70"
                  style={{ background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Espacio para el BottomNav + safe area */}
            <div style={{ height: "calc(env(safe-area-inset-bottom, 0px) + 84px)" }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MATCH CARD — redesigned to match dashboard/perfil card style
// ═══════════════════════════════════════════════════════════════════

type MatchCardProps = {
  match: Match;
  prediction?: { home: string; away: string; saved?: boolean; points?: number };
  status: "open" | "locked" | "finished";
  saving: boolean;
  selectedGroup: string;
  showGroup?: boolean;
  teammatesPreds: TeammatePred[];
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (matchId: string, side: "home" | "away", value: string) => void;
  onSave: (match: Match) => void;
};

function MatchCard({
  match,
  prediction,
  status,
  saving,
  selectedGroup,
  showGroup,
  teammatesPreds,
  expanded,
  onToggleExpand,
  onChange,
  onSave,
}: MatchCardProps) {
  const hasUnsaved =
    prediction &&
    !prediction.saved &&
    prediction.home !== "" &&
    prediction.away !== "";

  const matchDate = parseISO(match.match_date);
  const hasTeammates = status === "finished" && teammatesPreds.length > 0;

  const isEditing =
    (prediction?.home !== undefined || prediction?.away !== undefined) &&
    !prediction?.saved &&
    status === "open";

  // ── Urgency: is this match closing in < 24h? ──
  const hoursToKickoff = (parseISO(match.match_date).getTime() - Date.now()) / 3600000;
  const isUrgent = status === "open" && hoursToKickoff >= 0 && hoursToKickoff < 24 && !prediction?.saved;

  const pointsInfo = (() => {
    if (status !== "finished" || !prediction) return null;
    if (prediction.points === 3) return { label: "+3 pts", icon: <Target01 width={11} height={11} />, bg: "rgba(22,163,74,0.12)", color: "#16a34a" };
    if (prediction.points === 1) return { label: "+1 pt", icon: <CheckCircle width={11} height={11} />, bg: "rgba(245,158,11,0.12)", color: "#d97706" };
    if (prediction.points === 0) return { label: "0 pts", icon: <XCircle width={11} height={11} />, bg: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-400, #a4a7ae)" };
    return null;
  })();

  const getPredBadgeIcon = (pts: number | null) => {
    if (pts === 3) return <Target01 width={13} height={13} style={{ color: "#16a34a", flexShrink: 0 }} />;
    if (pts === 1) return <CheckCircle width={13} height={13} style={{ color: "#d97706", flexShrink: 0 }} />;
    if (pts === 0) return <XCircle width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)", flexShrink: 0 }} />;
    return null;
  };

  return (
    <div
      id={`match-${match.id}`}
      className="card-white rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        border: isUrgent
          ? "1px solid rgba(239,68,68,0.3)"
          : isEditing
            ? "1px solid rgba(42,124,168,0.4)"
            : "1px solid var(--color-gray-200, #e9eaeb)",
        boxShadow: isUrgent
          ? "0 2px 12px rgba(239,68,68,0.1)"
          : isEditing
            ? "0 2px 12px rgba(42,124,168,0.12)"
            : "0 1px 3px rgba(10,13,18,0.08)",
      }}
    >
      {/* ── Card header bar ────────────────────────────────────────────── */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
      >
        <div className="flex items-center gap-2">
          {showGroup && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
              style={{ background: "var(--color-brand-600, #003da5)" }}
            >
              G{match.group_name}
            </span>
          )}
          {isUrgent && (
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "#ef4444" }}>
              <AlertCircle width={10} height={10} /> Urgente
            </span>
          )}
          {status === "locked" && !isUrgent && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"
              style={{ background: "rgba(245,158,11,0.1)", color: "#d97706" }}
            >
              <Lock01 width={10} height={10} /> Bloqueado
            </span>
          )}
          {status === "finished" && pointsInfo && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1"
              style={{ background: pointsInfo.bg, color: pointsInfo.color }}
            >
              {pointsInfo.icon}{pointsInfo.label}
            </span>
          )}
          {status === "finished" && !prediction && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-md"
              style={{
                background: "var(--color-gray-100, #f5f5f5)",
                color: "var(--color-gray-500, #717680)",
              }}
            >
              Sin predicción
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isUrgent && <UrgentCountdown match={match} />}
          <span
            className="text-[11px] font-medium"
            style={{ color: "var(--color-gray-400, #a4a7ae)" }}
          >
            {format(matchDate, "d MMM · HH'h'mm", { locale: es })}
          </span>
        </div>
      </div>

      {/* ── Teams + score/inputs ────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Home team */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span style={{ fontSize: 26 }}>{match.home_flag}</span>
            <p
              className="text-[11px] font-semibold text-center leading-tight truncate w-full"
              style={{ color: "var(--color-gray-700, #414651)" }}
            >
              {match.home_team}
            </p>
          </div>

          {/* Score / inputs */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            {status === "finished" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 28,
                      fontWeight: 800,
                      color: "var(--color-gray-900, #181d27)",
                      lineHeight: 1,
                    }}
                  >
                    {match.home_score ?? "–"}
                  </span>
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 18,
                      fontWeight: 300,
                      color: "var(--color-gray-300, #d5d7da)",
                      lineHeight: 1,
                    }}
                  >
                    :
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 28,
                      fontWeight: 800,
                      color: "var(--color-gray-900, #181d27)",
                      lineHeight: 1,
                    }}
                  >
                    {match.away_score ?? "–"}
                  </span>
                </div>
                {prediction && (
                  <div
                    className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                    style={{
                      background: "var(--color-brand-50, #eff4ff)",
                      border: "1px solid var(--color-brand-100, #d1e0ff)",
                    }}
                  >
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: "var(--color-brand-500, #1a55bd)" }}
                    >
                      Tu pred
                    </span>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        color: "var(--color-brand-700, #003da5)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {prediction.home} – {prediction.away}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={prediction?.home ?? ""}
                  onChange={(e) => onChange(match.id, "home", e.target.value)}
                  onBlur={() => hasUnsaved && onSave(match)}
                  disabled={status === "locked" || !selectedGroup}
                  className={`score-input ${!prediction?.home && prediction?.home !== "0" ? "score-input-empty" : ""}`}
                  placeholder="?"
                />
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 20,
                    fontWeight: 300,
                    color: "var(--color-gray-300, #d5d7da)",
                    lineHeight: 1,
                  }}
                >
                  :
                </span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={prediction?.away ?? ""}
                  onChange={(e) => onChange(match.id, "away", e.target.value)}
                  onBlur={() => hasUnsaved && onSave(match)}
                  disabled={status === "locked" || !selectedGroup}
                  className={`score-input ${!prediction?.away && prediction?.away !== "0" ? "score-input-empty" : ""}`}
                  placeholder="?"
                />
              </div>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span style={{ fontSize: 26 }}>{match.away_flag}</span>
            <p
              className="text-[11px] font-semibold text-center leading-tight truncate w-full"
              style={{ color: "var(--color-gray-700, #414651)" }}
            >
              {match.away_team}
            </p>
          </div>
        </div>

        {/* Save status */}
        {status === "open" && selectedGroup && (
          <div className="mt-3 flex items-center justify-center">
            {saving ? (
              <span
                className="text-xs flex items-center gap-1.5"
                style={{ color: "var(--color-gray-500, #717680)" }}
              >
                <span
                  className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "#2a7ca8", borderTopColor: "transparent" }}
                />
                Guardando...
              </span>
            ) : prediction?.saved ? (
              <span className="text-xs flex items-center gap-1.5 font-semibold" style={{ color: "#16a34a" }}>
                <CheckCircle width={13} height={13} /> Guardado
              </span>
            ) : hasUnsaved ? (
              <button
                onClick={() => onSave(match)}
                className="text-xs text-white px-4 py-1.5 rounded-full font-semibold active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(90deg, #2a7ca8, #4a9fc0)",
                  boxShadow: "0 2px 6px rgba(42,124,168,0.3)",
                }}
              >
                Guardar predicción
              </button>
            ) : (
              // Empty state — no prediction yet
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                style={{
                  background: "var(--color-brand-50, #eff4ff)",
                  border: "1px dashed var(--color-brand-200, #9ab7ee)",
                }}
              >
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: "var(--color-brand-600, #003da5)" }}
                >
                  Ingresá tu resultado
                </span>
                <ChevronRight
                  width={12}
                  height={12}
                  style={{ color: "var(--color-brand-400, #4a77d9)", flexShrink: 0 }}
                />
              </div>
            )}
          </div>
        )}

        {/* Expand teammates button */}
        {hasTeammates && (
          <button
            onClick={onToggleExpand}
            className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl active:scale-95 transition-transform"
            style={{
              background: "var(--color-gray-50, #fafafa)",
              border: "1px solid var(--color-gray-100, #f5f5f5)",
              color: "var(--color-brand-600, #003da5)",
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {expanded ? "Ocultar" : `Ver predicciones del grupo (${teammatesPreds.length})`}
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Teammates panel ─────────────────────────────────────────────── */}
      {expanded && hasTeammates && (
        <div
          style={{ borderTop: "1px solid var(--color-gray-100, #f5f5f5)" }}
        >
          <div
            className="px-4 py-2"
            style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-gray-400, #a4a7ae)" }}
            >
              Predicciones del grupo
            </p>
          </div>
          <div>
            {teammatesPreds
              .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
              .map((t, idx) => (
                <div
                  key={t.user_id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={
                    idx < teammatesPreds.length - 1
                      ? { borderBottom: "1px solid var(--color-gray-50, #fafafa)" }
                      : {}
                  }
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #003da5, #1a55bd)" }}
                  >
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {t.full_name[0]}
                      </span>
                    )}
                  </div>
                  <span
                    className="flex-1 text-xs font-semibold truncate"
                    style={{ color: "var(--color-gray-700, #414651)" }}
                  >
                    {t.full_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontWeight: 700,
                        color: "var(--color-gray-900, #181d27)",
                      }}
                    >
                      {t.predicted_home_score} - {t.predicted_away_score}
                    </span>
                    {getPredBadgeIcon(t.points)}
                    {t.points !== null && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={
                          t.points === 3
                            ? { background: "rgba(22,163,74,0.1)", color: "#16a34a" }
                            : t.points === 1
                              ? { background: "rgba(245,158,11,0.1)", color: "#d97706" }
                              : {
                                  background: "var(--color-gray-100, #f5f5f5)",
                                  color: "var(--color-gray-400, #a4a7ae)",
                                }
                        }
                      >
                        {t.points > 0 ? `+${t.points}` : "0"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );

}

export default function PrediccionesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center page-gradient">
          <div
            className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#1e6a94", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <PrediccionesContent />
    </Suspense>
  );
}
