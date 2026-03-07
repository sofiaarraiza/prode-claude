import type { Metadata, Viewport } from "next";
import NavigationWrapper from "@/components/layout/NavigationWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description: "¡Jugá el prode del Mundial con tus amigos!",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Prode 2026",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#003DA5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="max-w-md mx-auto min-h-dvh relative">
        <NavigationWrapper>{children}</NavigationWrapper>
      </body>
    </html>
  );
}
