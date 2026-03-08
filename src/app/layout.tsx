import type { Metadata, Viewport } from "next";
import NavigationWrapper from "@/components/layout/NavigationWrapper";
import ThemeProvider from "@/components/layout/ThemeProvider";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003DA5" },
    { media: "(prefers-color-scheme: dark)",  color: "#0d2147" },
  ],
};

// Script que corre ANTES del paint para evitar flash de tema incorrecto
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch(e){}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: aplica clase dark antes del primer paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="max-w-md mx-auto min-h-dvh relative bg-app">
        <ThemeProvider>
          <NavigationWrapper>{children}</NavigationWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
