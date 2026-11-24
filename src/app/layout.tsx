import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Patrimônia — Gestão financeira familiar", template: "%s | Patrimônia" },
  description: "Plataforma profissional de gestão financeira, lucros, despesas e patrimônio familiar.",
  applicationName: "Patrimônia",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Patrimônia", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#4F46E5",
  viewportFit: "cover",
};

const themeScript = `
try {
  var saved = localStorage.getItem('patrimonia-theme');
  var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (dark) document.documentElement.classList.add('dark');
} catch (e) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton />
        <PwaRegister />
      </body>
    </html>
  );
}
