import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteName = "Quiz de Lucre";
const title = "¿Cuánto conocés a Lucre?";
const description = "Quiz de cumpleaños para Lucrecia — ¡sumate y demostrá cuánto la conocés!";

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s · ${siteName}`,
  },
  description,
  applicationName: siteName,
  authors: [{ name: "Lucrecia" }],
  creator: siteName,
  publisher: siteName,
  category: "games",
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "es_AR",
    title,
    description,
    siteName,
  },
  twitter: {
    card: "summary",
    title,
    description,
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#ff6b9d",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
