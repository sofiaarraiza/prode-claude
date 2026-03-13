"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowNarrowLeft,
  ArrowNarrowRight,
  Mail01,
  Lock01,
} from "@untitledui/icons";

// Inline Google logo SVG as a component
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(error.message);
      else setMessage("¡Revisá tu email para confirmar tu cuenta!");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error)
        setError(error.message === "Invalid login credentials" ? "Email o contraseña incorrectos" : error.message);
      else {
        const { data: prof } = await supabase.from("profiles").select("username").eq("id", data.user.id).single();
        router.replace(prof?.username ? "/dashboard" : "/auth/username");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh page-gradient" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        className="px-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)", paddingBottom: 24 }}
      >
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.push("/")}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:opacity-70 transition-opacity glass-pill"
          >
            <ArrowNarrowLeft width={18} height={18} className="glass-btn" />
          </button>
        </div>

        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "var(--color-gray-500, #717680)", letterSpacing: "0.12em" }}
        >
          Prode Mundial 2026
        </p>
        <h1
          style={{ fontFamily: "Inter, sans-serif", fontSize: 26, fontWeight: 800, color: "var(--color-gray-900, #181d27)", lineHeight: 1.15 }}
        >
          {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
        </h1>
      </div>

      {/* ── FORM ────────────────────────────────────────────────────────── */}
      <div className="px-4 space-y-3">

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl text-sm font-semibold active:opacity-80 transition-opacity disabled:opacity-50 card-white"
          style={{ border: "1px solid var(--color-gray-300, #d5d7da)", color: "var(--color-gray-700, #414651)" }}
        >
          <GoogleLogo />
          Continuar con Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--color-gray-200, #e9eaeb)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--color-gray-400, #a4a7ae)" }}>o</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-gray-200, #e9eaeb)" }} />
        </div>

        {message ? (
          /* Success state */
          <div
            className="card-white rounded-2xl px-5 py-8 text-center"
            style={{ border: "1px solid #bbf7d0", boxShadow: "0 1px 8px rgba(22,163,74,0.08)" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "#dcfce7" }}>
              <Mail01 width={22} height={22} style={{ color: "#16a34a" }} />
            </div>
            <p className="text-sm font-semibold mb-1" style={{ color: "#15803d" }}>¡Email enviado!</p>
            <p className="text-xs" style={{ color: "#16a34a" }}>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleEmail} className="space-y-3">

            {/* Email field */}
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
              >
                <Mail01 width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
                  Email
                </p>
              </div>
              <div className="px-4 py-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full text-sm font-semibold focus:outline-none bg-transparent"
                  style={{ color: "var(--color-gray-900, #181d27)" }}
                />
              </div>
            </div>

            {/* Password field */}
            <div
              className="card-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: "1px solid var(--color-gray-100, #f5f5f5)" }}
              >
                <Lock01 width={13} height={13} style={{ color: "var(--color-gray-400, #a4a7ae)" }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
                  Contraseña
                </p>
              </div>
              <div className="px-4 py-3">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full text-sm font-semibold focus:outline-none bg-transparent"
                  style={{ color: "var(--color-gray-900, #181d27)" }}
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
              disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity disabled:opacity-50"
              style={{ background: "var(--color-brand-600, #003da5)" }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
                  <ArrowNarrowRight width={16} height={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* Toggle sign up / login */}
        <p className="text-center text-sm pt-2" style={{ color: "var(--color-gray-500, #717680)" }}>
          {isSignUp ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
            className="font-semibold"
            style={{ color: "var(--color-brand-600, #003da5)" }}
          >
            {isSignUp ? "Iniciá sesión" : "Registrate gratis"}
          </button>
        </p>

      </div>
    </div>
  );
}
