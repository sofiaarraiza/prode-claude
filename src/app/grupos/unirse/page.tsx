"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowNarrowLeft,
  ArrowNarrowRight,
  Key01,
} from "@untitledui/icons";

function UnirseGrupoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const paramCode = searchParams.get("code");
    if (!paramCode) return;

    const upperCode = paramCode.toUpperCase();
    setCode(upperCode);

    const tryAutoJoin = async () => {
      setAutoJoining(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        document.cookie = `pending_invite_code=${upperCode}; path=/; max-age=600; SameSite=Lax`;
        localStorage.setItem("pending_invite_code", upperCode);
        router.replace("/auth/login");
        return;
      }

      await joinWithCode(upperCode, session.user.id);
    };

    tryAutoJoin();
  }, [searchParams]);

  const joinWithCode = async (inviteCode: string, userId: string) => {
    const { data: group, error: findError } = await supabase
      .from("groups")
      .select("*")
      .eq("invite_code", inviteCode.toUpperCase().trim())
      .single();

    if (findError || !group) {
      setError("Código inválido. Revisá que esté bien escrito.");
      setLoading(false);
      setAutoJoining(false);
      return;
    }

    const { data: existing } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .single();

    if (existing) {
      router.replace(`/grupos/${group.id}`);
      return;
    }

    const { error: joinError } = await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: userId });

    if (joinError) {
      setError("No se pudo unir al grupo. Intentá de nuevo.");
      setLoading(false);
      setAutoJoining(false);
      return;
    }

    router.replace(`/grupos/${group.id}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      document.cookie = `pending_invite_code=${code.toUpperCase()}; path=/; max-age=600; SameSite=Lax`;
      localStorage.setItem("pending_invite_code", code.toUpperCase());
      router.replace("/auth/login");
      return;
    }

    await joinWithCode(code, session.user.id);
  };

  if (autoJoining) {
    return (
      <div className="min-h-dvh flex items-center justify-center page-gradient" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="text-center px-5">
          <div
            className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-5"
            style={{ borderColor: "var(--color-brand-200, #b2ccff)", borderTopColor: "var(--color-brand-600, #003da5)" }}
          />
          <p className="text-base font-semibold mb-1" style={{ color: "var(--color-gray-900, #181d27)" }}>
            Uniéndote al grupo...
          </p>
          <p className="text-sm" style={{ color: "var(--color-gray-500, #717680)" }}>
            Un momento
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh page-gradient" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        className="relative px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: 24,
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-pill"
          >
            <ArrowNarrowLeft width={18} height={18} className="glass-btn" />
          </button>
        </div>

        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--color-gray-500, #717680)", letterSpacing: "0.12em" }}
        >
          Grupos
        </p>
        <h1
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 26,
            fontWeight: 800,
            color: "var(--color-gray-900, #181d27)",
            lineHeight: 1.15,
          }}
        >
          Unirme a un grupo
        </h1>
      </div>

      {/* ── FORM ────────────────────────────────────────────────────────── */}
      <div className="px-4 space-y-4">

        {/* Icon + instruction */}
        <div
          className="card-white rounded-2xl flex items-center gap-4 px-4 py-4"
          style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--color-brand-50, #eff4ff)" }}
          >
            <Key01 width={20} height={20} style={{ color: "var(--color-brand-600, #003da5)" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--color-gray-600, #535862)" }}>
            Ingresá el <strong style={{ color: "var(--color-gray-900, #181d27)" }}>código</strong> que te compartió el organizador del grupo.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {/* Code input */}
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
            >
              <Key01 width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
                Código de invitación
              </p>
            </div>
            <div className="px-4 py-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                required
                maxLength={6}
                className="w-full text-center font-extrabold text-3xl focus:outline-none bg-transparent tracking-[0.3em]"
                style={{
                  color: code ? "var(--color-brand-600, #003da5)" : "var(--color-gray-300, #d5d7da)",
                  letterSpacing: "0.3em",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-xl" style={{ background: "#fef2f2", border: "1px solid #fecdd3" }}>
              <p className="text-sm text-center" style={{ color: "#e11d48" }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
            style={{ background: "var(--color-brand-600, #003da5)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                Unirme al grupo
                <ArrowNarrowRight width={16} height={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function UnirseGrupoPage() {
  return (
    <Suspense>
      <UnirseGrupoContent />
    </Suspense>
  );
}
