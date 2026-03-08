"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Match } from "@/lib/supabase";
import { GROUPS } from "@/lib/fixture";

const ADMIN_EMAIL = "sofia.arraiza@gmail.com";

type EditingMatch = {
  id: string;
  home_score: string;
  away_score: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState("A");
  const [editing, setEditing] = useState<EditingMatch | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushSending, setPushSending] = useState(false);
  const [pushResult, setPushResult] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }

      if (session.user.email !== ADMIN_EMAIL) {
        router.replace("/dashboard");
        return;
      }

      setAuthorized(true);
      await loadMatches();
      setLoading(false);
    };
    init();
  }, [router]);

  const loadMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .eq("phase", "group")
      .order("match_number");
    setMatches(data ?? []);
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync-results", {
        method: "POST",
        headers: {
          "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "",
        },
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.updated > 0) await loadMatches();
    } catch (e: any) {
      setSyncResult({ error: e.message });
    }
    setSyncing(false);
  };

  const handleSaveResult = async (match: Match) => {
    if (!editing || editing.id !== match.id) return;
    setSaving(true);

    const res = await fetch("/api/update-match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "",
      },
      body: JSON.stringify({
        match_id: match.id,
        home_score: parseInt(editing.home_score),
        away_score: parseInt(editing.away_score),
        status: "finished",
      }),
    });

    const data = await res.json();
    if (data.success) {
      setSaveMessage("✅ Resultado guardado y puntos calculados");
      setEditing(null);
      await loadMatches();
      setTimeout(() => setSaveMessage(""), 3000);
    } else {
      setSaveMessage("❌ Error: " + data.error);
    }
    setSaving(false);
  };

  const handleResetMatch = async (matchId: string) => {
    if (!confirm('¿Resetear este partido a "pendiente"?')) return;
    setSaving(true);
    await fetch("/api/update-match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "",
      },
      body: JSON.stringify({
        match_id: matchId,
        home_score: null,
        away_score: null,
        status: "scheduled",
      }),
    });
    await loadMatches();
    setSaving(false);
  };

  const groupMatches = matches.filter((m) => m.group_name === activeTab);

  const statusColor = (status: string) => {
    if (status === "finished") return "bg-green-100 text-green-700";
    if (status === "live") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-500";
  };

  const statusLabel = (status: string) => {
    if (status === "finished") return "Terminado";
    if (status === "live") return "En vivo";
    return "Pendiente";
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="min-h-dvh bg-[#0D1B3E] pb-10">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-white/40 text-xs tracking-widest">
              PANEL DE ADMINISTRACIÓN
            </p>
            <h1
              className="text-white font-display text-3xl"
              style={{ fontFamily: "Bebas Neue, sans-serif" }}
            >
              GESTIÓN DE PARTIDOS
            </h1>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/50 text-sm underline"
          >
            Salir
          </button>
        </div>

        {/* Sync button */}
        <div className="mt-4 bg-white/5 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white font-semibold text-sm">
                Sincronizar con API-Football
              </p>
              <p className="text-white/40 text-xs">
                Actualiza automáticamente todos los resultados disponibles
              </p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 bg-[#003DA5] text-white px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0"
            >
              {syncing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>🔄 Sincronizar</>
              )}
            </button>
          </div>

          {syncResult && (
            <div
              className={`rounded-xl px-3 py-2 text-xs mt-2 ${syncResult.error ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}
            >
              {syncResult.error
                ? `❌ ${syncResult.error} — ${syncResult.message ?? ""}`
                : `✅ ${syncResult.updated} partido(s) actualizado(s) de ${syncResult.total_finished} terminados`}
            </div>
          )}
        </div>

        {/* Push notifications */}
        <div className="mt-4 bg-white/5 rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-3">
            📣 Enviar notificación push
          </p>
          <input
            type="text"
            placeholder="Título"
            value={pushTitle}
            onChange={(e) => setPushTitle(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm mb-2 outline-none focus:bg-white/15"
          />
          <input
            type="text"
            placeholder="Mensaje (ej: ¡Ya se cargaron los resultados!)"
            value={pushBody}
            onChange={(e) => setPushBody(e.target.value)}
            className="w-full bg-white/10 text-white placeholder-white/30 rounded-xl px-3 py-2.5 text-sm mb-3 outline-none focus:bg-white/15"
          />
          <button
            disabled={pushSending || !pushTitle.trim() || !pushBody.trim()}
            onClick={async () => {
              setPushSending(true);
              setPushResult(null);
              const res = await fetch("/api/push/send", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-admin-secret": process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "",
                },
                body: JSON.stringify({ title: pushTitle, body: pushBody }),
              });
              const data = await res.json();
              setPushResult(data);
              setPushSending(false);
            }}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-transform disabled:opacity-50"
          >
            {pushSending ? "Enviando..." : "🔔 Enviar a todos"}
          </button>
          {pushResult && (
            <div
              className={`rounded-xl px-3 py-2 text-xs mt-2 ${pushResult.error ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}
            >
              {pushResult.error
                ? `❌ ${pushResult.error}`
                : `✅ Enviado a ${pushResult.sent}/${pushResult.total} suscriptos`}
            </div>
          )}
        </div>

        {saveMessage && (
          <div className="mt-3 bg-white/10 rounded-xl px-4 py-2.5 text-white text-sm text-center">
            {saveMessage}
          </div>
        )}
      </div>

      {/* Group tabs */}
      <div
        className="overflow-x-auto flex px-5 gap-2 mb-4"
        style={{ scrollbarWidth: "none" }}
      >
        {GROUPS.map((g) => {
          const groupMatchesList = matches.filter((m) => m.group_name === g);
          const finishedCount = groupMatchesList.filter(
            (m) => m.status === "finished",
          ).length;
          return (
            <button
              key={g}
              onClick={() => setActiveTab(g)}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-all ${
                activeTab === g
                  ? "bg-[#003DA5] text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              <span className="font-bold text-sm">{g}</span>
              <span className="text-xs opacity-70">{finishedCount}/6</span>
            </button>
          );
        })}
      </div>

      {/* Matches list */}
      <div className="px-5 space-y-3">
        {groupMatches.map((match) => {
          const isEditing = editing?.id === match.id;
          return (
            <div
              key={match.id}
              className="bg-white/5 rounded-2xl overflow-hidden"
            >
              {/* Match header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <span className="text-white/40 text-xs">
                  #{match.match_number} · {match.city}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(match.status)}`}
                  >
                    {statusLabel(match.status)}
                  </span>
                  {match.status === "finished" && (
                    <button
                      onClick={() => handleResetMatch(match.id)}
                      className="text-white/30 text-xs underline"
                    >
                      reset
                    </button>
                  )}
                </div>
              </div>

              {/* Teams & score */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {/* Home */}
                  <div className="flex-1 text-center">
                    <span className="text-2xl block mb-1">
                      {match.home_flag}
                    </span>
                    <p className="text-white text-xs font-semibold leading-tight">
                      {match.home_team}
                    </p>
                  </div>

                  {/* Score area */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={editing.home_score}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              home_score: e.target.value,
                            })
                          }
                          className="score-input"
                          autoFocus
                        />
                        <span className="text-white/40 font-bold">:</span>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={editing.away_score}
                          onChange={(e) =>
                            setEditing({
                              ...editing,
                              away_score: e.target.value,
                            })
                          }
                          className="score-input"
                        />
                      </>
                    ) : (
                      <div className="text-center min-w-[80px]">
                        {match.status === "finished" ? (
                          <p
                            className="font-display text-3xl text-white"
                            style={{ fontFamily: "Bebas Neue, sans-serif" }}
                          >
                            {match.home_score} - {match.away_score}
                          </p>
                        ) : (
                          <p className="text-white/30 text-sm">vs</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Away */}
                  <div className="flex-1 text-center">
                    <span className="text-2xl block mb-1">
                      {match.away_flag}
                    </span>
                    <p className="text-white text-xs font-semibold leading-tight">
                      {match.away_team}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex items-center justify-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleSaveResult(match)}
                        disabled={
                          saving ||
                          editing.home_score === "" ||
                          editing.away_score === ""
                        }
                        className="bg-green-500 text-white px-5 py-2 rounded-xl text-sm font-semibold active:scale-95 disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "✅ Confirmar resultado"}
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="bg-white/10 text-white/60 px-4 py-2 rounded-xl text-sm active:scale-95"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        setEditing({
                          id: match.id,
                          home_score: match.home_score?.toString() ?? "",
                          away_score: match.away_score?.toString() ?? "",
                        })
                      }
                      className="bg-white/10 text-white/70 px-4 py-2 rounded-xl text-sm font-medium active:scale-95"
                    >
                      {match.status === "finished"
                        ? "✏️ Editar resultado"
                        : "⚽ Cargar resultado"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
