import type { MetadataRoute } from "next";

// /robots.txt para los buscadores: pueden recorrer las páginas públicas (inicio, ingresar y registro), pero no /inicio,
// la habitación privada de cada usuario (sin sesión redirige a /ingresar y no tiene nada que indexar).
// shortcut: sin la línea Sitemap, porque todavía no hay sitemap ni dominio de producción; agregarla junto con el sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/inicio",
    },
  };
}
