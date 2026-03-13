"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronDown,
  Trophy01,
  Target01,
  Users01,
  ClipboardCheck,
  HelpCircle,
  Lock01,
} from "@untitledui/icons";
import BottomNav from "@/components/layout/BottomNav";

const POINTS_ROWS = [
  {
    badge: "3",
    bg: "var(--color-brand-600, #003da5)",
    title: "Resultado exacto",
    desc: "Predecís el marcador exacto. Ej: predecís 2-1 y sale 2-1.",
  },
  {
    badge: "1",
    bg: "#d97706",
    title: "Ganador o empate",
    desc: "Acertás quién gana o que empatan, pero no el marcador exacto.",
  },
  {
    badge: "0",
    bg: "var(--color-gray-100, #f5f5f5)",
    textColor: "var(--color-gray-400, #a4a7ae)",
    title: "Sin puntos",
    desc: "El resultado no tiene nada que ver con tu predicción.",
  },
];

const LEVELS = [
  { emoji: "✨", label: "Novato",    pts: "0 pts",      color: "var(--color-gray-500, #717680)",  bg: "rgba(100,116,139,0.10)" },
  { emoji: "🌱", label: "Aprendiz", pts: "1 – 9 pts",   color: "#16a34a",                         bg: "rgba(22,163,74,0.10)" },
  { emoji: "⚡", label: "En forma", pts: "10 – 29 pts",  color: "#d97706",                         bg: "rgba(217,119,6,0.10)" },
  { emoji: "🔥", label: "Adivino",  pts: "30 – 59 pts",  color: "#ea580c",                         bg: "rgba(234,88,12,0.10)" },
  { emoji: "🏆", label: "Experto",  pts: "60 – 99 pts",  color: "var(--color-brand-600, #003da5)", bg: "var(--color-brand-50, #eff4ff)" },
  { emoji: "👑", label: "Leyenda",  pts: "100+ pts",     color: "#7c3aed",                         bg: "rgba(124,58,237,0.10)" },
];


const FAQS = [
  {
    Icon: Target01,
    title: "¿De qué se trata?",
    content:
      "El prode del Mundial 2026 es un juego de predicciones donde predecís el resultado de cada partido antes de que empiece. Competís contra tus amigos dentro de un grupo y gana quien más puntos junte.",
  },
  {
    Icon: HelpCircle,
    title: "¿Hasta cuándo puedo cargar predicciones?",
    content:
      "Podés cargar y modificar tus predicciones hasta 24 horas antes del inicio de cada partido. Pasado ese plazo, el partido se bloquea y ya no podés cambiar nada.",
  },
  {
    Icon: Users01,
    title: "¿Cómo funcionan los grupos?",
    content:
      "Cada predicción se guarda dentro de un grupo. Podés pertenecer a varios grupos a la vez (familia, trabajo, amigos) y tener predicciones en cada uno. El leaderboard de cada grupo es independiente.",
  },
  {
    Icon: ClipboardCheck,
    title: "¿Cómo invito amigos?",
    content:
      "Entrá a tu grupo y tocá 'Invitar amigos'. Podés compartir el link directo por WhatsApp — cuando tu amigo lo toque, se une automáticamente al grupo (si ya tiene cuenta) o se une después de registrarse.",
  },
  {
    Icon: Lock01,
    title: "¿Puedo ver las predicciones de mis rivales?",
    content:
      "Las predicciones de tus compañeros de grupo están ocultas hasta que el partido termina. Una vez que el árbitro pita el final, podés ver qué predijo cada uno y cuántos puntos sacó.",
  },
  {
    Icon: Trophy01,
    title: "¿Quién gana el grupo?",
    content:
      "Gana quien más puntos acumule al final del torneo. En caso de empate, gana quien tenga más resultados exactos (3 pts). El sistema de premios se arregla entre los participantes.",
  },
];

const QUICK_LINKS = [
  { label: "Crear o unirme a un grupo", href: "/grupos", Icon: Users01 },
  { label: "Cargar mis predicciones", href: "/predicciones", Icon: ClipboardCheck },
  { label: "Ver el fixture del Mundial", href: "/partidos", Icon: Target01 },
];

export default function AyudaPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="min-h-dvh pb-24 page-gradient" style={{ fontFamily: "Inter, sans-serif" }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div
        className="relative px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: 24,
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

          <div className="flex items-center gap-1 px-1.5 py-1.5 rounded-2xl glass-pill">
            <HelpCircle className="glass-btn" width={18} height={18} />
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1 mb-4">
          <p
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: "var(--color-gray-500, #717680)", letterSpacing: "0.12em" }}
          >
            Prode Mundial 2026
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
            Cómo jugar
          </h1>
        </div>

        {/* Hero pill */}
        <div
          className="rounded-2xl px-4 py-3.5 flex items-center gap-3"
          style={{
            background: "var(--color-brand-600, #003da5)",
            boxShadow: "0 4px 16px rgba(0,61,165,0.25)",
          }}
        >
          <span style={{ fontSize: 26 }}>🌍</span>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">Predecí · Competí · Ganá</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.65)" }}>
              Copa del Mundo FIFA 2026 · 48 selecciones
            </p>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.18)", color: "white" }}
          >
            11 Jun
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div className="px-4 space-y-4">

        {/* Sistema de puntos */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
              Sistema de puntos
            </p>
          </div>
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            <div className="px-4 py-3.5 space-y-4">
              {POINTS_ROWS.map(({ badge, bg, textColor, title, desc }, i) => (
                <div
                  key={badge}
                  className="flex items-start gap-3"
                  style={i > 0 ? { paddingTop: 12, borderTop: "1px solid var(--color-gray-100, #f5f5f5)" } : {}}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}
                  >
                    <span
                      className="font-extrabold text-lg"
                      style={{ color: textColor ?? "white", fontFamily: "Inter, sans-serif" }}
                    >
                      {badge}
                    </span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-gray-900, #181d27)" }}>{title}</p>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "var(--color-gray-500, #717680)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Niveles */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
              Sistema de niveles
            </p>
          </div>
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            <div className="px-4 py-3.5 space-y-2.5">
              {LEVELS.map(({ emoji, label, pts, color, bg }, i) => (
                <div
                  key={label}
                  className="flex items-center gap-3"
                  style={i > 0 ? { paddingTop: 10, borderTop: "1px solid var(--color-gray-100, #f5f5f5)" } : {}}
                >
                  {/* Emoji pill */}
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: bg }}
                  >
                    {emoji}
                  </span>
                  {/* Label */}
                  <p className="flex-1 text-sm font-semibold" style={{ color }}>
                    {label}
                  </p>
                  {/* Points range */}
                  <span
                    className="text-xs font-semibold tabular-nums px-2.5 py-1 rounded-full"
                    style={{ background: bg, color }}
                  >
                    {pts}
                  </span>
                </div>
              ))}
            </div>
            {/* Streak note */}
            <div
              className="px-4 py-3 flex items-start gap-2"
              style={{ borderTop: "1px solid var(--color-gray-100, #f5f5f5)", background: "rgba(234,88,12,0.04)" }}
            >
              <span className="text-base flex-shrink-0">🔥</span>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-gray-500, #717680)" }}>
                Si tenés una racha de <strong style={{ color: "var(--color-gray-800, #1d2939)" }}>3 o más aciertos seguidos</strong>, tu nivel muestra 🔥 como bonus aunque no hayas alcanzado el siguiente rango.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs — accordion */}

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
              Preguntas frecuentes
            </p>
          </div>
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            {FAQS.map(({ Icon, title, content }, i) => {
              const isOpen = openFaq === title;
              return (
                <div
                  key={title}
                  style={i > 0 ? { borderTop: "1px solid var(--color-gray-100, #f5f5f5)" } : {}}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : title)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-70 transition-opacity"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--color-brand-50, #eff4ff)" }}
                    >
                      <Icon width={15} height={15} style={{ color: "var(--color-brand-600, #003da5)" }} />
                    </div>
                    <p className="flex-1 text-sm font-semibold" style={{ color: "var(--color-gray-900, #181d27)" }}>
                      {title}
                    </p>
                    <ChevronDown
                      width={16}
                      height={16}
                      style={{
                        color: "var(--color-gray-400, #a4a7ae)",
                        flexShrink: 0,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className="px-4 pb-4"
                      style={{ paddingLeft: 60 }}
                    >
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--color-gray-600, #535862)" }}
                      >
                        {content}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-gray-500, #717680)" }}>
              Accesos rápidos
            </p>
          </div>
          <div
            className="card-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--color-gray-200, #e9eaeb)", boxShadow: "0 1px 3px rgba(10,13,18,0.08)" }}
          >
            {QUICK_LINKS.map(({ label, href, Icon }, i) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:opacity-70 transition-opacity"
                style={i > 0 ? { borderTop: "1px solid var(--color-gray-100, #f5f5f5)" } : {}}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-brand-50, #eff4ff)" }}
                >
                  <Icon width={16} height={16} style={{ color: "var(--color-brand-600, #003da5)" }} />
                </div>
                <span className="flex-1 text-sm font-semibold text-left" style={{ color: "var(--color-gray-800, #1d2939)" }}>
                  {label}
                </span>
                <ChevronRight width={14} height={14} style={{ color: "var(--color-gray-300, #d5d7da)" }} />
              </button>
            ))}
          </div>
        </div>

      </div>

      <BottomNav active="home" />
    </div>
  );
}
