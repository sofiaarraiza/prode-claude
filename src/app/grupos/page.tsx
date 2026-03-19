"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Group } from "@/lib/supabase";
import BottomNav from "@/components/layout/BottomNav";
import {
  Users01,
  Trophy01,
  Plus,
  ChevronRight,
  LogIn01,
  Globe01,
} from "@untitledui/icons";

type GroupWithMeta = Group & {
  member_count: number;
  is_admin: boolean;
};

export default function GruposPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      const uid = session.user.id;

      // Fetch groups I belong to
      const { data: memberRows } = await supabase
        .from("group_members")
        .select("groups(*)")
        .eq("user_id", uid);

      const baseGroups: Group[] = memberRows?.map((m: any) => m.groups).filter(Boolean) ?? [];

      // Fetch member counts in parallel
      const counts = await Promise.all(
        baseGroups.map((g) =>
          supabase
            .from("group_members")
            .select("user_id", { count: "exact", head: true })
            .eq("group_id", g.id)
        )
      );

      const enriched: GroupWithMeta[] = baseGroups.map((g, i) => ({
        ...g,
        member_count: counts[i].count ?? 0,
        is_admin: g.admin_id === uid,
      }));

      setGroups(enriched);
      setLoading(false);
    };
    load();
  }, [router]);

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
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--color-gray-500, #717680)", letterSpacing: "0.12em" }}
        >
          Copa del Mundo 2026
        </p>
        <h1
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 26,
            fontWeight: 800,
            color: "var(--color-gray-900, #181d27)",
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          Mis grupos
        </h1>

        {/* Action buttons — igual al dashboard */}
        <div className="flex gap-2">
          <button
            id="btn-crear-grupo"
            onClick={() => router.push("/grupos/crear")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity"
            style={{ background: "var(--color-brand-600, #003da5)", color: "white" }}
          >
            <Plus width={15} height={15} />
            Crear grupo
          </button>
          <button
            id="btn-unirse-grupo"
            onClick={() => router.push("/grupos/unirse")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity card-white"
            style={{
              border: "1px solid var(--color-gray-300, #d5d7da)",
              color: "var(--color-gray-700, #414651)",
            }}
          >
            <LogIn01 width={15} height={15} />
            Unirme
          </button>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="px-4">

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[72px] rounded-2xl skeleton" />
            ))}
          </div>

        ) : (() => {
          const globalGroup = groups.find((g) => g.is_global);
          const privateGroups = groups.filter((g) => !g.is_global);
          return (
            <>
              {/* ── GLOBAL GROUP BANNER ──────────────────────────────────── */}
              {globalGroup && (
                <div
                  className="card-white rounded-2xl p-4 mb-3 flex items-center gap-3"
                  style={{ border: "1px solid #C8A84B44", background: "var(--color-surface, white)" }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "#fffbeb", border: "1px solid #C8A84B44" }}
                  >
                    <Globe01 width={18} height={18} style={{ color: "#92400e" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "var(--color-gray-900, #181d27)" }}>
                      RANKING GLOBAL 🌍
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--color-gray-500, #717680)" }}>
                      Todos los jugadores participan automáticamente
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/tabla")}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold active:opacity-70"
                    style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #C8A84B44" }}
                  >
                    Ver ranking
                    <ChevronRight width={12} height={12} />
                  </button>
                </div>
              )}

              {/* ── PRIVATE GROUPS ───────────────────────────────────────── */}
              {privateGroups.length === 0 ? (
                <div
                  className="card-white rounded-2xl px-5 py-8 text-center"
                  style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: "var(--color-brand-50, #eff4ff)" }}
                  >
                    <Users01 width={26} height={26} style={{ color: "var(--color-brand-600, #003da5)" }} />
                  </div>
                  <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-gray-900, #181d27)" }}>
                    Jugá con tus amigos
                  </h3>
                  <p className="text-sm mb-5" style={{ color: "var(--color-gray-500, #717680)" }}>
                    Creá un grupo o usá un código para unirte al de tus amigos y competir en el prode del Mundial.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push("/grupos/crear")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity"
                      style={{ background: "var(--color-brand-600, #003da5)", color: "white" }}
                    >
                      Crear grupo
                    </button>
                    <button
                      onClick={() => router.push("/grupos/unirse")}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity card-white"
                      style={{ border: "1px solid var(--color-gray-300, #d5d7da)", color: "var(--color-gray-700, #414651)" }}
                    >
                      Ingresar código
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="card-white rounded-2xl overflow-hidden"
                    style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
                  >
                    {privateGroups.map((group, i) => (
                      <button
                        key={group.id}
                        onClick={() => router.push(`/grupos/${group.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity text-left"
                        style={{ borderTop: i > 0 ? "1px solid var(--color-gray-100, #f5f5f5)" : "none" }}
                      >
                        {/* Group icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "var(--color-brand-50, #eff4ff)", border: "1px solid var(--color-brand-100, #d1e0ff)" }}
                        >
                          <Trophy01 width={18} height={18} style={{ color: "var(--color-brand-600, #003da5)" }} />
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold truncate" style={{ color: "var(--color-gray-900, #181d27)" }}>
                              {group.name}
                            </p>
                            {group.is_admin && (
                              <span
                                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: "var(--color-brand-50, #eff4ff)", color: "var(--color-brand-600, #003da5)" }}
                              >
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full tracking-wider"
                              style={{ background: "var(--color-gray-100, #f5f5f5)", color: "var(--color-gray-500, #717680)" }}
                            >
                              {group.invite_code}
                            </span>
                            <span className="flex items-center gap-0.5 text-xs" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>
                              <Users01 width={10} height={10} />
                              {group.member_count}
                            </span>
                          </div>
                        </div>

                        <ChevronRight width={16} height={16} style={{ color: "var(--color-gray-300, #d5d7da)", flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>

                  {/* Tip card */}
                  <div
                    className="mt-3 px-4 py-3 rounded-2xl flex items-center gap-3"
                    style={{
                      background: "var(--color-brand-50, #eff4ff)",
                      border: "1px solid var(--color-brand-100, #d1e0ff)",
                    }}
                  >
                    <Users01 width={16} height={16} style={{ color: "var(--color-brand-600, #003da5)", flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "var(--color-brand-700, #003da5)" }}>
                      <strong>Tip:</strong> Podés pertenecer a varios grupos a la vez — familia, trabajo, amigos. Cada uno tiene su propia tabla.
                    </p>
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>

      <BottomNav active="grupos" />
    </div>
  );
}
