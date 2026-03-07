"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Match } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import { GROUPS, GROUP_TEAMS } from "@/lib/fixture";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type Phase = "grupos" | "16avos" | "octavos" | "cuartos" | "semis" | "final";
type View = "fixture" | "grupos";

// Puntos en fase de grupos (simulados hasta que haya resultados reales)
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
  const rows: Record<string, StandingRow> = {};

  // Flags lookup from matches
  const flagMap: Record<string, string> = {};
  matches.forEach((m) => {
    flagMap[m.home_team] = m.home_flag ?? "";
    flagMap[m.away_team] = m.away_flag ?? "";
  });

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
  grupos: "Fase de Grupos",
  "16avos": "16avos",
  octavos: "Octavos",
  cuartos: "Cuartos",
  semis: "Semifinales",
  final: "Final",
};

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

  const eliminationMatches = useMemo(
    () => matches.filter((m) => m.phase === phase && phase !== "grupos"),
    [matches, phase],
  );

  const getStatus = (match: Match) => {
    if (match.status === "finished") return "finished";
    const start = parseISO(match.match_date).getTime();
    const now = Date.now();
    if (now >= start && now <= start + 2 * 60 * 60 * 1000) return "live";
    return "upcoming";
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F0F4FF] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F0F4FF] pb-24">
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
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  phase === p
                    ? "bg-white text-[#003DA5]"
                    : "bg-white/20 text-white"
                }`}
              >
                {PHASE_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FASE DE GRUPOS */}
      {phase === "grupos" && (
        <>
          {/* View toggle + group tabs */}
          <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
            {/* Fixture / Posiciones toggle */}
            <div className="flex px-4 pt-2 gap-1">
              <button
                onClick={() => setView("fixture")}
                className={`flex-1 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                  view === "fixture"
                    ? "border-[#003DA5] text-[#003DA5]"
                    : "border-transparent text-gray-400"
                }`}
              >
                📋 Fixture
              </button>
              <button
                onClick={() => setView("grupos")}
                className={`flex-1 py-2 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                  view === "grupos"
                    ? "border-[#003DA5] text-[#003DA5]"
                    : "border-transparent text-gray-400"
                }`}
              >
                📊 Posiciones
              </button>
            </div>
            {/* Group tabs */}
            <div
              className="overflow-x-auto flex px-4 py-2 gap-1"
              style={{ scrollbarWidth: "none" }}
            >
              {GROUPS.map((g) => (
                <button
                  key={g}
                  onClick={() => setActiveGroup(g)}
                  className={`flex-shrink-0 w-9 h-9 rounded-xl font-bold text-sm transition-all active:scale-90 ${
                    activeGroup === g
                      ? "bg-[#003DA5] text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4 space-y-3">
            {/* FIXTURE VIEW */}
            {view === "fixture" &&
              groupMatches.map((match) => {
                const status = getStatus(match);
                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm"
                  >
                    <div className="px-4 py-2.5 flex items-center justify-between bg-[#F8FAFF] border-b border-gray-100">
                      <span className="text-xs text-gray-400">
                        📍 {match.city}
                      </span>
                      <div className="flex items-center gap-2">
                        {status === "live" && (
                          <span className="flex items-center gap-1 text-xs text-red-500 font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            EN VIVO
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
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
                        <p className="text-xs font-semibold text-gray-700">
                          {match.home_team}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-center min-w-[80px]">
                        {status === "finished" ? (
                          <span
                            className="text-2xl font-bold text-[#003DA5]"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {match.home_score} - {match.away_score}
                          </span>
                        ) : status === "live" ? (
                          <div>
                            <span
                              className="text-2xl font-bold text-red-500"
                              style={{ fontFamily: "Bebas Neue, sans-serif" }}
                            >
                              {match.home_score ?? "?"} -{" "}
                              {match.away_score ?? "?"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-bold text-lg">
                            vs
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-3xl block mb-1">
                          {match.away_flag}
                        </span>
                        <p className="text-xs font-semibold text-gray-700">
                          {match.away_team}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

            {/* POSICIONES VIEW */}
            {view === "grupos" && (
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <h3 className="font-bold text-gray-800 text-sm">
                    Grupo {activeGroup}
                  </h3>
                </div>
                {/* Header */}
                <div className="flex items-center px-4 py-2 bg-gray-50 border-y border-gray-100">
                  <div className="flex-1 text-xs text-gray-400 font-semibold">
                    Equipo
                  </div>
                  {["PJ", "G", "E", "P", "GF", "GC", "Pts"].map((h) => (
                    <div
                      key={h}
                      className={`w-8 text-center text-xs font-bold ${h === "Pts" ? "text-[#003DA5]" : "text-gray-400"}`}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {standings.map((row, i) => (
                  <div
                    key={row.team}
                    className={`flex items-center px-4 py-3 border-b border-gray-50 ${i < 2 ? "bg-[#F0F8FF]" : ""}`}
                  >
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          i < 2
                            ? "bg-[#003DA5] text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-lg flex-shrink-0">{row.flag}</span>
                      <span className="text-sm font-semibold text-gray-800 truncate">
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
                        className="w-8 text-center text-xs text-gray-500"
                      >
                        {v}
                      </div>
                    ))}
                    <div className="w-8 text-center text-sm font-bold text-[#003DA5]">
                      {row.points}
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#003DA5]" />
                  <span className="text-xs text-gray-400">
                    Clasifican al siguiente ronda
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* FASES ELIMINATORIAS */}
      {phase !== "grupos" && (
        <div className="px-4 py-6">
          {eliminationMatches.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-5xl block mb-3">🔜</span>
              <p className="text-gray-500 font-semibold">
                {PHASE_LABELS[phase]}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Los partidos se definirán al finalizar la fase anterior
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eliminationMatches.map((match) => {
                const status = getStatus(match);
                return (
                  <div
                    key={match.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm"
                  >
                    <div className="px-4 py-2.5 flex items-center justify-between bg-[#F8FAFF] border-b border-gray-100">
                      <span className="text-xs text-gray-400">
                        📍 {match.city}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(parseISO(match.match_date), "d MMM · HH'h'mm", {
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="px-4 py-4 flex items-center gap-2">
                      <div className="flex-1 text-center">
                        <span className="text-3xl block mb-1">
                          {match.home_flag}
                        </span>
                        <p className="text-xs font-semibold text-gray-700">
                          {match.home_team}
                        </p>
                      </div>
                      <div className="flex-shrink-0 text-center min-w-[80px]">
                        {status === "finished" ? (
                          <span
                            className="text-2xl font-bold text-[#003DA5]"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {match.home_score} - {match.away_score}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-bold text-lg">
                            vs
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-center">
                        <span className="text-3xl block mb-1">
                          {match.away_flag}
                        </span>
                        <p className="text-xs font-semibold text-gray-700">
                          {match.away_team}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <BottomNav active="partidos" />
    </div>
  );
}
