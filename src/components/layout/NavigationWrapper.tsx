"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { Suspense } from "react";

export default function NavigationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // No mostrar BottomNav en login
  const isAuthPage = pathname?.startsWith("/auth");

  // Determinar la tab activa basada en la ruta
  let activeTab: "home" | "predicciones" | "grupos" | "tabla" = "home";
  if (pathname?.startsWith("/predicciones")) activeTab = "predicciones";
  else if (pathname?.startsWith("/grupos")) activeTab = "grupos";
  else if (pathname?.startsWith("/tabla")) activeTab = "tabla";
  else if (pathname === "/perfil" || pathname === "/dashboard")
    activeTab = "home";

  return (
    <>
      <Suspense fallback={null}>{children}</Suspense>
      {!isAuthPage && <BottomNav active={activeTab} />}
    </>
  );
}
