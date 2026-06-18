import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "¿Cuánto conocés a Lucre? 🎂",
  description: "Quiz de cumpleaños para Lucrecia",
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
