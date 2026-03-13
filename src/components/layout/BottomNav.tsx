"use client";

import Link from "next/link";
import {
  Home01,
  Trophy01,
  Calendar,
  Users01,
  BarChart01,
} from "@untitledui/icons";

type NavItem = "home" | "predicciones" | "partidos" | "grupos" | "tabla" | "perfil";
interface Props { active: NavItem }

const items: { id: NavItem; label: string; href: string; Icon: React.ElementType }[] = [
  { id: "home",         label: "Inicio",   href: "/dashboard",    Icon: Home01 },
  { id: "predicciones", label: "Prode",    href: "/predicciones", Icon: Trophy01 },
  { id: "partidos",     label: "Partidos", href: "/partidos",     Icon: Calendar },
  { id: "grupos",       label: "Grupos",   href: "/grupos",       Icon: Users01 },
  { id: "tabla",        label: "Tabla",    href: "/tabla",        Icon: BarChart01 },
];

export default function BottomNav({ active }: Props) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bottom-nav-glass">
      <div
        className="flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
      >
        {items.map(({ id, label, href, Icon }) => {
          const isActive = id === active;
          return (
            <Link
              key={id}
              href={href}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all active:scale-90 relative min-w-[52px]"
            >
              {/* Active pill */}
              {isActive && <span className="absolute inset-0 rounded-2xl nav-active-pill" />}

              <span className="relative z-10">
                <Icon
                  width={22}
                  height={22}
                  style={{
                    color: isActive
                      ? "var(--color-brand-600, #003da5)"
                      : "var(--color-gray-400, #a4a7ae)",
                    strokeWidth: isActive ? 2.2 : 1.7,
                    transition: "color 0.2s, stroke-width 0.2s",
                  }}
                />
              </span>

              <span
                className="relative z-10 font-semibold transition-colors duration-200"
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.01em",
                  color: isActive
                    ? "var(--color-brand-600, #003da5)"
                    : "var(--color-gray-400, #a4a7ae)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
