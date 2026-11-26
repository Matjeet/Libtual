import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// /robots.txt para los buscadores: pueden recorrer las páginas públicas (inicio, ingresar y registro), pero no /inicio,
// la habitación privada de cada usuario (sin sesión redirige a /ingresar y no tiene nada que indexar).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/inicio",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
