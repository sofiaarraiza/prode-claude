"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, type Group, type LeaderboardEntry } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";

type Member = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

export default function GrupoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Edit mode
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showMembers, setShowMembers] = useState(false);

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

      const [{ data: grp }, { data: lb }, { data: memberData }] =
        await Promise.all([
          supabase.from("groups").select("*").eq("id", groupId).single(),
          supabase
            .from("leaderboard")
            .select("*")
            .eq("group_id", groupId)
            .order("total_points", { ascending: false }),
          supabase
            .from("group_members")
            .select("user_id, profiles:user_id(full_name, avatar_url, email)")
            .eq("group_id", groupId),
        ]);

      setGroup(grp);
      setLeaderboard(lb ?? []);
      setNewName(grp?.name ?? "");

      const mems: Member[] = (memberData ?? []).map((m: any) => ({
        user_id: m.user_id,
        full_name: m.profiles?.full_name ?? null,
        avatar_url: m.profiles?.avatar_url ?? null,
        email: m.profiles?.email ?? null,
      }));
      setMembers(mems);

      // Check if current user is admin (creator)
      setIsAdmin(grp?.admin_id === session.user.id);

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
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleSaveName = async () => {
    if (!group || !newName.trim()) return;
    setSavingName(true);
    await supabase
      .from("groups")
      .update({ name: newName.trim() })
      .eq("id", group.id);
    setGroup((prev) => (prev ? { ...prev, name: newName.trim() } : prev));
    setSavingName(false);
    setEditingName(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("¿Seguro que querés sacar a este jugador del grupo?")) return;
    setRemovingId(userId);
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    setLeaderboard((prev) => prev.filter((e) => e.user_id !== userId));
    setRemovingId(null);
  };

  const medalEmoji = (pos: number) => {
    if (pos === 0) return "🥇";
    if (pos === 1) return "🥈";
    if (pos === 2) return "🥉";
    return `${pos + 1}`;
  };

  const getAvatarDisplay = (member: Member) => {
    if (!member.avatar_url) return null;
    if (member.avatar_url.startsWith("avatar:")) {
      try {
        const cfg = JSON.parse(member.avatar_url.slice(7));
        return { type: "emoji", emoji: cfg.emoji, color: cfg.color };
      } catch {
        return null;
      }
    }
    return { type: "photo", url: member.avatar_url };
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-dvh bg-app flex items-center justify-center px-5">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Grupo no encontrado</p>
          <button
            onClick={() => router.push("/grupos")}
            className="text-[color:var(--color-primary)] font-semibold"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-app pb-24">
      {/* Header — sin botón volver, nombre editable para admin */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-14 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />

        <div className="flex items-start gap-3 mb-5 relative z-10">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-90 transition-transform mt-0.5"
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
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs tracking-widest mb-1">GRUPO</p>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-white/20 text-white font-bold text-xl rounded-xl px-3 py-1.5 flex-1 min-w-0 focus:outline-none focus:bg-white/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="bg-surface text-[color:var(--color-primary)] text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {savingName ? "..." : "✓"}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="text-white/60 text-xs px-2 py-1.5"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-xl leading-tight truncate">
                  {group.name}
                </h1>
                {isAdmin && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform flex-shrink-0"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Miembros count */}
          <button
            onClick={() => setShowMembers(true)}
            className="flex-shrink-0 bg-white/20 rounded-2xl px-3 py-2 text-center active:scale-95 transition-transform ml-3"
          >
            <p
              className="text-white font-bold text-lg leading-tight"
              style={{ fontFamily: "Bebas Neue, sans-serif" }}
            >
              {members.length}
            </p>
            <p className="text-white/60 text-xs">jugadores</p>
          </button>
        </div>

        {/* Invitar */}
        <div className="bg-white/10 rounded-2xl p-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-4 h-4 text-white/70"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            <p className="text-white font-bold text-sm tracking-wide">
              INVITAR AMIGOS
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
            <div>
              <p className="text-white/50 text-xs mb-0.5">Código del grupo</p>
              <p
                className="text-white font-bold text-2xl tracking-widest"
                style={{ fontFamily: "Bebas Neue, sans-serif" }}
              >
                {group.invite_code}
              </p>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl active:scale-95 transition-all"
            >
              {copied ? (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copiar
                </>
              )}
            </button>
          </div>
          <button
            onClick={shareWhatsApp}
            className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-bold px-4 py-3 rounded-xl active:scale-95 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Invitar por WhatsApp
          </button>
        </div>
      </div>

      {/* Members modal */}
      {showMembers && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowMembers(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full bg-surface rounded-t-3xl p-5 pb-10 max-h-[75vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-surface-3 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[color:var(--color-text)] text-lg">
                👥 Jugadores ({members.length})
              </h2>
              {isAdmin && (
                <span className="text-xs text-[color:var(--color-muted)] bg-surface-2 px-2 py-1 rounded-full">
                  Sos el admin
                </span>
              )}
            </div>
            <div className="space-y-2">
              {members.map((member) => {
                const avatarData = getAvatarDisplay(member);
                const isMe = member.user_id === currentUserId;
                return (
                  <div
                    key={member.user_id}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${isMe ? "bg-surface-2" : "bg-surface-2/60"}`}
                  >
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                      style={{
                        background: "linear-gradient(135deg, #003DA5, #1A5FBF)",
                      }}
                    >
                      {avatarData?.type === "photo" ? (
                        <img
                          src={avatarData.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : avatarData?.type === "emoji" ? (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: avatarData.color }}
                        >
                          <span className="text-xl">{avatarData.emoji}</span>
                        </div>
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                          {(member.full_name ??
                            member.email ??
                            "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[color:var(--color-text)] text-sm truncate">
                        {member.full_name ?? member.email ?? "Jugador"}
                        {isMe && (
                          <span className="text-xs text-[color:var(--color-muted)] ml-1">
                            (yo)
                          </span>
                        )}
                        {group.admin_id === member.user_id && (
                          <span className="text-xs text-[color:var(--color-primary)] ml-1">
                            · admin
                          </span>
                        )}
                      </p>
                    </div>
                    {isAdmin && !isMe && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={removingId === member.user_id}
                        className="text-xs text-red-400 font-semibold px-2 py-1 rounded-lg bg-red-50 active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {removingId === member.user_id ? "..." : "Sacar"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="px-5 -mt-4 relative z-10">
        {/* Quick action */}
        <button
          onClick={() => router.push(`/predicciones?grupo=${groupId}`)}
          className="w-full rounded-3xl p-5 text-left mb-4 active:scale-95 transition-transform shadow-sm relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #E30613, #B30010)" }}
        >
          <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 select-none">
            ⚽
          </div>
          <p className="text-white/70 text-xs font-bold tracking-widest mb-1">
            FASE DE GRUPOS
          </p>
          <h3 className="text-white font-bold text-xl mb-1">
            Cargar predicciones
          </h3>
          <p className="text-white/70 text-sm">
            Predecí los resultados para este grupo
          </p>
          <div className="flex items-center gap-1 mt-3">
            <span className="text-white text-sm font-semibold">
              Ver partidos
            </span>
            <svg
              className="w-4 h-4 text-white"
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
        <div className="bg-surface rounded-3xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-soft">
            <h2 className="font-bold text-[color:var(--color-text)] text-lg flex items-center gap-2">
              <span>🏆</span> Tabla de posiciones
            </h2>
          </div>
          {leaderboard.length === 0 ? (
            <div className="text-center py-10 px-5">
              <span className="text-4xl block mb-3">📊</span>
              <p className="text-[color:var(--color-muted)] text-sm">
                Todavía no hay predicciones cargadas. Los puntos van a aparecer
                cuando se jueguen los primeros partidos.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-soft">
              {leaderboard.map((entry, index) => {
                const isMe = entry.user_id === currentUserId;
                const medal = medalEmoji(index);
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 px-5 py-4 ${isMe ? "bg-surface-2" : ""}`}
                  >
                    <div className="w-8 text-center text-lg">
                      {["🥇", "🥈", "🥉"].includes(medal) ? (
                        <span className="text-xl">{medal}</span>
                      ) : (
                        <span className="text-[color:var(--color-muted)] font-bold text-sm">
                          {medal}
                        </span>
                      )}
                    </div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${isMe ? "ring-2 ring-[#003DA5]" : ""}`}
                      style={{
                        background: "linear-gradient(135deg, #003DA5, #1A5FBF)",
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
                        className={`font-semibold text-sm truncate ${isMe ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-text)]"}`}
                      >
                        {entry.full_name ?? "Jugador"}{" "}
                        {isMe && (
                          <span className="text-xs text-[color:var(--color-muted)]">
                            (yo)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-green-600">
                          ✅ {entry.exact_results}
                        </span>
                        <span className="text-xs text-amber-500">
                          🟡 {entry.partial_results}
                        </span>
                        <span className="text-xs text-[color:var(--color-muted)]">
                          ❌ {entry.wrong_results}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="font-display text-2xl text-[color:var(--color-primary)]"
                        style={{ fontFamily: "Bebas Neue, sans-serif" }}
                      >
                        {entry.total_points}
                      </p>
                      <p className="text-xs text-[color:var(--color-muted)]">
                        pts
                      </p>
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
