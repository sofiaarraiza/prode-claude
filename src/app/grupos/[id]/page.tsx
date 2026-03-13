"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, type Group, type LeaderboardEntry } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import {
  Edit01,
  Users01,
  Trophy01,
  ChevronRight,
  Copy01,
  Check,
  BarChart07,
} from "@untitledui/icons";

// Position chip — matches /tabla style
function PositionChip({ pos }: { pos: number }) {
  const cfg =
    pos === 1 ? { bg: "#C8A84B", color: "white" }
    : pos === 2 ? { bg: "var(--color-gray-400, #a4a7ae)", color: "white" }
    : pos === 3 ? { bg: "#b45309", color: "white" }
    : { bg: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-500, #717680)" };
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {pos}
    </div>
  );
}

type Member = {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
};

function AvatarCircle({
  member,
  size = 40,
  ring = false,
}: {
  member: Pick<Member, "avatar_url" | "full_name" | "email">;
  size?: number;
  ring?: boolean;
}) {
  const av = member.avatar_url;
  const initials = (member.full_name ?? member.email ?? "U")[0].toUpperCase();

  let content: React.ReactNode;
  if (av?.startsWith("avatar:")) {
    try {
      const cfg = JSON.parse(av.slice(7));
      content = (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ background: cfg.color }}
        >
          <span style={{ fontSize: size * 0.45 }}>{cfg.emoji}</span>
        </div>
      );
    } catch {
      content = null;
    }
  } else if (av) {
    content = (
      <img src={av} alt="" className="w-full h-full object-cover" />
    );
  }

  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, var(--color-brand-600, #003da5), #1a55bd)",
        outline: ring ? "2px solid var(--color-brand-600, #003da5)" : "none",
        outlineOffset: 2,
      }}
    >
      {content ?? (
        <span className="text-white font-bold" style={{ fontSize: size * 0.38 }}>
          {initials}
        </span>
      )}
    </div>
  );
}

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
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      setCurrentUserId(session.user.id);

      const [{ data: grp }, { data: lb }, { data: memberData }] = await Promise.all([
        supabase.from("groups").select("*").eq("id", groupId).single(),
        supabase.from("leaderboard").select("*").eq("group_id", groupId).order("total_points", { ascending: false }),
        supabase.from("group_members").select("user_id, profiles:user_id(full_name, avatar_url, email)").eq("group_id", groupId),
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
      setIsAdmin(grp?.admin_id === session.user.id);
      setLoading(false);
    };
    load();
  }, [groupId, router]);

  const copyLink = () => {
    if (!group) return;
    const joinUrl = `${window.location.origin}/grupos/unirse?code=${group.invite_code}`;
    navigator.clipboard.writeText(joinUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
    await supabase.from("groups").update({ name: newName.trim() }).eq("id", group.id);
    setGroup((prev) => (prev ? { ...prev, name: newName.trim() } : prev));
    setSavingName(false);
    setEditingName(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("¿Seguro que querés sacar a este jugador del grupo?")) return;
    setRemovingId(userId);
    await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
    setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    setLeaderboard((prev) => prev.filter((e) => e.user_id !== userId));
    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center page-gradient">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--color-brand-600, #003da5)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-dvh flex items-center justify-center page-gradient px-5">
        <div className="text-center">
          <p className="text-sm mb-4" style={{ color: "var(--color-gray-500, #717680)" }}>Grupo no encontrado</p>
          <button onClick={() => router.push("/grupos")} className="text-sm font-semibold" style={{ color: "var(--color-brand-600, #003da5)" }}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/grupos/unirse?code=${group.invite_code}`;

  return (
    <div className="min-h-dvh pb-24 page-gradient" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        className="relative px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: 20,
        }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-pill"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="glass-btn">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Members avatars pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl glass-pill">
            <Users01 className="glass-btn" width={15} height={15} />
            <span className="text-xs font-semibold glass-btn">{members.length} jugadores</span>
          </div>
        </div>

        {/* Group name + admin edit */}
        <div className="mb-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-gray-500, #717680)", letterSpacing: "0.12em" }}>
            Grupo
          </p>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded-xl px-3 py-2 text-lg font-extrabold focus:outline-none"
                style={{
                  background: "var(--color-gray-100, #f5f5f5)",
                  color: "var(--color-gray-900, #181d27)",
                  border: "1px solid var(--color-brand-300, #84adff)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-50 transition-transform"
                style={{ background: "var(--color-brand-600, #003da5)" }}
              >
                <Check width={16} height={16} style={{ color: "white" }} />
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                style={{ background: "var(--color-gray-100, #f5f5f5)" }}
              >
                <span style={{ color: "var(--color-gray-500, #717680)", fontSize: 14 }}>✕</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 style={{ fontFamily: "Inter, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--color-gray-900, #181d27)", lineHeight: 1.15 }}>
                {group.name}
              </h1>
              {isAdmin && (
                <button
                  onClick={() => setEditingName(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform glass-pill"
                >
                  <Edit01 width={13} height={13} className="glass-btn" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── CTA PREDICCIONES ─────────────────────────────────────────── */}
        <button
          onClick={() => router.push(`/predicciones?grupo=${groupId}`)}
          className="w-full rounded-2xl text-left active:scale-[0.98] transition-transform relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #2a7ca8 0%, #4a9fc0 40%, #75c2e0 100%)",
            boxShadow: "0 4px 14px rgba(42,124,168,0.35)",
          }}
        >
          <div className="absolute -right-4 -bottom-4 text-[80px] opacity-10 select-none pointer-events-none">⚽</div>
          <div className="px-5 py-4 flex items-center gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
                Fase de grupos
              </p>
              <h3 className="font-bold text-lg text-white leading-tight">Cargá tus predicciones</h3>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>72 partidos · Apertura 11 Jun 2026</p>
            </div>
            <div className="ml-auto flex-shrink-0">
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5"
                style={{ background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "#2a7ca8" }}>Empezar</span>
                <ChevronRight width={12} height={12} style={{ color: "#2a7ca8" }} />
              </div>
            </div>
          </div>
        </button>

        {/* ── INVITAR ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: "var(--color-gray-500, #717680)" }}>
            Invitar amigos
          </p>
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            {/* Link row */}
            <div className="px-4 py-3.5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium mb-0.5" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>Link de invitación</p>
                <p className="text-xs font-semibold truncate" style={{ color: "var(--color-gray-700, #414651)" }}>
                  {joinUrl}
                </p>
              </div>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 flex-shrink-0 active:scale-95 transition-all"
                style={{
                  background: copied ? "rgba(22,163,74,0.1)" : "var(--color-brand-50, #eff4ff)",
                  color: copied ? "#16a34a" : "var(--color-brand-600, #003da5)",
                  border: `1px solid ${copied ? "rgba(22,163,74,0.2)" : "var(--color-brand-100, #d1e0ff)"}`,
                }}
              >
                {copied
                  ? <><Check width={14} height={14} /><span className="text-xs font-semibold">Copiado</span></>
                  : <><Copy01 width={14} height={14} /><span className="text-xs font-semibold">Copiar</span></>
                }
              </button>
            </div>

            {/* WhatsApp row */}
            <button
              onClick={shareWhatsApp}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#dcfce7" }}>
                <svg className="w-4 h-4" style={{ color: "#16a34a" }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <span className="flex-1 text-sm font-semibold text-left" style={{ color: "var(--color-gray-800, #1d2939)" }}>
                Compartir por WhatsApp
              </span>
              <ChevronRight width={14} height={14} style={{ color: "var(--color-gray-300, #d5d7da)" }} />
            </button>
          </div>
        </div>

        {/* ── PARTICIPANTES ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
              Participantes
            </p>
            {isAdmin && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-brand-50, #eff4ff)", color: "var(--color-brand-600, #003da5)" }}>
                Admin
              </span>
            )}
          </div>
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            {members.map((member, i) => {
              const isMe = member.user_id === currentUserId;
              const isGroupAdmin = group.admin_id === member.user_id;
              const canRemove = isAdmin && !isMe;
              return (
                <div
                  key={member.user_id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{
                    borderTop: i > 0 ? "1px solid var(--color-gray-100, #f5f5f5)" : "none",
                    background: isMe ? "var(--color-brand-50, #eff4ff)" : "transparent",
                  }}
                >
                  <AvatarCircle member={member} size={38} ring={isMe} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: isMe ? "var(--color-brand-700, #003da5)" : "var(--color-gray-900, #181d27)" }}>
                        {member.full_name ?? member.email ?? "Jugador"}
                      </p>
                      {isMe && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-brand-100, #d1e0ff)", color: "var(--color-brand-700, #003da5)" }}>
                          Vos
                        </span>
                      )}
                      {isGroupAdmin && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-500, #717680)" }}>
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                  {canRemove && (
                    <button
                      onClick={() => handleRemoveMember(member.user_id)}
                      disabled={removingId === member.user_id}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-xl active:scale-95 transition-all disabled:opacity-40"
                      style={{ background: "#fef2f2", color: "#e11d48", border: "1px solid #fecdd3" }}
                    >
                      {removingId === member.user_id ? "..." : "Sacar"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── TABLA DE POSICIONES ──────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
              Tabla de posiciones
            </p>
            <Trophy01 width={14} height={14} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
          </div>
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            {leaderboard.length === 0 ? (
              <div className="px-4 py-10 flex flex-col items-center gap-2 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                  style={{ background: "var(--color-gray-100, #f5f5f5)" }}
                >
                  <BarChart07 width={22} height={22} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-gray-700, #414651)" }}>¡Todavía no hay puntos!</p>
                <p className="text-xs" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                  Los puntos aparecen cuando se jueguen los primeros partidos el 11 Jun.
                </p>
              </div>
            ) : (
              <div className="px-3 pb-3 pt-2 space-y-1">
                {leaderboard.map((entry, index) => {
                  const isMe = entry.user_id === currentUserId;
                  return (
                    <div
                      key={entry.user_id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{
                        background: isMe ? "var(--color-brand-50, #eff4ff)" : "transparent",
                        border: isMe ? "1px solid var(--color-brand-200, #b2ccff)" : "1px solid transparent",
                      }}
                    >
                      <PositionChip pos={index + 1} />
                      <AvatarCircle
                        member={{ avatar_url: entry.avatar_url ?? null, full_name: entry.full_name ?? null, email: null }}
                        size={30}
                        ring={isMe}
                      />
                      <span
                        className="flex-1 text-sm font-medium truncate"
                        style={{ color: isMe ? "var(--color-brand-700, #003da5)" : "var(--color-gray-700, #414651)" }}
                      >
                        {entry.full_name ?? "Jugador"}{isMe && " (Vos)"}
                      </span>
                      <div className="flex items-baseline gap-0.5">
                        <span className="font-bold text-sm tabular-nums" style={{ color: isMe ? "var(--color-brand-700, #003da5)" : "var(--color-gray-900, #181d27)" }}>
                          {entry.total_points}
                        </span>
                        <span className="text-xs" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      <BottomNav active="grupos" />
    </div>
  );
}
