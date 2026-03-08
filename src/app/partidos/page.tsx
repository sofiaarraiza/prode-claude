"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Match } from "@/lib/supabase";
import { GROUPS, GROUP_TEAMS } from "@/lib/fixture";
import BottomNav from "@/components/layout/BottomNav";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Phase =
  | "grupos"
  | "32avos"
  | "16avos"
  | "octavos"
  | "cuartos"
  | "semis"
  | "final";
type View = "fixture" | "grupos";

// Cruces oficiales 32avos FIFA 2026
// Formato: [descripción local, descripción visitante]
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
  { home: "1° Grupo L", away: "1° Grupo J" }, // últimos dos grupos cruzados
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
    rows[t] = {
      team: t,
      flag: flagMap[t] ?? "🏳️",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      points: 0,
    };
  });

  matches
    .filter(
      (m) =>
        m.group_name === groupName &&
        m.status === "finished" &&
        m.home_score !== null &&
        m.away_score !== null,
    )
    .forEach((m) => {
      const h = rows[m.home_team];
      const a = rows[m.away_team];
      if (!h || !a) return;
      const hs = m.home_score!;
      const as_ = m.away_score!;
      h.played++;
      a.played++;
      h.gf += hs;
      h.ga += as_;
      a.gf += as_;
      a.ga += hs;
      if (hs > as_) {
        h.won++;
        h.points += 3;
        a.lost++;
      } else if (hs < as_) {
        a.won++;
        a.points += 3;
        h.lost++;
      } else {
        h.drawn++;
        h.points++;
        a.drawn++;
        a.points++;
      }
    });

  return Object.values(rows).sort(
    (a, b) => b.points - a.points || b.gf - b.ga - (a.gf - a.ga) || b.gf - a.gf,
  );
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

// ===================== BRACKET COMPONENT =====================
function BracketSlot({
  home,
  away,
  match,
}: {
  home: string;
  away: string;
  match?: Match;
}) {
  const hasMatch = !!match;
  const finished = match?.status === "finished";

  return (
    <div className="bg-surface rounded-2xl overflow-hidden border border-soft shadow-sm min-w-[160px]">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 border-b border-soft ${finished && match.home_score !== null && match.away_score !== null && match.home_score! > match.away_score! ? "bg-surface-2" : ""}`}
      >
        <span className="text-lg flex-shrink-0">
          {hasMatch ? match.home_flag : "🏳️"}
        </span>
        <span className="text-xs font-semibold text-[color:var(--color-text-2)] flex-1 truncate">
          {hasMatch ? match.home_team : home}
        </span>
        {finished && (
          <span className="text-sm font-bold text-[color:var(--color-primary)] tabular-nums">
            {match!.home_score}
          </span>
        )}
      </div>
      <div
        className={`flex items-center gap-2 px-3 py-2.5 ${finished && match.home_score !== null && match.away_score !== null && match.away_score! > match.home_score! ? "bg-surface-2" : ""}`}
      >
        <span className="text-lg flex-shrink-0">
          {hasMatch ? match.away_flag : "🏳️"}
        </span>
        <span className="text-xs font-semibold text-[color:var(--color-text-2)] flex-1 truncate">
          {hasMatch ? match.away_team : away}
        </span>
        {finished && (
          <span className="text-sm font-bold text-[color:var(--color-primary)] tabular-nums">
            {match!.away_score}
          </span>
        )}
      </div>
      {!hasMatch && (
        <div className="px-3 py-1.5 bg-surface-2">
          <p className="text-xs text-[color:var(--color-muted)] text-center">
            Por definir
          </p>
        </div>
      )}
    </div>
  );
}

function BracketPhase({
  title,
  slots,
  matches,
}: {
  title: string;
  slots: { home: string; away: string }[];
  matches: Match[];
}) {
  return (
    <div className="flex-shrink-0">
      <p className="text-xs font-bold text-[color:var(--color-muted)] tracking-widest text-center mb-3 px-2">
        {title.toUpperCase()}
      </p>
      <div className="flex flex-col gap-4 px-2">
        {slots.map((slot, i) => {
          const m = matches[i];
          return (
            <BracketSlot key={i} home={slot.home} away={slot.away} match={m} />
          );
        })}
      </div>
    </div>
  );
}

export default function PartidosPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("grupos");
  const [view, setView] = useState<View>("fixture");
  const [activeGroup, setActiveGroup] = useState("A");

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      const { data } = await supabase
        .from("matches")
        .select("*")
        .order("match_date");
      setMatches(data ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const groupMatches = useMemo(
    () =>
      matches.filter(
        (m) => m.group_name === activeGroup && m.phase === "group",
      ),
    [matches, activeGroup],
  );

  const standings = useMemo(
    () => buildStandings(activeGroup, matches),
    [matches, activeGroup],
  );

  const getMatchesForPhase = (p: Phase) => {
    const phaseMap: Record<Phase, string> = {
      grupos: "group",
      "32avos": "round_of_32",
      "16avos": "round_of_16",
      octavos: "quarterfinal",
      cuartos: "quarterfinal",
      semis: "semifinal",
      final: "final",
    };
    // Fix: octavos = round_of_16 en DB según implementación
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

  const getStatus = (match: Match) => {
    if (match.status === "finished") return "finished";
    const start = parseISO(match.match_date).getTime();
    const now = Date.now();
    if (now >= start && now <= start + 2 * 60 * 60 * 1000) return "live";
    return "upcoming";
  };

  // Bracket slots por fase
  const BRACKET_16: { home: string; away: string }[] = Array.from(
    { length: 8 },
    (_, i) => ({
      home: `Ganador P${i * 2 + 1}`,
      away: `Ganador P${i * 2 + 2}`,
    }),
  );
  const BRACKET_8: { home: string; away: string }[] = Array.from(
    { length: 4 },
    (_, i) => ({
      home: `Ganador C${i * 2 + 1}`,
      away: `Ganador C${i * 2 + 2}`,
    }),
  );
  const BRACKET_4 = [
    { home: "Ganador 1", away: "Ganador 2" },
    { home: "Ganador 3", away: "Ganador 4" },
  ];
  const BRACKET_FINAL = [{ home: "Semifinalista 1", away: "Semifinalista 2" }];

  if (loading) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const eliminationPhases: Phase[] = [
    "32avos",
    "16avos",
    "octavos",
    "cuartos",
    "semis",
    "final",
  ];

  return (
    <div className="min-h-dvh bg-app pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-4">
        <p className="text-white/60 text-xs tracking-widest mb-1">
          COPA DEL MUNDO 2026
        </p>
        <h1
          className="text-white text-3xl font-bold mb-4"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          PARTIDOS
        </h1>

        {/* Phase selector */}
        <div
          className="overflow-x-auto -mx-5 px-5"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex gap-2 w-max pb-1">
            {(Object.keys(PHASE_LABELS) as Phase[]).map((p) => (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${phase === p ? "bg-white text-[color:var(--color-primary)]" : "bg-white/20 text-white"}`}
              >
                {PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===================== FASE DE GRUPOS ===================== */}
      {phase === "grupos" && (
        <>
          <div className="bg-surface border-b border-soft sticky top-0 z-20">
            <div className="flex px-4 pt-2 gap-1">
              {(["fixture", "grupos"] as View[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`flex-1 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all ${view === v ? "border-[color:var(--color-primary)] text-[color:var(--color-primary)]" : "border-transparent text-[color:var(--color-muted)]"}`}
                >
                  {v === "fixture" ? "📋 Fixture" : "📊 Posiciones"}
                </button>
              ))}
            </div>
            <div
              className="overflow-x-auto flex px-4 py-2 gap-1"
              style={{ scrollbarWidth: "none" }}
            >
              {GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl font-bold text-sm transition-all active:scale-90 ${activeGroup === g ? "bg-[#003DA5] text-white" : "bg-surface-2 text-[color:var(--color-muted)]"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4 space-y-3">
            {view === "fixture" &&
              groupMatches.map((match) => {
                const status = getStatus(match);
                return (
                  <div
                    key={match.id}
                    className="bg-surface rounded-3xl overflow-hidden shadow-sm"
                  >
                    <div className="px-4 py-2.5 flex items-center justify-between bg-surface-2 border-b border-soft">
                      <span className="text-xs text-[color:var(--color-muted)]">
                        📍 {match.city}
                      </span>
                      <div className="flex items-center gap-2">
                        {status === "live" && (
                          <span className="flex items-center gap-1 text-xs text-red-500 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            EN VIVO
                          </span>
                        )}
                        <span className="text-xs text-[color:var(--color-muted)]">
                          {format(
                            parseISO(match.match_date),
                            "d MMM · HH'h'mm",
                            { locale: es },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-4 flex items-center gap-2">
                      <div className="flex-1 text-center">
                        <span className="text-3xl block mb-1">
                          {match.home_flag}
                        </span>
                        <p className="text-xs font-semibold text-[color:var(--color-text-2)]">
                          {match.home_team}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-center min-w-[80px]">
                        {status === "finished" ? (
                          <span
                            className="text-2xl font-bold text-[color:var(--color-primary)]"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {match.home_score} - {match.away_score}
                          </span>
                        ) : status === "live" ? (
                          <span
                            className="text-2xl font-bold text-red-500"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {match.home_score ?? "?"} -{" "}
                            {match.away_score ?? "?"}
                          </span>
                        ) : (
                          <span className="text-[color:var(--color-border)] font-bold text-lg">
                            vs
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-3xl block mb-1">
                          {match.away_flag}
                        </span>
                        <p className="text-xs font-semibold text-[color:var(--color-text-2)]">
                          {match.away_team}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

            {view === "grupos" && (
              <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="font-bold text-[color:var(--color-text)] text-sm">
                    Grupo {activeGroup}
                  </h3>
                </div>
                <div className="flex items-center px-4 py-2 bg-surface-2 border-y border-soft">
                  <div className="flex-1 text-xs text-[color:var(--color-muted)] font-semibold">
                    Equipo
                  </div>
                  {["PJ", "G", "E", "P", "GF", "GC", "Pts"].map((h) => (
                    <div
                      key={h}
                      className={`w-8 text-center text-xs font-bold ${h === "Pts" ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-muted)]"}`}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {standings.map((row, i) => (
                  <div
                    key={row.team}
                    className={`flex items-center px-4 py-3 border-b border-soft ${i < 2 ? "bg-surface-2" : ""}`}
                  >
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i < 2 ? "bg-[#003DA5] text-white" : "bg-surface-2 text-[color:var(--color-muted)]"}`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-lg flex-shrink-0">{row.flag}</span>
                      <span className="text-sm font-semibold text-[color:var(--color-text)] truncate">
                        {row.team}
                      </span>
                    </div>
                    {[
                      row.played,
                      row.won,
                      row.drawn,
                      row.lost,
                      row.gf,
                      row.ga,
                    ].map((v, j) => (
                      <div
                        key={j}
                        className="w-8 text-center text-xs text-[color:var(--color-muted)]"
                      >
                        {v}
                      </div>
                    ))}
                    <div className="w-8 text-center text-sm font-bold text-[color:var(--color-primary)]">
                      {row.points}
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#003DA5]" />
                  <span className="text-xs text-[color:var(--color-muted)]">
                    Clasifican al siguiente ronda
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ===================== FASES ELIMINATORIAS ===================== */}
      {eliminationPhases.includes(phase) && (
        <div className="py-4">
          {/* Bracket horizontal scrollable para fases con más de 4 partidos */}
          {phase === "32avos" || phase === "16avos" ? (
            <div>
              <div className="px-4 mb-3">
                <p className="text-xs text-[color:var(--color-muted)] font-semibold">
                  {phase === "32avos"
                    ? "32 equipos · 16 partidos"
                    : "16 equipos · 8 partidos"}
                </p>
              </div>
              <div
                className="overflow-x-auto pb-4"
                style={{ scrollbarWidth: "none" }}
              >
                <div
                  className="flex gap-4 px-4"
                  style={{ minWidth: "max-content" }}
                >
                  <BracketPhase
                    title={PHASE_LABELS[phase]}
                    slots={phase === "32avos" ? BRACKET_32 : BRACKET_16}
                    matches={getMatchesForPhase(phase)}
                  />
                </div>
              </div>
            </div>
          ) : phase === "octavos" || phase === "cuartos" ? (
            /* Bracket horizontal con las dos fases lado a lado */
            <div
              className="overflow-x-auto pb-4 px-4"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex gap-6" style={{ minWidth: "max-content" }}>
                <BracketPhase
                  title="Octavos"
                  slots={BRACKET_8}
                  matches={getMatchesForPhase("octavos")}
                />
                <div className="flex items-center">
                  <div className="w-6 border-t-2 border-dashed border-soft" />
                </div>
                <BracketPhase
                  title="Cuartos"
                  slots={BRACKET_4}
                  matches={getMatchesForPhase("cuartos")}
                />
              </div>
            </div>
          ) : phase === "semis" || phase === "final" ? (
            /* Semis + Final juntas */
            <div
              className="overflow-x-auto pb-4 px-4"
              style={{ scrollbarWidth: "none" }}
            >
              <div className="flex gap-6" style={{ minWidth: "max-content" }}>
                <BracketPhase
                  title="Semifinales"
                  slots={BRACKET_4}
                  matches={getMatchesForPhase("semis")}
                />
                <div className="flex items-center">
                  <div className="w-6 border-t-2 border-dashed border-soft" />
                </div>
                <BracketPhase
                  title="Final 🏆"
                  slots={BRACKET_FINAL}
                  matches={getMatchesForPhase("final")}
                />
              </div>
            </div>
          ) : null}

          {/* Mensaje si no hay partidos cargados aún */}
          {getMatchesForPhase(phase).length === 0 && (
            <div className="mx-4 mt-4 bg-surface rounded-3xl p-8 text-center shadow-sm">
              <span className="text-4xl block mb-3">🔜</span>
              <p className="text-[color:var(--color-text-2)] font-semibold">
                {PHASE_LABELS[phase]}
              </p>
              <p className="text-[color:var(--color-muted)] text-sm mt-1">
                Los partidos se definirán al finalizar la fase anterior
              </p>
            </div>
          )}
        </div>
      )}

      <BottomNav active="partidos" />
    </div>
  );
}
