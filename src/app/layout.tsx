import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { InlineScript } from "@/components/atoms/InlineScript";
import { HOME_DESCRIPTION, HOME_TITLE, SITE_URL } from "@/lib/seo";
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

// metadataBase: las URL relativas (canonical, Open Graph) se completan con la del sitio. El título y la descripción
// son los de la portada; cada página pública define los suyos con pageMetadata (el título se completa con "| Libtual").
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: HOME_TITLE, template: "%s | Libtual" },
  description: HOME_DESCRIPTION,
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
