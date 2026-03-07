"use client";

import { useEffect, useState, Suspense } from "react";
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
  const [activeTab, setActiveTab] = useState("A");
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
          .order("match_number"),
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
      pred?.home === "" ||
      pred?.home === undefined ||
      pred?.away === "" ||
      pred?.away === undefined
    )
      return;

    setSaving(match.id);

    const payload = {
      user_id: userId,
      match_id: match.id,
      group_id: selectedGroup,
      predicted_home_score: parseInt(pred.home),
      predicted_away_score: parseInt(pred.away),
    };

    const { error } = await supabase
      .from("predictions")
      .upsert(payload, { onConflict: "user_id,match_id,group_id" });

    if (!error) {
      setPredictions((prev) => ({
        ...prev,
        [match.id]: { ...prev[match.id], saved: true },
      }));
    }

    setSaving(null);
  };

  const groupMatches = matches.filter((m) => m.group_name === activeTab);

  const getMatchStatus = (match: Match) => {
    if (match.status === "finished") return "finished";
    if (!isMatchEditable(match.match_date)) return "locked";
    return "open";
  };

  const getPointsBadge = (matchId: string, match: Match) => {
    if (match.status !== "finished") return null;
    const pred = predictions[matchId];
    if (!pred)
      return (
        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
          Sin pred.
        </span>
      );
    if (pred.points === 3)
      return (
        <span className="text-xs bg-[#003DA5] text-white px-2 py-0.5 rounded-full font-bold">
          +3 pts 🎯
        </span>
      );
    if (pred.points === 1)
      return (
        <span className="text-xs bg-amber-400 text-white px-2 py-0.5 rounded-full font-bold">
          +1 pt
        </span>
      );
    return (
      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
        0 pts
      </span>
    );
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
          className="text-white font-display text-3xl mb-4"
          style={{ fontFamily: "Bebas Neue, sans-serif" }}
        >
          MIS PREDICCIONES
        </h1>

        {/* Group selector */}
        {groups.length > 0 ? (
          <div>
            <p className="text-white/60 text-xs mb-1.5">Grupo seleccionado</p>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-white/20 text-white rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none appearance-none"
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
          <div className="bg-white/10 rounded-xl p-3 text-white/70 text-xs">
            ⚠️ No estás en ningún grupo.{" "}
            <button
              onClick={() => router.push("/grupos")}
              className="underline text-white font-semibold"
            >
              Crear o unirte
            </button>
          </div>
        )}
      </div>

      {/* Group tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
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
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Matches */}
      <div className="px-4 py-4 space-y-3">
        {groupMatches.map((match) => {
          const status = getMatchStatus(match);
          const pred = predictions[match.id];
          const isSaving = saving === match.id;
          const hasUnsaved =
            pred && !pred.saved && pred.home !== "" && pred.away !== "";
          const matchDate = parseISO(match.match_date);

          return (
            <div
              key={match.id}
              className={`bg-white rounded-3xl overflow-hidden shadow-sm ${
                status === "finished" ? "opacity-80" : ""
              }`}
            >
              {/* Match header */}
              <div className="px-4 py-2.5 flex items-center justify-between bg-[#F8FAFF] border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>📍 {match.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  {status === "finished" && getPointsBadge(match.id, match)}
                  {status === "locked" && (
                    <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                      🔒 Bloqueado
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {format(matchDate, "d MMM · HH'h'mm", { locale: es })}
                  </span>
                </div>
              </div>

              {/* Teams & scores */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {/* Home team */}
                  <div className="flex-1 text-center">
                    <span className="text-3xl block mb-1">
                      {match.home_flag}
                    </span>
                    <p className="text-xs font-semibold text-gray-700 leading-tight">
                      {match.home_team}
                    </p>
                  </div>

                  {/* Score inputs */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {status === "finished" ? (
                      // Real result + prediction
                      <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="font-display text-3xl text-[#003DA5]"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {match.home_score ?? "-"}
                          </span>
                          <span className="text-gray-300 font-bold">:</span>
                          <span
                            className="font-display text-3xl text-[#003DA5]"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {match.away_score ?? "-"}
                          </span>
                        </div>
                        {pred && (
                          <p className="text-xs text-gray-400">
                            Tu pred:{" "}
                            <strong>
                              {pred.home}-{pred.away}
                            </strong>
                          </p>
                        )}
                      </div>
                    ) : (
                      // Prediction inputs
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={pred?.home ?? ""}
                          onChange={(e) =>
                            handlePredictionChange(
                              match.id,
                              "home",
                              e.target.value,
                            )
                          }
                          onBlur={() => hasUnsaved && savePrediction(match)}
                          disabled={status === "locked" || !selectedGroup}
                          className="score-input"
                          placeholder="0"
                        />
                        <span className="text-gray-300 font-bold text-xl">
                          :
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={pred?.away ?? ""}
                          onChange={(e) =>
                            handlePredictionChange(
                              match.id,
                              "away",
                              e.target.value,
                            )
                          }
                          onBlur={() => hasUnsaved && savePrediction(match)}
                          disabled={status === "locked" || !selectedGroup}
                          className="score-input"
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex-1 text-center">
                    <span className="text-3xl block mb-1">
                      {match.away_flag}
                    </span>
                    <p className="text-xs font-semibold text-gray-700 leading-tight">
                      {match.away_team}
                    </p>
                  </div>
                </div>

                {/* Save button / status */}
                {status === "open" && selectedGroup && (
                  <div className="mt-3 flex items-center justify-center">
                    {isSaving ? (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </span>
                    ) : pred?.saved ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        ✅ Guardado
                      </span>
                    ) : hasUnsaved ? (
                      <button
                        onClick={() => savePrediction(match)}
                        className="text-xs bg-[#003DA5] text-white px-4 py-1.5 rounded-full font-semibold active:scale-95"
                      >
                        Guardar predicción
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">
                        Ingresá tu predicción
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav active="predicciones" />
    </div>
  );
}

export default function PrediccionesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#F0F4FF] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PrediccionesContent />
    </Suspense>
  );
}
