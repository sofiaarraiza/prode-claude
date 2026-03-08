"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

    // Intentar auto-unirse si ya hay sesión activa
    const tryAutoJoin = async () => {
      setAutoJoining(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // No hay sesión — guardar código en cookie y localStorage, redirigir a login
        document.cookie = `pending_invite_code=${upperCode}; path=/; max-age=600; SameSite=Lax`;
        localStorage.setItem('pending_invite_code', upperCode);
        router.replace("/auth/login");
        return;
      }

      // Hay sesión — unirse directamente
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
      // Guardar código en cookie y localStorage, redirigir a login
      document.cookie = `pending_invite_code=${code.toUpperCase()}; path=/; max-age=600; SameSite=Lax`;
      localStorage.setItem('pending_invite_code', code.toUpperCase());
      router.replace("/auth/login");
      return;
    }

    await joinWithCode(code, session.user.id);
  };

  if (autoJoining) {
    return (
      <main className="min-h-dvh bg-[#F4F6FB] flex items-center justify-center">
        <div className="text-center px-5">
          <div className="w-16 h-16 border-4 border-[#003DA5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold text-lg">Uniéndote al grupo...</p>
          <p className="text-gray-400 text-sm mt-1">Un momento</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#F4F6FB]">
      <div className="bg-fifa-pattern px-5 pt-14 pb-12">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-white/60 text-xs tracking-widest">GRUPOS</p>
            <h1 className="text-white font-display text-2xl" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
              UNIRME A UN GRUPO
            </h1>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-sm p-6">
          <div className="text-center mb-6">
            <span className="text-5xl block mb-3">🔑</span>
            <p className="text-gray-500 text-sm">
              Ingresá el código que te compartió el organizador del grupo
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: ABC123"
                required
                maxLength={6}
                className="w-full bg-[#F4F6FB] border-2 border-transparent rounded-2xl px-4 py-4 text-gray-800 text-2xl text-center font-bold tracking-[0.3em] focus:outline-none focus:border-[#003DA5] transition-colors"
                style={{ fontFamily: "Bebas Neue, sans-serif", letterSpacing: "0.3em" }}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.trim().length < 4}
              className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #003DA5, #1A5FBF)" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Buscando...
                </span>
              ) : (
                "Unirme al grupo"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function UnirseGrupoPage() {
  return (
    <Suspense>
      <UnirseGrupoContent />
    </Suspense>
  );
}
