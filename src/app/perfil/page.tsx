"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Profile } from "@/lib/supabase";
import {
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
  getSubscriptionStatus,
} from "@/lib/pushClient";

// ── Notification toggle mini-component ──────────────────────────────────────
function NotificationToggle({
  profile,
  status,
  loading,
  onToggle,
}: {
  profile: Profile | null;
  status: string;
  loading: boolean;
  onToggle: () => void;
}) {
  const isOn = status === "granted";
  const isDenied = status === "denied";

  return (
    <div className="bg-white rounded-3xl shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">
            🔔
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Notificaciones</p>
            <p className="text-xs text-gray-500">
              {isDenied
                ? "Bloqueadas en este navegador"
                : isOn
                  ? "Activadas"
                  : "Desactivadas"}
            </p>
          </div>
        </div>
        {isDenied ? (
          <span className="text-xs text-red-400 font-medium">Bloqueadas</span>
        ) : (
          <button
            onClick={onToggle}
            disabled={loading || !profile}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
              isOn ? "bg-blue-600" : "bg-gray-200"
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                isOn ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        )}
      </div>
      {isDenied && (
        <p className="mt-2 text-xs text-gray-400">
          Habilitá las notificaciones en Ajustes del sistema para este sitio.
        </p>
      )}
    </div>
  );
}
// ────────────────────────────────────────────────────────────────────────────

type GroupRank = {
  group_id: string;
  group_name: string;
  rank: number;
  total_members: number;
  points: number;
};

type Stats = {
  total_points: number;
  exact: number;
  partial: number;
  wrong: number;
  total: number;
  best_streak: number;
};

export default function PerfilPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [groupRanks, setGroupRanks] = useState<GroupRank[]>([]);
  const [notifStatus, setNotifStatus] = useState<
    "checking" | "granted" | "denied" | "default"
  >("checking");
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }
      const userId = session.user.id;

      const [
        { data: profileData },
        { data: predsData },
        { data: memberships },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("predictions")
          .select("points, matches:match_id(match_date, status)")
          .eq("user_id", userId),
        supabase
          .from("group_members")
          .select("group_id, groups:group_id(id, name)")
          .eq("user_id", userId),
      ]);

      setProfile(profileData);
      setName(profileData?.full_name ?? "");

      // ── Stats ───────────────────────────────────────────────
      const finished = (predsData ?? []).filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.matches?.status === "finished",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ) as any[];

      let totalPts = 0,
        exact = 0,
        partial = 0,
        wrong = 0;
      finished.forEach((p) => {
        if (p.points === 3) {
          totalPts += 3;
          exact++;
        } else if (p.points === 1) {
          totalPts += 1;
          partial++;
        } else {
          wrong++;
        }
      });

      // Best streak (consecutive predictions with points > 0, sorted by match date)
      const sorted = [...finished].sort(
        (a, b) =>
          new Date(a.matches?.match_date ?? 0).getTime() -
          new Date(b.matches?.match_date ?? 0).getTime(),
      );
      let bestStreak = 0,
        curStreak = 0;
      sorted.forEach((p) => {
        if (p.points > 0) {
          curStreak++;
          bestStreak = Math.max(bestStreak, curStreak);
        } else {
          curStreak = 0;
        }
      });

      setStats({
        total_points: totalPts,
        exact,
        partial,
        wrong,
        total: finished.length,
        best_streak: bestStreak,
      });

      // ── Group rankings ──────────────────────────────────────
      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map((m) => m.group_id);
        const { data: lbAll } = await supabase
          .from("leaderboard")
          .select("group_id, user_id, total_points")
          .in("group_id", groupIds);

        const ranks: GroupRank[] = memberships.map((m) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const groupEntries = (lbAll ?? [])
            .filter((e: any) => e.group_id === m.group_id)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((a: any, b: any) => b.total_points - a.total_points);
          const rank = groupEntries.findIndex((e) => e.user_id === userId) + 1;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const myEntry = groupEntries.find((e: any) => e.user_id === userId);
          return {
            group_id: m.group_id,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            group_name: (m.groups as any)?.name ?? "Grupo",
            rank: rank || 0,
            total_members: groupEntries.length,
            points: myEntry?.total_points ?? 0,
          };
        });
        setGroupRanks(ranks);
      }

      // Initialize notification status
      const perm = await getSubscriptionStatus();
      if (perm === "granted") {
        const existingSub = await getCurrentSubscription();
        setNotifStatus(existingSub ? "granted" : "default");
      } else {
        setNotifStatus(perm);
      }

      setLoading(false);
    };
    load();
  }, [router]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", profile.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#F4F6FB]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const winPct =
    stats && stats.total > 0
      ? Math.round(((stats.exact + stats.partial) / stats.total) * 100)
      : 0;

  return (
    <div className="min-h-dvh bg-[#F4F6FB] pb-24">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-20 flex flex-col items-center relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div
          className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/30 mb-3 relative z-10"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
              {(profile?.full_name ?? "U")[0]}
            </span>
          )}
        </div>
        <h1 className="text-white font-bold text-xl relative z-10">
          {profile?.full_name ?? "Mi perfil"}
        </h1>
        <p className="text-white/60 text-sm relative z-10">{profile?.email}</p>
      </div>

      <div className="px-5 -mt-8 relative z-10 space-y-4">
        {/* ── Stats summary ─────────────────────────────────── */}
        {stats && (
          <div className="bg-white rounded-3xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚡</span> Mis estadísticas
            </h2>

            {/* 4 big numbers */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                {
                  value: stats.total_points,
                  label: "Puntos",
                  color: "bg-blue-50 text-blue-700",
                },
                {
                  value: stats.exact,
                  label: "Exactas",
                  color: "bg-green-50 text-green-700",
                },
                {
                  value: stats.partial,
                  label: "Parciales",
                  color: "bg-amber-50 text-amber-700",
                },
                {
                  value: stats.wrong,
                  label: "Erróneas",
                  color: "bg-red-50 text-red-500",
                },
              ].map(({ value, label, color }) => (
                <div
                  key={label}
                  className={`rounded-2xl p-2.5 text-center ${color}`}
                >
                  <p
                    className="font-bold text-xl leading-tight"
                    style={{ fontFamily: "Bebas Neue, sans-serif" }}
                  >
                    {value}
                  </p>
                  <p className="text-xs font-medium opacity-80 leading-tight mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {stats.total > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>Acierto total</span>
                  <span className="font-bold text-gray-700">{winPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                    style={{ width: `${winPct}%` }}
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {stats.total > 0 && (
                    <>
                      <div
                        className="h-1.5 rounded-full bg-green-400"
                        style={{
                          width: `${(stats.exact / stats.total) * 100}%`,
                          minWidth: stats.exact > 0 ? "4px" : 0,
                        }}
                      />
                      <div
                        className="h-1.5 rounded-full bg-amber-400"
                        style={{
                          width: `${(stats.partial / stats.total) * 100}%`,
                          minWidth: stats.partial > 0 ? "4px" : 0,
                        }}
                      />
                      <div
                        className="h-1.5 rounded-full bg-red-300"
                        style={{
                          width: `${(stats.wrong / stats.total) * 100}%`,
                          minWidth: stats.wrong > 0 ? "4px" : 0,
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="flex gap-3 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                    ✅ Exactos
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    🟡 Parciales
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-300 inline-block" />
                    ❌ Erróneos
                  </span>
                </div>
              </div>
            )}

            {/* Mejor racha */}
            <div className="flex items-center gap-3 bg-orange-50 rounded-2xl px-4 py-3">
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-xs text-orange-500 font-semibold uppercase tracking-wide">
                  Mejor racha
                </p>
                <p className="font-bold text-orange-700 text-lg leading-tight">
                  {stats.best_streak}{" "}
                  {stats.best_streak === 1 ? "predicción" : "predicciones"}{" "}
                  seguidas
                </p>
              </div>
            </div>

            {stats.total === 0 && (
              <p className="text-center text-gray-400 text-sm py-2">
                Todavía no hay partidos jugados. ¡Tus stats van a aparecer acá
                cuando arranque el Mundial!
              </p>
            )}
          </div>
        )}

        {/* ── Rankings por grupo ────────────────────────────── */}
        {groupRanks.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-5">
            <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span> Ranking por grupo
            </h2>
            <div className="space-y-3">
              {groupRanks.map((gr) => {
                const medal =
                  gr.rank === 1
                    ? "🥇"
                    : gr.rank === 2
                      ? "🥈"
                      : gr.rank === 3
                        ? "🥉"
                        : null;
                return (
                  <button
                    key={gr.group_id}
                    onClick={() => router.push(`/grupos/${gr.group_id}`)}
                    className="w-full flex items-center gap-3 bg-[#F4F6FB] rounded-2xl px-4 py-3 active:scale-95 transition-transform text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {medal ?? `#${gr.rank}`}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {gr.group_name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {gr.rank > 0
                          ? `Puesto ${gr.rank} de ${gr.total_members}`
                          : "Sin predicciones aún"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="font-bold text-blue-600 text-lg leading-tight"
                        style={{ fontFamily: "Bebas Neue, sans-serif" }}
                      >
                        {gr.points}
                      </p>
                      <p className="text-xs text-gray-400">pts</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Editar perfil ─────────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4">Editar perfil</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full bg-[#F4F6FB] border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="w-full py-3.5 rounded-2xl font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
              }}
            >
              {saving
                ? "Guardando..."
                : saved
                  ? "✅ Guardado"
                  : "Guardar cambios"}
            </button>
          </div>
        </div>

        {/* ── Reglas del prode ──────────────────────────────── */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> Reglas del prode
          </h2>
          <div className="space-y-3 text-sm text-gray-600">
            {[
              {
                pts: 3,
                bg: "bg-blue-600",
                label: "Resultado exacto",
                desc: "Acertás el marcador exacto (ej: 2-1 → 2-1)",
              },
              {
                pts: 1,
                bg: "bg-amber-400",
                label: "Ganador o empate",
                desc: "Acertás quién gana o que empatan, sin el marcador exacto",
              },
              {
                pts: 0,
                bg: "bg-gray-200",
                label: "Sin puntos",
                desc: "El resultado no coincide con tu predicción",
                textColor: "text-gray-500",
              },
            ].map(({ pts, bg, label, desc, textColor }) => (
              <div key={pts} className="flex items-start gap-2">
                <span
                  className={`w-6 h-6 rounded-lg ${bg} ${textColor ?? "text-white"} text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5`}
                >
                  {pts}
                </span>
                <div>
                  <strong>{label}:</strong> {desc}
                </div>
              </div>
            ))}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-2">
              <p className="text-amber-700 text-xs flex items-start gap-1.5">
                <span>⏰</span>
                <span>
                  Podés cargar y modificar predicciones hasta{" "}
                  <strong>7 días antes</strong> de cada partido.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Notificaciones ──────────────────────────────── */}
        {notifStatus !== "checking" && (
          <div className="bg-white rounded-3xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-xl">
                  🔔
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">
                    Notificaciones
                  </p>
                  <p className="text-xs text-gray-500">
                    {notifStatus === "denied"
                      ? "Bloqueadas en este navegador"
                      : notifStatus === "granted"
                        ? "Activadas"
                        : "Desactivadas"}
                  </p>
                </div>
              </div>
              {notifStatus === "denied" ? (
                <span className="text-xs text-red-400 font-medium">
                  Bloqueadas
                </span>
              ) : (
                <button
                  onClick={async () => {
                    if (!profile) return;
                    setNotifLoading(true);
                    try {
                      if (notifStatus === "granted") {
                        const sub = await getCurrentSubscription();
                        await unsubscribeFromPush();
                        if (sub) {
                          await fetch("/api/push/subscribe", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              userId: profile.id,
                              subscription: sub.toJSON(),
                              action: "unsubscribe",
                            }),
                          });
                        }
                        setNotifStatus("default");
                      } else {
                        const sub = await subscribeToPush();
                        if (sub) {
                          await fetch("/api/push/subscribe", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              userId: profile.id,
                              subscription: sub.toJSON(),
                            }),
                          });
                          setNotifStatus("granted");
                        } else {
                          const perm = await getSubscriptionStatus();
                          setNotifStatus(
                            perm === "denied" ? "denied" : "default",
                          );
                        }
                      }
                    } finally {
                      setNotifLoading(false);
                    }
                  }}
                  disabled={notifLoading}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                    notifStatus === "granted" ? "bg-blue-600" : "bg-gray-200"
                  } disabled:opacity-50`}
                >
                  {notifLoading ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </span>
                  ) : (
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                        notifStatus === "granted"
                          ? "translate-x-6"
                          : "translate-x-0"
                      }`}
                    />
                  )}
                </button>
              )}
            </div>
            {notifStatus === "denied" && (
              <p className="mt-2 text-xs text-gray-400">
                Para habilitar notificaciones, gestioná los permisos del sitio
                en la configuración del navegador.
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl font-semibold text-red-500 border-2 border-red-200 bg-white active:scale-95 transition-transform"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
