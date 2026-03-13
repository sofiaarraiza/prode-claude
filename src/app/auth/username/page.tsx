"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

export default function UsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace("/auth/login"); return; }
      setUserId(session.user.id);
      // If already has username, skip
      supabase.from("profiles").select("username").eq("id", session.user.id).single()
        .then(({ data }) => { if (data?.username) router.replace("/dashboard"); });
    });
  }, [router]);

  useEffect(() => {
    if (!username) { setStatus("idle"); return; }
    if (!USERNAME_RE.test(username)) { setStatus("invalid"); return; }

    setStatus("checking");
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      setStatus(data ? "taken" : "available");
    }, 400);
    return () => clearTimeout(t);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== "available" || !userId) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ username: username.toLowerCase() })
      .eq("id", userId);
    router.replace("/dashboard");
  };

  const hint =
    status === "invalid" ? "3–20 caracteres: letras, números, . _ -" :
    status === "checking" ? "Verificando disponibilidad..." :
    status === "available" ? `@${username.toLowerCase()} está disponible ✓` :
    status === "taken" ? "Ese username ya está en uso" :
    "Aparecerá en la tabla de posiciones";

  const hintColor =
    status === "available" ? "#12a150" :
    status === "taken" || status === "invalid" ? "#ef4444" :
    "var(--color-muted, #6b7a99)";

  return (
    <main className="min-h-dvh bg-fifa-pattern flex flex-col">
      {/* Header */}
      <div className="px-5 pt-14 pb-8">
        <p className="text-white/60 text-xs tracking-widest mb-1">PRODE MUNDIAL 2026</p>
        <h1 className="text-white font-bold text-3xl" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
          ELEGÍ TU USERNAME
        </h1>
      </div>

      {/* Card */}
      <div className="flex-1 bg-app rounded-t-3xl px-6 pt-8 pb-10">
        <div className="mb-6">
          <p className="text-sm font-medium" style={{ color: "var(--color-text-2, #374151)" }}>
            Elegí un nombre único para identificarte en los grupos y la tabla de posiciones.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: "var(--color-muted, #6b7a99)" }}>
              Username
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-base"
                style={{ color: "var(--color-muted, #6b7a99)" }}
              >
                @
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                placeholder="tuusuario"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                maxLength={20}
                className="w-full rounded-2xl px-4 py-3.5 pl-8 text-base focus:outline-none transition-colors"
                style={{
                  background: "var(--color-surface, #fff)",
                  border: `2px solid ${
                    status === "available" ? "#12a150" :
                    status === "taken" || status === "invalid" ? "#ef4444" :
                    "var(--color-border, #e4e9f4)"
                  }`,
                  color: "var(--color-text, #0d1b3e)",
                }}
              />
            </div>
            <p className="text-xs mt-1.5 ml-1 font-medium" style={{ color: hintColor }}>
              {hint}
            </p>
          </div>

          <button
            type="submit"
            disabled={status !== "available" || saving}
            className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-95 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #003da5, #1a55bd)" }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : (
              "Confirmar username"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
