"use client";

import { useTheme } from "./ThemeProvider";

interface Props {
  /** "header" = ícono blanco sobre fondo azul  |  "settings" = pill sobre fondo claro/oscuro */
  variant?: "header" | "settings";
}

export default function ThemeToggle({ variant = "header" }: Props) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  if (variant === "settings") {
    return (
      <button
        onClick={toggle}
        className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: isDark ? "var(--color-primary)" : "#e5e7eb" }}
        aria-label="Cambiar tema"
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 flex items-center justify-center text-xs
            ${isDark ? "translate-x-6" : "translate-x-0"}`}
        >
          {isDark ? "🌙" : "☀️"}
        </span>
      </button>
    );
  }

  // Header variant: botón circular blanco translúcido
  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center active:scale-90 transition-transform"
      aria-label="Cambiar tema"
    >
      <span className="text-base leading-none select-none">
        {isDark ? "☀️" : "🌙"}
      </span>
    </button>
  );
}
