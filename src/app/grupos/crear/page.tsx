"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Users01,
  ArrowNarrowLeft,
  ArrowNarrowRight,
  AlignLeft,
  Lightbulb01,
} from "@untitledui/icons";

export default function CrearGrupoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/auth/login"); return; }

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        admin_id: session.user.id,
      })
      .select()
      .single();

    if (groupError || !group) {
      setError("No se pudo crear el grupo. Intentá de nuevo.");
      setLoading(false);
      return;
    }

    await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: session.user.id });

    router.replace(`/grupos/${group.id}`);
  };

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
          Crear grupo
        </h1>
      </div>

      {/* ── FORM ────────────────────────────────────────────────────────── */}
      <div className="px-4 space-y-4">

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nombre */}
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
            >
              <Users01 width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
                Nombre del grupo <span style={{ color: "#e11d48" }}>*</span>
              </p>
            </div>
            <div className="px-4 py-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Los Cracks de la Familia"
                required
                maxLength={50}
                className="w-full text-sm font-semibold focus:outline-none bg-transparent"
                style={{ color: "var(--color-gray-900, #181d27)" }}
              />
            </div>
          </div>

          {/* Descripción */}
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
            >
              <AlignLeft width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
                Descripción <span className="normal-case font-normal" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>(opcional)</span>
              </p>
            </div>
            <div className="px-4 py-3">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Prode de la familia con $500 de apuesta"
                maxLength={150}
                rows={3}
                className="w-full text-sm focus:outline-none bg-transparent resize-none"
                style={{ color: "var(--color-gray-900, #181d27)" }}
              />
              <p className="text-right text-xs mt-1" style={{ color: "var(--color-gray-300, #d5d7da)" }}>
                {description.length}/150
              </p>
            </div>
          </div>

          {/* Tip */}
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-2xl"
            style={{ background: "var(--color-brand-50, #eff4ff)", border: "1px solid var(--color-brand-100, #d1e0ff)" }}
          >
            <Lightbulb01 width={16} height={16} style={{ color: "var(--color-brand-600, #003da5)", flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-brand-700, #003da5)" }}>
              Al crear el grupo vas a obtener un <strong>código de invitación</strong> para compartir con tus amigos por WhatsApp o link directo.
            </p>
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
            disabled={loading || !name.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
            style={{ background: "var(--color-brand-600, #003da5)" }}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                Crear grupo
                <ArrowNarrowRight width={16} height={16} />
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
