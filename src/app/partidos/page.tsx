"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Match } from "@/lib/supabase";
import { GROUPS, GROUP_TEAMS } from "@/lib/fixture";
import BottomNav from "@/components/layout/BottomNav";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Map01,
  ClipboardCheck,
  BarChart01,
  Trophy01,
  HelpCircle,
} from "@untitledui/icons";
import LiveMatchCarousel from "@/components/LiveMatchCarousel";

type Phase =
  | "grupos"
  | "32avos"
  | "16avos"
  | "octavos"
  | "cuartos"
  | "semis"
  | "final";
type View = "fixture" | "grupos";

const BRACKET_32: { home: string; away: string }[] = [
  { home: "1° Grupo A", away: "3° Grupo C/D/E" },
  { home: "1° Grupo C", away: "3° Grupo A/B/F" },
  { home: "1° Grupo E", away: "3° Grupo G/H/I" },
  { home: "1° Grupo G", away: "3° Grupo J/K/L" },
  { home: "1° Grupo I", away: "3° Grupo A/B/C" },
  { home: "1° Grupo K", away: "3° Grupo D/E/F" },
  { home: "2° Grupo B", away: "2° Grupo A" },
  { home: "2° Grupo D", away: "2° Grupo C" },
  { home: "2° Grupo F", away: "2° Grupo E" },
  { home: "2° Grupo H", away: "2° Grupo G" },
  { home: "2° Grupo J", away: "2° Grupo I" },
  { home: "2° Grupo L", away: "2° Grupo K" },
  { home: "1° Grupo B", away: "3° Grupo G/H/J" },
  { home: "1° Grupo D", away: "3° Grupo I/K/L" },
  { home: "1° Grupo F", away: "3° Grupo A/B/D" },
  { home: "1° Grupo L", away: "1° Grupo J" },
];

type StandingRow = {
  team: string;
  flag: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
};

function buildStandings(groupName: string, matches: Match[]): StandingRow[] {
  const teams = GROUP_TEAMS[groupName] ?? [];
  const flagMap: Record<string, string> = {};
  matches.forEach((m) => {
    flagMap[m.home_team] = m.home_flag || "";
    flagMap[m.away_team] = m.away_flag || "";
  });

  const rows: Record<string, StandingRow> = {};
  teams.forEach((t) => {
    rows[t] = { team: t, flag: flagMap[t] ?? "", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
  });

  matches
    .filter((m) => m.group_name === groupName && m.status === "finished" && m.home_score !== null && m.away_score !== null)
    .forEach((m) => {
      const h = rows[m.home_team];
      const a = rows[m.away_team];
      if (!h || !a) return;
      const hs = m.home_score!;
      const as_ = m.away_score!;
      h.played++; a.played++;
      h.gf += hs; h.ga += as_;
      a.gf += as_; a.ga += hs;
      if (hs > as_) { h.won++; h.points += 3; a.lost++; }
      else if (hs < as_) { a.won++; a.points += 3; h.lost++; }
      else { h.drawn++; h.points++; a.drawn++; a.points++; }
    });

  return Object.values(rows).sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

const PHASE_LABELS: Record<Phase, string> = {
  grupos: "Grupos",
  "32avos": "32avos",
  "16avos": "16avos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semis: "Semis",
  final: "Final",
};

// ── Match card (full-width list style) ─────────────────────────────────────
function MatchCard({ match, status }: { match: Match; status: "finished" | "live" | "upcoming" }) {
  const isFinished  = status === "finished";
  const isLive      = status === "live";
  const homeWon     = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon     = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);

  return (
    <div
      className="card-white rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
    >
      {/* Meta row */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)", background: "var(--color-gray-50, #fafafa)" }}
      >
        <div className="flex items-center gap-1.5">
          <Map01 width={11} height={11} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
          <span className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
            {match.city}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-500">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              EN VIVO
            </span>
          )}
          {isFinished && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-500, #717680)" }}
            >
              Finalizado
            </span>
          )}
          <span className="text-xs tabular-nums" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
            {format(parseISO(match.match_date), "d MMM · HH'h'mm", { locale: es })}
          </span>
        </div>
      </div>

      {/* Teams + score */}
      <div className="px-4 py-3.5 flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <span style={{ fontSize: 26, lineHeight: 1 }}>{match.home_flag}</span>
          <span
            className="text-sm font-semibold truncate"
            style={{ color: homeWon ? "var(--color-gray-900, #181d27)" : awayWon ? "var(--color-gray-400, #a4a7ae)" : "var(--color-gray-800, #1d2939)" }}
          >
            {match.home_team}
          </span>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 flex items-center gap-1 min-w-[64px] justify-center">
          {isFinished ? (
            <>
              <span className="font-extrabold text-xl tabular-nums" style={{ color: homeWon ? "var(--color-brand-600, #003da5)" : "var(--color-gray-700, #414651)", fontFamily: "Inter, sans-serif" }}>
                {match.home_score}
              </span>
              <span className="text-sm" style={{ color: "var(--color-gray-300, #d5d7da)" }}>-</span>
              <span className="font-extrabold text-xl tabular-nums" style={{ color: awayWon ? "var(--color-brand-600, #003da5)" : "var(--color-gray-700, #414651)", fontFamily: "Inter, sans-serif" }}>
                {match.away_score}
              </span>
            </>
          ) : isLive ? (
            <>
              <span className="font-extrabold text-xl tabular-nums text-red-500">{match.home_score ?? "·"}</span>
              <span className="text-sm text-red-300">-</span>
              <span className="font-extrabold text-xl tabular-nums text-red-500">{match.away_score ?? "·"}</span>
            </>
          ) : (
            <span className="text-sm font-semibold" style={{ color: "var(--color-gray-300, #d5d7da)" }}>vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 flex items-center gap-2.5 justify-end min-w-0">
          <span
            className="text-sm font-semibold truncate text-right"
            style={{ color: awayWon ? "var(--color-gray-900, #181d27)" : homeWon ? "var(--color-gray-400, #a4a7ae)" : "var(--color-gray-800, #1d2939)" }}
          >
            {match.away_team}
          </span>
          <span style={{ fontSize: 26, lineHeight: 1 }}>{match.away_flag}</span>
        </div>
      </div>
    </div>
  );
}

// ── Bracket slot ────────────────────────────────────────────────────────────
function BracketSlot({ home, away, match }: { home: string; away: string; match?: Match }) {
  const hasMatch = !!match;
  const finished = match?.status === "finished";
  const homeWon = finished && (match!.home_score ?? 0) > (match!.away_score ?? 0);
  const awayWon = finished && (match!.away_score ?? 0) > (match!.home_score ?? 0);

  return (
    <div
      className="card-white rounded-2xl overflow-hidden min-w-[170px]"
      style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
    >
      {/* Home row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{
          borderBottom: "1px solid var(--color-gray-100, #f5f5f5)",
          background: homeWon ? "var(--color-brand-50, #eff4ff)" : "transparent",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{hasMatch ? match!.home_flag : "🏳"}</span>
        <span className="text-xs font-semibold flex-1 truncate" style={{ color: homeWon ? "var(--color-brand-700, #003da5)" : "var(--color-gray-700, #414651)" }}>
          {hasMatch ? match!.home_team : home}
        </span>
        {finished && (
          <span className="text-sm font-bold tabular-nums" style={{ color: homeWon ? "var(--color-brand-600, #003da5)" : "var(--color-gray-400, #a4a7ae)" }}>
            {match!.home_score}
          </span>
        )}
      </div>
      {/* Away row */}
      <div
        className="flex items-center gap-2 px-3 py-2.5"
        style={{ background: awayWon ? "var(--color-brand-50, #eff4ff)" : "transparent" }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{hasMatch ? match!.away_flag : "🏳"}</span>
        <span className="text-xs font-semibold flex-1 truncate" style={{ color: awayWon ? "var(--color-brand-700, #003da5)" : "var(--color-gray-700, #414651)" }}>
          {hasMatch ? match!.away_team : away}
        </span>
        {finished && (
          <span className="text-sm font-bold tabular-nums" style={{ color: awayWon ? "var(--color-brand-600, #003da5)" : "var(--color-gray-400, #a4a7ae)" }}>
            {match!.away_score}
          </span>
        )}
      </div>
      {!hasMatch && (
        <div className="px-3 py-1.5" style={{ background: "var(--color-gray-50, #fafafa)", borderTop: "1px solid var(--color-gray-100, #f5f5f5)" }}>
          <p className="text-[10px] text-center font-medium" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>Por definir</p>
        </div>
      )}
    </div>
  );
}

function BracketPhase({ title, slots, matches }: { title: string; slots: { home: string; away: string }[]; matches: Match[] }) {
  return (
    <div className="flex-shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-center mb-3 px-2" style={{ color: "var(--color-gray-500, #717680)" }}>
        {title}
      </p>
      <div className="flex flex-col gap-3 px-2">
        {slots.map((slot, i) => (
          <BracketSlot key={i} home={slot.home} away={slot.away} match={matches[i]} />
        ))}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function PartidosPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("grupos");
  const [view, setView] = useState<View>("fixture");
  const [activeGroup, setActiveGroup] = useState("A");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("matches").select("*").order("match_date");
      setMatches(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const groupMatches = useMemo(
    () => matches.filter((m) => m.group_name === activeGroup && m.phase === "group"),
    [matches, activeGroup],
  );

  const standings = useMemo(() => buildStandings(activeGroup, matches), [matches, activeGroup]);

  const getMatchesForPhase = (p: Phase) => {
    const dbPhase: Record<Phase, string> = {
      grupos: "group",
      "32avos": "round_of_32",
      "16avos": "round_of_16",
      octavos: "round_of_8",
      cuartos: "round_of_8",
      semis: "semifinal",
      final: "final",
    };
    return matches.filter((m) => m.phase === dbPhase[p]);
  };

  const getStatus = (match: Match): "finished" | "live" | "upcoming" => {
    if (match.status === "finished") return "finished";
    const start = parseISO(match.match_date).getTime();
    const now = Date.now();
    if (now >= start && now <= start + 2 * 60 * 60 * 1000) return "live";
    return "upcoming";
  };

  const BRACKET_16 = Array.from({ length: 8 }, (_, i) => ({ home: `Ganador P${i * 2 + 1}`, away: `Ganador P${i * 2 + 2}` }));
  const BRACKET_8  = Array.from({ length: 4 }, (_, i) => ({ home: `Ganador C${i * 2 + 1}`, away: `Ganador C${i * 2 + 2}` }));
  const BRACKET_4  = [{ home: "Ganador 1", away: "Ganador 2" }, { home: "Ganador 3", away: "Ganador 4" }];
  const BRACKET_FINAL = [{ home: "Semifinalista 1", away: "Semifinalista 2" }];

  const eliminationPhases: Phase[] = ["32avos", "16avos", "octavos", "cuartos", "semis", "final"];

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center page-gradient">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--color-brand-200, #b2ccff)", borderTopColor: "var(--color-brand-600, #003da5)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24 page-gradient" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        className="relative px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", paddingBottom: 16 }}
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
                style={{ fontSize: 18, fontWeight: 800, color: "var(--color-gray-900, #181d27)" }}
              >
                Partidos
              </h1>
            </div>
          </div>

          {/* Right: glass-pill actions */}
          <div className="flex items-center gap-1 flex-shrink-0 px-1.5 py-1.5 rounded-2xl glass-pill">
            <button
              onClick={() => router.push("/ayuda")}
              className="w-8 h-8 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-btn"
            >
              <HelpCircle className="glass-btn" width={18} height={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── EN VIVO + PRÓXIMOS PARTIDOS ───────────────────────────────── */}
      {(() => {
        const now = Date.now();

        // 🔧 DEMO — partidos fake en vivo para previsualización (borrar cuando el torneo arranque)
        const DEMO_LIVE = [
          {
            id: "demo-live-1",
            home_team: "Argentina",
            away_team: "Brasil",
            home_flag: "🇦🇷",
            away_flag: "🇧🇷",
            home_score: 1,
            away_score: 0,
            group_name: "C",
            phase: "group",
            status: "live",
            match_date: new Date(now - 30 * 60 * 1000).toISOString(),
            city: "Buenos Aires",
          } as any,
          {
            id: "demo-live-2",
            home_team: "Francia",
            away_team: "España",
            home_flag: "🇫🇷",
            away_flag: "🇪🇸",
            home_score: 0,
            away_score: 2,
            group_name: "E",
            phase: "group",
            status: "live",
            match_date: new Date(now - 62 * 60 * 1000).toISOString(),
            city: "Dallas",
          } as any,
        ];

        const liveMatches = [
          ...DEMO_LIVE,
          ...matches.filter((m) => {
            const start = parseISO(m.match_date).getTime();
            return m.status !== "finished" && now >= start && now <= start + 2 * 60 * 60 * 1000;
          }),
        ];
        const upcoming = matches
          .filter((m) => m.status !== "finished" && parseISO(m.match_date).getTime() > now)
          .sort((a, b) => parseISO(a.match_date).getTime() - parseISO(b.match_date).getTime())
          .slice(0, 5);

        if (liveMatches.length === 0 && upcoming.length === 0) return null;

        return (
          <div className="px-4 mb-4 space-y-3">

            {/* EN VIVO — carousel */}
            {liveMatches.length > 0 && <LiveMatchCarousel matches={liveMatches} />}

            {/* PRÓXIMOS — horizontal scroll */}
            {upcoming.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-gray-500, #717680)" }}>
                  Próximos partidos
                </p>
                <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {upcoming.map((m) => (
                    <div
                      key={m.id}
                      className="flex-shrink-0 card-white rounded-2xl"
                      style={{ width: 130, border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
                    >
                      <div className="p-3 flex flex-col items-center gap-2">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-500, #717680)" }}
                        >
                          Grupo {m.group_name}
                        </span>
                        <div className="flex items-center gap-2 w-full justify-center">
                          <div className="flex flex-col items-center gap-1">
                            <span style={{ fontSize: 24 }}>{m.home_flag}</span>
                            <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: "var(--color-gray-700, #414651)", maxWidth: 44 }}>
                              {m.home_team}
                            </span>
                          </div>
                          <span className="text-xs font-bold" style={{ color: "var(--color-gray-300, #d5d7da)" }}>vs</span>
                          <div className="flex flex-col items-center gap-1">
                            <span style={{ fontSize: 24 }}>{m.away_flag}</span>
                            <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: "var(--color-gray-700, #414651)", maxWidth: 44 }}>
                              {m.away_team}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium tabular-nums" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                          {format(parseISO(m.match_date), "d MMM · HH'h'mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        );
      })()}


      {/* ── PHASE SELECTOR (card + flex-wrap) ──────────────────────────── */}
      <div className="px-4 mb-3">
        <div
          className="card-white rounded-2xl p-3"
          style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
        >
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(PHASE_LABELS) as Phase[]).map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                style={
                  phase === p
                    ? { background: "var(--color-brand-600, #003da5)", color: "white", boxShadow: "0 2px 6px rgba(0,61,165,0.25)" }
                    : { background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }
                }
              >
                {PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── FASE DE GRUPOS ───────────────────────────────────────────────── */}
      {phase === "grupos" && (
        <>
          {/* View toggle + group selector */}
          <div className="px-4 pt-3 pb-2">
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
            >
              {/* Fixture / Posiciones toggle */}
              <div
                className="px-3 py-2.5 flex gap-2"
                style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
              >
                <button
                  onClick={() => setView("fixture")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={view === "fixture"
                    ? { background: "var(--color-brand-600, #003da5)", color: "white", boxShadow: "0 2px 6px rgba(0,61,165,0.25)" }
                    : { background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }}
                >
                  <ClipboardCheck width={13} height={13} />
                  Fixture
                </button>
                <button
                  onClick={() => setView("grupos")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={view === "grupos"
                    ? { background: "var(--color-brand-600, #003da5)", color: "white", boxShadow: "0 2px 6px rgba(0,61,165,0.25)" }
                    : { background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }}
                >
                  <BarChart01 width={13} height={13} />
                  Posiciones
                </button>
              </div>

              {/* Group pills */}
              <div className="px-3 py-2.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                <div className="flex gap-1.5 w-max">
                  {GROUPS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      className="flex-shrink-0 w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-90"
                      style={
                        activeGroup === g
                          ? { background: "var(--color-brand-600, #003da5)", color: "white" }
                          : { background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-600, #535862)" }
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Fixture list */}
          {view === "fixture" && (
            <div className="px-4 space-y-3 pb-4">
              {groupMatches.length === 0 ? (
                <div className="card-white rounded-2xl px-5 py-10 text-center"
                  style={{ border: "1px solid var(--color-gray-200, #e9eaeb)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-gray-700, #414651)" }}>Sin partidos cargados</p>
                  <p className="text-xs" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                    Los partidos del Grupo {activeGroup} aparecerán cuando se carguen al sistema.
                  </p>
                </div>
              ) : (
                groupMatches.map((match) => (
                  <MatchCard key={match.id} match={match} status={getStatus(match)} />
                ))
              )}
            </div>
          )}

          {/* Standings table */}
          {view === "grupos" && (
            <div className="px-4 pb-4">
              <div
                className="card-white rounded-2xl overflow-hidden"
                style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
              >
                {/* Header */}
                <div
                  className="flex items-center px-4 py-2.5"
                  style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)", background: "var(--color-gray-50, #fafafa)" }}
                >
                  <div className="flex-1 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
                    Grupo {activeGroup}
                  </div>
                  {["PJ", "G", "E", "P", "GF", "GC", "Pts"].map((h) => (
                    <div
                      key={h}
                      className="w-8 text-center text-xs font-bold"
                      style={{ color: h === "Pts" ? "var(--color-brand-600, #003da5)" : "var(--color-gray-400, #a4a7ae)" }}
                    >
                      {h}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {standings.map((row, i) => (
                  <div
                    key={row.team}
                    className="flex items-center px-4 py-3"
                    style={{
                      borderTop: "1px solid var(--color-gray-100, #f5f5f5)",
                      background: i < 2 ? "var(--color-brand-50, #eff4ff)" : "transparent",
                    }}
                  >
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: i < 2 ? "var(--color-brand-600, #003da5)" : "var(--color-gray-200, #e9eaeb)",
                          color: i < 2 ? "white" : "var(--color-gray-500, #717680)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{row.flag}</span>
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--color-gray-900, #181d27)" }}>
                        {row.team}
                      </span>
                    </div>
                    {[row.played, row.won, row.drawn, row.lost, row.gf, row.ga].map((v, j) => (
                      <div key={j} className="w-8 text-center text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
                        {v}
                      </div>
                    ))}
                    <div className="w-8 text-center text-sm font-bold" style={{ color: "var(--color-brand-600, #003da5)" }}>
                      {row.points}
                    </div>
                  </div>
                ))}

                {/* Legend */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5"
                  style={{ borderTop: "1px solid var(--color-gray-100, #f5f5f5)", background: "var(--color-gray-50, #fafafa)" }}
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "var(--color-brand-600, #003da5)" }} />
                  <span className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
                    Clasifican a 32avos de final
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── FASES ELIMINATORIAS ──────────────────────────────────────────── */}
      {eliminationPhases.includes(phase) && (
        <div className="py-3 px-4 space-y-3">
          {/* Info row */}
          <div className="flex items-center gap-2">
            <Trophy01 width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
            <span className="text-xs" style={{ color: "var(--color-gray-500, #717680)" }}>
              {phase === "32avos" ? "32 equipos · 16 partidos" :
               phase === "16avos" ? "16 equipos · 8 partidos" :
               phase === "octavos" ? "8 equipos · 4 partidos" :
               phase === "cuartos" ? "4 equipos · 2 partidos" :
               phase === "semis" ? "4 equipos · 2 partidos" :
               "2 equipos · 1 partido"}
            </span>
          </div>

          {getMatchesForPhase(phase).length > 0 ? (
            <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-4" style={{ minWidth: "max-content", paddingBottom: 4 }}>
                {phase === "octavos" || phase === "cuartos" ? (
                  <>
                    <BracketPhase title="Octavos" slots={BRACKET_8} matches={getMatchesForPhase("octavos")} />
                    <div className="flex items-center"><div className="w-5 border-t border-dashed" style={{ borderColor: "var(--color-gray-200, #e9eaeb)" }} /></div>
                    <BracketPhase title="Cuartos" slots={BRACKET_4} matches={getMatchesForPhase("cuartos")} />
                  </>
                ) : phase === "semis" || phase === "final" ? (
                  <>
                    <BracketPhase title="Semifinales" slots={BRACKET_4} matches={getMatchesForPhase("semis")} />
                    <div className="flex items-center"><div className="w-5 border-t border-dashed" style={{ borderColor: "var(--color-gray-200, #e9eaeb)" }} /></div>
                    <BracketPhase title="Final" slots={BRACKET_FINAL} matches={getMatchesForPhase("final")} />
                  </>
                ) : (
                  <BracketPhase
                    title={PHASE_LABELS[phase]}
                    slots={phase === "32avos" ? BRACKET_32 : BRACKET_16}
                    matches={getMatchesForPhase(phase)}
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              className="card-white rounded-2xl px-5 py-10 text-center"
              style={{ border: "1px solid var(--color-gray-200, #e9eaeb)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "var(--color-gray-100, #f5f5f5)" }}
              >
                <Trophy01 width={22} height={22} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-gray-700, #414651)" }}>
                {PHASE_LABELS[phase]}
              </p>
              <p className="text-xs" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                Los partidos se definirán al finalizar la fase anterior.
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav active="partidos" />
    </div>
  );
}
