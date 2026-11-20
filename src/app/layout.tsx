import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InlineScript } from "@/components/atoms/InlineScript";
import { THEME_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libtual",
  description: "Libtual",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // El script de abajo agrega data-theme antes de que React hidrate.
      suppressHydrationWarning
    >
      <head>
        {/* Aplica el modo de color guardado antes de pintar, para que no se vea un instante el del sistema. */}
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
