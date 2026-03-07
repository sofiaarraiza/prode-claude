"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Match } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ── Bracket structure for 2026 World Cup ──────────────────────────────────
// 48 teams → 32 advance → Round of 16 → QF → SF → Final + 3rd place

type BracketMatch = {
  id?: string; // DB match id if exists
  slot: string; // unique identifier e.g. "R16-1"
  phase: string; // DB phase value
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
  match_date?: string;
};

const EMPTY: BracketMatch = {
  slot: "",
  phase: "",
  home_team: "Por definir",
  away_team: "Por definir",
  home_flag: "🔘",
  away_flag: "🔘",
  home_score: null,
  away_score: null,
  status: "scheduled",
};

function mergeWithDB(
  slot: BracketMatch,
  dbMatches: Match[],
  phase: string,
  index: number,
): BracketMatch {
  const phaseMatches = dbMatches.filter((m) => m.phase === phase);
  const m = phaseMatches[index];
  if (!m) return { ...slot, phase };
  return {
    ...slot,
    id: m.id,
    phase,
    home_team: m.home_team,
    away_team: m.away_team,
    home_flag: m.home_flag ?? "🔘",
    away_flag: m.away_flag ?? "🔘",
    home_score: m.home_score,
    away_score: m.away_score,
    status: m.status,
    match_date: m.match_date,
  };
}

// ── Match card component ─────────────────────────────────────────────────
function MatchCard({
  match,
  highlight = false,
}: {
  match: BracketMatch;
  highlight?: boolean;
}) {
  const isDefined = match.home_team !== "Por definir";
  const winnerHome =
    match.status === "finished" &&
    match.home_score !== null &&
    match.away_score !== null &&
    match.home_score > match.away_score;
  const winnerAway =
    match.status === "finished" &&
    match.home_score !== null &&
    match.away_score !== null &&
    match.away_score > match.home_score;

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-sm border transition-all flex-shrink-0 w-[140px] ${
        highlight ? "border-yellow-400 shadow-yellow-200" : "border-gray-100"
      } ${isDefined ? "bg-white" : "bg-gray-50"}`}
    >
      {/* Date row */}
      {match.match_date && (
        <div className="px-2 py-1 bg-[#F4F6FB] border-b border-gray-100 text-center">
          <span className="text-[9px] text-gray-400 font-medium">
            {format(parseISO(match.match_date), "d MMM", { locale: es })}
          </span>
        </div>
      )}

      {/* Home team */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 border-b border-gray-50 ${winnerHome ? "bg-blue-50" : ""}`}
      >
        <span className="text-base leading-none">{match.home_flag}</span>
        <span
          className={`flex-1 text-[10px] font-semibold truncate ${isDefined ? (winnerHome ? "text-blue-700" : "text-gray-700") : "text-gray-300"}`}
        >
          {match.home_team}
        </span>
        {match.status === "finished" && (
          <span
            className={`text-xs font-bold ${winnerHome ? "text-blue-700" : "text-gray-400"}`}
          >
            {match.home_score}
          </span>
        )}
      </div>

      {/* Away team */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1.5 ${winnerAway ? "bg-blue-50" : ""}`}
      >
        <span className="text-base leading-none">{match.away_flag}</span>
        <span
          className={`flex-1 text-[10px] font-semibold truncate ${isDefined ? (winnerAway ? "text-blue-700" : "text-gray-700") : "text-gray-300"}`}
        >
          {match.away_team}
        </span>
        {match.status === "finished" && (
          <span
            className={`text-xs font-bold ${winnerAway ? "text-blue-700" : "text-gray-400"}`}
          >
            {match.away_score}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Column of matches ────────────────────────────────────────────────────
function BracketColumn({
  label,
  matches,
  highlight = false,
}: {
  label: string;
  matches: BracketMatch[];
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col flex-shrink-0">
      {/* Column header */}
      <div className="text-center mb-3">
        <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
          {label}
        </span>
      </div>
      {/* Matches with spacing to align with lines */}
      <div className="flex flex-col gap-3">
        {matches.map((m, i) => (
          <div key={i} className="flex items-center">
            <MatchCard match={m} highlight={highlight} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Winner card ─────────────────────────────────────────────────────────
function WinnerCard({ match }: { match: BracketMatch }) {
  const winnerTeam =
    match.status === "finished"
      ? match.home_score! > match.away_score!
        ? match.home_team
        : match.away_team
      : null;
  const winnerFlag =
    match.status === "finished"
      ? match.home_score! > match.away_score!
        ? match.home_flag
        : match.away_flag
      : null;

  return (
    <div className="flex flex-col items-center justify-center flex-shrink-0 w-[110px]">
      <div className="text-center mb-3">
        <span className="text-[10px] font-bold text-yellow-600 tracking-widest uppercase bg-yellow-50 rounded-full px-3 py-1">
          🏆 Campeón
        </span>
      </div>
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col items-center justify-center shadow-lg">
        {winnerTeam ? (
          <>
            <span className="text-3xl">{winnerFlag}</span>
            <span className="text-[9px] text-white font-bold mt-0.5 text-center leading-tight px-1 truncate max-w-full">
              {winnerTeam}
            </span>
          </>
        ) : (
          <span className="text-3xl">🏆</span>
        )}
      </div>
    </div>
  );
}

export default function BracketPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

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
        .neq("phase", "group")
        .order("match_number");
      setMatches(data ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  // Build bracket columns from DB matches (or show TBD placeholders)
  const r16: BracketMatch[] = Array.from({ length: 16 }, (_, i) => ({
    ...EMPTY,
    slot: `R16-${i + 1}`,
    phase: "round_of_16",
  })).map((s, i) => mergeWithDB(s, matches, "round_of_16", i));

  const qf: BracketMatch[] = Array.from({ length: 8 }, (_, i) => ({
    ...EMPTY,
    slot: `QF-${i + 1}`,
    phase: "quarter_final",
  })).map((s, i) => mergeWithDB(s, matches, "quarter_final", i));

  const sf: BracketMatch[] = Array.from({ length: 4 }, (_, i) => ({
    ...EMPTY,
    slot: `SF-${i + 1}`,
    phase: "semi_final",
  })).map((s, i) => mergeWithDB(s, matches, "semi_final", i));

  const thirdPlace: BracketMatch = mergeWithDB(
    { ...EMPTY, slot: "3RD", phase: "third_place" },
    matches,
    "third_place",
    0,
  );

  const final: BracketMatch = mergeWithDB(
    { ...EMPTY, slot: "FINAL", phase: "final" },
    matches,
    "final",
    0,
  );

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#F4F6FB]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F6FB] pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-6">
        <p className="text-white/60 text-xs tracking-widest mb-1">
          COPA DEL MUNDO 2026
        </p>
        <h1
          className="text-white text-3xl font-bold"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          LLAVES
        </h1>
        <p className="text-white/50 text-xs mt-1">
          Deslizá para ver todo el cuadro →
        </p>
      </div>

      {/* Bracket */}
      <div
        className="overflow-x-auto px-5 pt-6 pb-4"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-6 items-start min-w-max">
          {/* Round of 16 — split in half vertically */}
          <div className="flex flex-col gap-3">
            <div className="text-center mb-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
                16avos (1-8)
              </span>
            </div>
            {r16.slice(0, 8).map((m, i) => (
              <MatchCard key={i} match={m} />
            ))}
          </div>

          {/* QF left */}
          <div className="flex flex-col mt-[32px]">
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
                Cuartos
              </span>
            </div>
            <div className="flex flex-col gap-[60px]">
              {qf.slice(0, 4).map((m, i) => (
                <MatchCard key={i} match={m} />
              ))}
            </div>
          </div>

          {/* SF left */}
          <div className="flex flex-col mt-[80px]">
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
                Semis
              </span>
            </div>
            <div className="flex flex-col gap-[156px]">
              {sf.slice(0, 2).map((m, i) => (
                <MatchCard key={i} match={m} />
              ))}
            </div>
          </div>

          {/* Final + 3rd place */}
          <div className="flex flex-col mt-[180px] items-center gap-8">
            <div>
              <div className="text-center mb-3">
                <span className="text-[10px] font-bold text-yellow-600 tracking-widest uppercase bg-yellow-50 rounded-full px-3 py-1">
                  ⭐ Final
                </span>
              </div>
              <MatchCard match={final} highlight />
            </div>
            <div>
              <div className="text-center mb-3">
                <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
                  3° Puesto
                </span>
              </div>
              <MatchCard match={thirdPlace} />
            </div>
          </div>

          {/* Winner */}
          <div className="mt-[195px]">
            <WinnerCard match={final} />
          </div>

          {/* SF right */}
          <div className="flex flex-col mt-[80px]">
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
                Semis
              </span>
            </div>
            <div className="flex flex-col gap-[156px]">
              {sf.slice(2, 4).map((m, i) => (
                <MatchCard key={i} match={m} />
              ))}
            </div>
          </div>

          {/* QF right */}
          <div className="flex flex-col mt-[32px]">
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
                Cuartos
              </span>
            </div>
            <div className="flex flex-col gap-[60px]">
              {qf.slice(4, 8).map((m, i) => (
                <MatchCard key={i} match={m} />
              ))}
            </div>
          </div>

          {/* Round of 16 right */}
          <div className="flex flex-col gap-3">
            <div className="text-center mb-1">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase bg-gray-100 rounded-full px-3 py-1">
                16avos (9-16)
              </span>
            </div>
            {r16.slice(8, 16).map((m, i) => (
              <MatchCard key={i} match={m} />
            ))}
          </div>
        </div>
      </div>

      {/* Info banner while groups are pending */}
      {matches.length === 0 && (
        <div className="mx-5 mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-2xl mb-2">⏳</p>
          <p className="text-sm font-semibold text-blue-700">
            Fase de grupos en curso
          </p>
          <p className="text-xs text-blue-500 mt-1">
            Las llaves se van a completar automaticamente cuando finalice la
            fase de grupos
          </p>
        </div>
      )}

      <BottomNav active="partidos" />
    </div>
  );
}
