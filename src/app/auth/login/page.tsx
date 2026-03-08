"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error)
        setError(
          error.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : error.message,
        );
      else router.replace("/dashboard");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-dvh bg-fifa-pattern flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-8">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-95 transition-transform"
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
          <p className="text-white/60 text-xs tracking-widest">
            PRODE MUNDIAL 2026
          </p>
          <h1
            className="text-white font-display text-2xl"
            style={{ fontFamily: "Bebas Neue, sans-serif" }}
          >
            {isSignUp ? "CREAR CUENTA" : "INICIAR SESIÓN"}
          </h1>
        </div>
      </div>

      {/* Form card */}
      <div className="flex-1 bg-app rounded-t-3xl px-6 pt-8 pb-10">
        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full bg-surface border-2 border-soft text-[color:var(--color-text-2)] font-semibold py-4 px-6 rounded-2xl text-base shadow-sm active:scale-95 transition-transform disabled:opacity-50 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-surface-3" />
          <span className="text-[color:var(--color-muted)] text-sm">o</span>
          <div className="flex-1 h-px bg-surface-3" />
        </div>

        {/* Email form */}
        {message ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center animate-fade-in">
            <span className="text-2xl mb-2 block">✉️</span>
            <p className="text-green-700 font-medium text-sm">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleEmail} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-muted)] mb-1.5 tracking-wide uppercase">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full bg-surface border-2 border-soft rounded-2xl px-4 py-3.5 text-[color:var(--color-text)] text-base focus:outline-none focus:border-[color:var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[color:var(--color-muted)] mb-1.5 tracking-wide uppercase">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-surface border-2 border-soft rounded-2xl px-4 py-3.5 text-[color:var(--color-text)] text-base focus:outline-none focus:border-[color:var(--color-primary)] transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-semibold text-base text-white transition-all active:scale-95 disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #003DA5, #1A5FBF)",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cargando...
                </span>
              ) : isSignUp ? (
                "Crear cuenta"
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>
        )}

        <p className="text-center text-[color:var(--color-muted)] text-sm mt-6">
          {isSignUp ? "¿Ya tenés cuenta?" : "¿No tenés cuenta?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setMessage("");
            }}
            className="font-semibold text-[color:var(--color-primary)]"
          >
            {isSignUp ? "Iniciá sesión" : "Registrate gratis"}
          </button>
        </p>
      </div>
    </main>
  );
}
