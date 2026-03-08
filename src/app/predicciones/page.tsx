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
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type PredictionMap = Record<
  string,
  { home: string; away: string; saved?: boolean; points?: number }
>;
type ViewMode = "grupos" | "fechas" | "buscar";

// Predicciones de compañeros por partido
type TeammatePred = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  predicted_home_score: number;
  predicted_away_score: number;
  points: number | null;
};
type TeammatesMap = Record<string, TeammatePred[]>;

function PrediccionesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get("grupo");

  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(
    groupIdParam ?? "",
  );
  const [predictions, setPredictions] = useState<PredictionMap>({});
  const [teammates, setTeammates] = useState<TeammatesMap>({});
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("A");
  const [viewMode, setViewMode] = useState<ViewMode>("grupos");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [userId, setUserId] = useState("");

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
      setGroups(g);
      if (!selectedGroup && g.length > 0) setSelectedGroup(g[0].id);
      setLoading(false);
    };
    load();
  }, [router]);

  // Cargar mis predicciones cuando cambia el grupo
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

  // Cargar predicciones de compañeros para partidos finalizados
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
    if (
      !pred ||
      pred.home === "" ||
      pred.home === undefined ||
      pred.away === "" ||
      pred.away === undefined
    )
      return;

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

  const getMatchStatus = (match: Match): "open" | "locked" | "finished" => {
    if (match.status === "finished") return "finished";
    if (!isMatchEditable(match.match_date)) return "locked";
    return "open";
  };

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
      <div className="min-h-dvh bg-app flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-dvh bg-app pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-4">
        <p className="text-white/60 text-xs tracking-widest mb-1">
          COPA DEL MUNDO 2026
        </p>
        <h1
          className="text-white font-display text-3xl mb-4"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          MIS PREDICCIONES
        </h1>

        {groups.length > 0 ? (
          <div>
            <p className="text-white/60 text-xs mb-1.5">Grupo seleccionado</p>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-white/20 text-white rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none appearance-none mb-3"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "16px",
              }}
            >
              {groups.map((g) => (
                <option
                  key={g.id}
                  value={g.id}
                  style={{ color: "#003DA5", background: "white" }}
                >
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="bg-red-500/90 rounded-2xl p-4 mb-3 text-center">
            <span className="text-3xl block mb-2">🚫</span>
            <p className="text-white font-bold text-sm mb-1">
              Necesitás un grupo para predecir
            </p>
            <p className="text-white/80 text-xs mb-3">
              Las predicciones se guardan dentro de un grupo. Sin grupo no podés
              jugar.
            </p>
            <button
              onClick={() => router.push("/grupos")}
              className="bg-white text-red-600 font-bold text-sm px-5 py-2 rounded-xl active:scale-95 transition-transform"
            >
              Crear o unirme a un grupo →
            </button>
          </div>
        )}

        <div className="flex gap-2">
          {(["grupos", "fechas", "buscar"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                if (mode === "buscar")
                  setTimeout(
                    () => document.getElementById("search-input")?.focus(),
                    100,
                  );
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                viewMode === mode
                  ? "bg-white text-[color:var(--color-primary)]"
                  : "bg-white/20 text-white"
              }`}
            >
              {mode === "grupos"
                ? "🔤 Grupos"
                : mode === "fechas"
                  ? "📅 Fechas"
                  : "🔍 Buscar"}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      {viewMode === "buscar" && (
        <div className="px-4 py-3 bg-surface border-b border-soft sticky top-0 z-20">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--color-muted)]"
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
              className="w-full bg-surface-2 rounded-xl pl-9 pr-9 py-3 text-sm text-[color:var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[#003DA5]"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)] text-lg leading-none"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-[color:var(--color-muted)] mt-1.5 pl-1">
              {searchResults.length} partido
              {searchResults.length !== 1 ? "s" : ""} encontrado
              {searchResults.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      )}

      {/* Group tabs */}
      {viewMode === "grupos" && (
        <div className="bg-surface border-b border-soft sticky top-0 z-20">
          <div
            className="overflow-x-auto flex px-4 py-2 gap-1"
            style={{ scrollbarWidth: "none" }}
          >
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setActiveTab(g)}
                className={`flex-shrink-0 w-9 h-9 rounded-xl font-bold text-sm transition-all active:scale-90 ${
                  activeTab === g
                    ? "bg-[#003DA5] text-white"
                    : "bg-surface-2 text-[color:var(--color-muted)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 space-y-3">
        {viewMode === "grupos" &&
          matches
            .filter((m) => m.group_name === activeTab)
            .map((match) => (
              <MatchCard key={match.id} {...matchCardProps(match)} />
            ))}

        {viewMode === "fechas" &&
          Object.entries(matchesByDate).map(([dateKey, dayMatches]) => (
            <div key={dateKey}>
              <div className="flex items-center gap-2 mb-3 mt-2">
                <div className="h-px flex-1 bg-[color:var(--color-border)]" />
                <span className="text-xs font-bold text-[color:var(--color-muted)] uppercase tracking-wide px-1">
                  {format(parseISO(dateKey + "T12:00:00"), "EEEE d 'de' MMMM", {
                    locale: es,
                  })}
                </span>
                <div className="h-px flex-1 bg-[color:var(--color-border)]" />
              </div>
              <div className="space-y-3">
                {dayMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    {...matchCardProps(match)}
                    showGroup
                  />
                ))}
              </div>
            </div>
          ))}

        {viewMode === "buscar" && !searchQuery && (
          <div className="text-center py-12">
            <span className="text-5xl block mb-3">🔍</span>
            <p className="text-[color:var(--color-muted)] text-sm mb-4">
              Escribí el nombre de un equipo
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Argentina",
                "Brasil",
                "Francia",
                "España",
                "Alemania",
                "México",
                "Inglaterra",
                "Portugal",
              ].map((team) => (
                <button
                  key={team}
                  onClick={() => setSearchQuery(team)}
                  className="bg-surface border border-soft text-[color:var(--color-text-2)] text-xs px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  {team}
                </button>
              ))}
            </div>
          </div>
        )}

        {viewMode === "buscar" && searchQuery && searchResults.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">😕</span>
            <p className="text-[color:var(--color-muted)] text-sm">
              No encontramos "{searchQuery}"
            </p>
          </div>
        )}

        {viewMode === "buscar" &&
          searchResults.map((match) => (
            <MatchCard key={match.id} {...matchCardProps(match)} showGroup />
          ))}
      </div>

      <BottomNav active="predicciones" />
    </div>
  );
}

// ===================== MATCH CARD =====================

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

  const pointsBadge = () => {
    if (status !== "finished") return null;
    if (!prediction)
      return (
        <span className="text-xs bg-surface-2 text-[color:var(--color-muted)] px-2 py-0.5 rounded-full">
          Sin pred.
        </span>
      );
    if (prediction.points === 3)
      return (
        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">
          +3 pts 🎯
        </span>
      );
    if (prediction.points === 1)
      return (
        <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">
          +1 pt
        </span>
      );
    return (
      <span className="text-xs bg-surface-2 text-[color:var(--color-muted)] px-2 py-0.5 rounded-full">
        0 pts
      </span>
    );
  };

  const getPredBadge = (pts: number | null) => {
    if (pts === 3) return "🎯";
    if (pts === 1) return "✅";
    if (pts === 0) return "❌";
    return "·";
  };

  const isEditing =
    (prediction?.home !== undefined || prediction?.away !== undefined) &&
    !prediction?.saved &&
    status === "open";

  return (
    <div
      className={`bg-surface rounded-3xl overflow-hidden shadow-sm transition-all duration-200
        ${status === "finished" ? "opacity-90" : ""}
        ${isEditing ? "ring-2 ring-[#003DA5] shadow-md shadow-[#003DA5]/20" : ""}
      `}
    >
      {/* Match header */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-surface-2 border-b border-soft">
        <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
          {showGroup && (
            <span className="bg-[#003DA5] text-white px-1.5 py-0.5 rounded text-xs font-bold">
              G{match.group_name}
            </span>
          )}
          <span>📍 {match.city}</span>
        </div>
        <div className="flex items-center gap-2">
          {status === "finished" && pointsBadge()}
          {status === "locked" && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
              🔒 Bloqueado
            </span>
          )}
          <span className="text-xs text-[color:var(--color-muted)]">
            {format(matchDate, "d MMM · HH'h'mm", { locale: es })}
          </span>
        </div>
      </div>

      {/* Teams & scores */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 text-center">
            <span className="text-3xl block mb-1">{match.home_flag}</span>
            <p className="text-xs font-semibold text-[color:var(--color-text-2)] leading-tight">
              {match.home_team}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {status === "finished" ? (
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="font-display text-3xl text-[color:var(--color-primary)]"
                    style={{ fontFamily: "Bebas Neue, sans-serif" }}
                  >
                    {match.home_score ?? "-"}
                  </span>
                  <span className="text-[color:var(--color-border)] font-bold">
                    :
                  </span>
                  <span
                    className="font-display text-3xl text-[color:var(--color-primary)]"
                    style={{ fontFamily: "Bebas Neue, sans-serif" }}
                  >
                    {match.away_score ?? "-"}
                  </span>
                </div>
                {prediction && (
                  <p className="text-xs text-[color:var(--color-muted)]">
                    Tu pred:{" "}
                    <strong>
                      {prediction.home}-{prediction.away}
                    </strong>
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
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
                <span className="text-[color:var(--color-border)] font-bold text-xl">
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

          <div className="flex-1 text-center">
            <span className="text-3xl block mb-1">{match.away_flag}</span>
            <p className="text-xs font-semibold text-[color:var(--color-text-2)] leading-tight">
              {match.away_team}
            </p>
          </div>
        </div>

        {/* Save status */}
        {status === "open" && selectedGroup && (
          <div className="mt-3 flex items-center justify-center">
            {saving ? (
              <span className="text-xs text-[color:var(--color-muted)] flex items-center gap-1">
                <span className="w-3 h-3 border-2 border-[color:var(--color-muted)] border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : prediction?.saved ? (
              <span className="text-xs text-green-500 flex items-center gap-1">
                ✅ Guardado
              </span>
            ) : hasUnsaved ? (
              <button
                onClick={() => onSave(match)}
                className="text-xs bg-[#003DA5] text-white px-4 py-1.5 rounded-full font-semibold active:scale-95"
              >
                Guardar predicción
              </button>
            ) : (
              <span className="text-xs text-[color:var(--color-muted-2)]">
                Ingresá tu predicción
              </span>
            )}
          </div>
        )}

        {/* Ver predicciones de compañeros — solo si el partido terminó */}
        {hasTeammates && (
          <button
            onClick={onToggleExpand}
            className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-[color:var(--color-primary)] font-semibold py-2 rounded-xl bg-surface-2 active:scale-95 transition-transform"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {expanded
              ? "Ocultar"
              : `Ver predicciones del grupo (${teammatesPreds.length})`}
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Teammates predictions panel */}
      {expanded && hasTeammates && (
        <div className="border-t border-soft bg-surface-2">
          <div className="px-4 py-2 border-b border-soft">
            <p className="text-xs font-bold text-[color:var(--color-muted)] tracking-wide">
              PREDICCIONES DEL GRUPO
            </p>
          </div>
          <div className="divide-y divide-soft">
            {teammatesPreds
              .sort((a, b) => (b.points ?? 0) - (a.points ?? 0))
              .map((t) => (
                <div
                  key={t.user_id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #003DA5, #1A5FBF)",
                    }}
                  >
                    {t.avatar_url ? (
                      <img
                        src={t.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {t.full_name[0]}
                      </span>
                    )}
                  </div>
                  {/* Name */}
                  <span className="flex-1 text-sm text-[color:var(--color-text-2)] font-semibold truncate">
                    {t.full_name}
                  </span>
                  {/* Prediction */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold text-[color:var(--color-text)] tabular-nums"
                      style={{ fontFamily: "Bebas Neue, sans-serif" }}
                    >
                      {t.predicted_home_score} - {t.predicted_away_score}
                    </span>
                    <span className="text-base">{getPredBadge(t.points)}</span>
                    {t.points !== null && (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          t.points === 3
                            ? "bg-[#003DA5] text-white"
                            : t.points === 1
                              ? "bg-amber-400 text-white"
                              : "bg-surface-3 text-[color:var(--color-muted)]"
                        }`}
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
        <div className="min-h-dvh bg-app flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PrediccionesContent />
    </Suspense>
  );
}
