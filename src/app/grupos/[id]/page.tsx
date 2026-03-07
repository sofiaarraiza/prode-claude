"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, type Group, type LeaderboardEntry } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";

export default function GrupoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      setCurrentUserId(session.user.id);

      const [{ data: grp }, { data: lb }] = await Promise.all([
        supabase.from("groups").select("*").eq("id", groupId).single(),
        supabase
          .from("leaderboard")
          .select("*")
          .eq("group_id", groupId)
          .order("total_points", { ascending: false }),
      ]);

      setGroup(grp);
      setLeaderboard(lb ?? []);
      setLoading(false);
    };
    load();
  }, [groupId, router]);

  const copyCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!group) return;
    const joinUrl = `${window.location.origin}/grupos/unirse?code=${group.invite_code}`;
    const text = `¡Unite a mi grupo de prode del Mundial 2026! 🏆⚽\n\nGrupo: *${group.name}*\n\nTocá el link y entrás directo 👉 ${joinUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const medalEmoji = (pos: number) => {
    if (pos === 0) return "🥇";
    if (pos === 1) return "🥈";
    if (pos === 2) return "🥉";
    return `${pos + 1}`;
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-[#F4F6FB] dark:bg-[#13151F] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-dvh bg-[#F4F6FB] dark:bg-[#13151F] flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Grupo no encontrado</p>
          <button
            onClick={() => router.push("/grupos")}
            className="text-blue-600 dark:text-blue-400 font-semibold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#F4F6FB] dark:bg-[#13151F] pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-14 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push("/grupos")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div>
            <p className="text-white/60 text-xs tracking-widest">GRUPO</p>
            <h1 className="text-white font-bold text-xl leading-tight">
              {group.name}
            </h1>
          </div>
        </div>

        {/* Invite code card */}
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/60 text-xs mb-1">Código de invitación</p>
          <p
            className="text-white font-display text-3xl tracking-widest mb-3"
            style={{ fontFamily: "Bebas Neue, sans-serif" }}
          >
            {group.invite_code}
          </p>
          <div className="flex gap-2">
            {/* Copiar código */}
            <button
              onClick={copyCode}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white/20 text-white text-sm font-semibold px-3 py-2.5 rounded-xl active:scale-95 transition-all"
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar
                </>
              )}
            </button>

            {/* Compartir por WhatsApp */}
            <button
              onClick={shareWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] text-white text-sm font-semibold px-3 py-2.5 rounded-xl active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10">
        {/* Quick action */}
        <button
          onClick={() => router.push(`/predicciones?grupo=${groupId}`)}
          className="w-full bg-[#16a34a] text-white rounded-2xl p-4 text-left mb-4 active:scale-95 transition-transform shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-base">⚽ Cargar predicciones</p>
              <p className="text-white/70 text-xs mt-0.5">
                Predecí los resultados para este grupo
              </p>
            </div>
            <svg
              className="w-5 h-5 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </button>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-[#1E2233] rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
              <span>🏆</span> Tabla de posiciones
            </h2>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-10 px-5">
              <span className="text-4xl block mb-3">📊</span>
              <p className="text-gray-500 text-sm">
                Todavía no hay predicciones cargadas. Los puntos van a aparecer
                cuando se jueguen los primeros partidos.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {leaderboard.map((entry, index) => {
                const isMe = entry.user_id === currentUserId;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 px-5 py-4 ${isMe ? "bg-[#EEF1F8] dark:bg-[#252838]" : ""}`}
                  >
                    <div className="w-8 text-center text-lg">
                      {typeof medalEmoji(index) === "string" &&
                      medalEmoji(index).includes("🥇") ? (
                        <span className="text-xl">{medalEmoji(index)}</span>
                      ) : (
                        <span className="text-gray-400 font-bold text-sm">
                          {medalEmoji(index)}
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${isMe ? "ring-2 ring-blue-500" : ""}`}
                      style={{
                        background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
                      }}
                    >
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {(entry.full_name ?? "U")[0]}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm truncate ${isMe ? "text-blue-600 dark:text-blue-400 dark:text-blue-400" : "text-gray-800 dark:text-white"}`}
                      >
                        {entry.full_name ?? "Jugador"}{" "}
                        {isMe && (
                          <span className="text-xs text-gray-400">(yo)</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-green-600">
                          ✅ {entry.exact_results}
                        </span>
                        <span className="text-xs text-amber-500">
                          🟡 {entry.partial_results}
                        </span>
                        <span className="text-xs text-gray-400">
                          ❌ {entry.wrong_results}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-display text-2xl text-blue-600 dark:text-blue-400 dark:text-blue-400"
                        style={{ fontFamily: "Bebas Neue, sans-serif" }}
                      >
                        {entry.total_points}
                      </p>
                      <p className="text-xs text-gray-400">pts</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="grupos" />
    </div>
  );
}
