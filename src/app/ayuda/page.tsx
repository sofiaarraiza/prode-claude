"use client";

import { useRouter } from "next/navigation";

const SECTIONS = [
  {
    emoji: "🎯",
    title: "¿De qué se trata?",
    content: "El prode del Mundial 2026 es un juego de predicciones donde vos predecís el resultado de cada partido antes de que empiece. Competís contra tus amigos dentro de un grupo y gana quien más puntos junte.",
  },
  {
    emoji: "⚽",
    title: "¿Cómo se juegan los puntos?",
    rows: [
      { badge: "3", color: "#003DA5", title: "Resultado exacto", desc: "Predecís el marcador exacto. Ej: predecís 2-1 y sale 2-1. ¡Máxima puntuación!" },
      { badge: "1", color: "#F59E0B", title: "Ganador o empate", desc: "Acertás quién gana o que empatan, pero no el marcador exacto. Ej: predecís 2-1 y sale 3-0." },
      { badge: "0", color: "#E5E7EB", textColor: "#9CA3AF", title: "Sin puntos", desc: "El resultado no tiene nada que ver con tu predicción." },
    ],
  },
  {
    emoji: "⏰",
    title: "¿Hasta cuándo puedo cargar predicciones?",
    content: "Podés cargar y modificar tus predicciones hasta 24 horas antes del inicio de cada partido. Pasado ese plazo, el partido se bloquea y ya no podés cambiar nada.",
  },
  {
    emoji: "👥",
    title: "¿Cómo funcionan los grupos?",
    content: "Cada predicción se guarda dentro de un grupo. Podés pertenecer a varios grupos a la vez (familia, trabajo, amigos) y tener predicciones en cada uno. El leaderboard de cada grupo es independiente.",
  },
  {
    emoji: "📨",
    title: "¿Cómo invito amigos?",
    content: "Entrá a tu grupo y tocá 'Invitar amigos'. Podés compartir el link directo por WhatsApp — cuando tu amigo lo toque, se une automáticamente al grupo (si ya tiene cuenta) o se une después de registrarse.",
  },
  {
    emoji: "🔒",
    title: "¿Puedo ver las predicciones de mis rivales?",
    content: "Las predicciones de tus compañeros de grupo están ocultas hasta que el partido termina. Una vez que el árbitro pita el final, podés ver qué predijo cada uno y cuántos puntos sacó.",
  },
  {
    emoji: "🏆",
    title: "¿Quién gana el grupo?",
    content: "Gana quien más puntos acumule al final del torneo. En caso de empate, gana quien tenga más resultados exactos (3 pts). El sistema de premios o apuestas se arregla por fuera de la app entre los participantes.",
  },
  {
    emoji: "🌍",
    title: "¿Cuándo empieza el Mundial?",
    content: "La Copa del Mundo FIFA 2026 arranca el 11 de junio de 2026 con México 🇲🇽 vs Sudáfrica 🇿🇦 en el Estadio Azteca. El torneo incluye 48 selecciones distribuidas en 12 grupos, con 104 partidos en total.",
  },
];

export default function AyudaPage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#F0F4FF] pb-10">
      {/* Header */}
      <div className="bg-fifa-pattern px-5 pt-14 pb-8 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-90 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-white/60 text-xs tracking-widest">PRODE MUNDIAL 2026</p>
            <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Bebas Neue, sans-serif" }}>
              CÓMO JUGAR
            </h1>
          </div>
        </div>

        {/* Trophy decoration */}
        <div className="mt-6 relative z-10 flex items-center justify-center">
          <div className="bg-white/10 rounded-3xl px-8 py-5 text-center">
            <span className="text-5xl block mb-2">🏆</span>
            <p className="text-white font-bold text-base">Predecí · Competí · Ganá</p>
            <p className="text-white/60 text-xs mt-1">Copa del Mundo FIFA 2026</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {SECTIONS.map((section, i) => (
          <div key={i} className="bg-white rounded-3xl shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{section.emoji}</span>
              <h2 className="font-bold text-gray-800 text-base">{section.title}</h2>
            </div>

            {section.content && (
              <p className="text-gray-600 text-sm leading-relaxed">{section.content}</p>
            )}

            {section.rows && (
              <div className="space-y-3">
                {section.rows.map((row, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: row.color }}
                    >
                      <span
                        className="font-bold text-lg"
                        style={{ color: row.textColor ?? "white", fontFamily: "Bebas Neue, sans-serif" }}
                      >
                        {row.badge}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{row.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{row.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Quick links */}
        <div className="bg-white rounded-3xl shadow-sm p-5">
          <h2 className="font-bold text-gray-800 text-base mb-3">🚀 Empezar</h2>
          <div className="space-y-2">
            {[
              { label: "Crear o unirme a un grupo", href: "/grupos", emoji: "👥" },
              { label: "Cargar mis predicciones", href: "/predicciones", emoji: "⚽" },
              { label: "Ver el fixture del Mundial", href: "/partidos", emoji: "📋" },
            ].map(({ label, href, emoji }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 bg-[#F0F4FF] rounded-2xl px-4 py-3.5 active:scale-95 transition-transform"
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-semibold text-gray-700 flex-1 text-left">{label}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
