"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NavigationWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Never show BottomNav on auth pages or landing page
  const isAuthPage =
    pathname?.startsWith("/auth") ||
    pathname === "/" ||
    pathname?.startsWith("/admin");

  // Determine active tab from route
  let activeTab: "home" | "predicciones" | "partidos" | "grupos" | "tabla" =
    "home";
  if (pathname?.startsWith("/predicciones")) activeTab = "predicciones";
  else if (pathname?.startsWith("/partidos")) activeTab = "partidos";
  else if (pathname?.startsWith("/grupos")) activeTab = "grupos";
  else if (pathname?.startsWith("/tabla")) activeTab = "tabla";

  const showNav = isAuthenticated && !isAuthPage;

  return (
    <>
      <Suspense fallback={null}>{children}</Suspense>
      {showNav && <BottomNav active={activeTab} />}
    </>
  );
}
