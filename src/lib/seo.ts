import type { Metadata } from "next";

// Dirección pública del sitio: con ella se arman las URL absolutas de la canonical, Open Graph y el sitemap.
// Con un dominio propio se cambia solo aquí (y la Site URL de Supabase).
export const SITE_URL = "https://libtual.vercel.app";

// Páginas públicas, las que van en el sitemap.
export const PUBLIC_PATHS = ["/", "/ingresar", "/registro"];

// La imagen al compartir, generada por app/opengraph-image.
const SHARE_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: "Libtual: tu librería virtual de libros leídos y por leer" };

export const HOME_TITLE = "Libtual: tu librería virtual de libros leídos y por leer";
export const HOME_DESCRIPTION =
  "Libtual es tu librería virtual: guarda los libros que leíste, los que estás leyendo y los que quieres leer, y comparte tu opinión con otros lectores.";

// Metadatos de una página pública: título (sin "| Libtual"; sin título, el de la portada), descripción y canonical.
// Open Graph y X (al compartir el enlace) repiten título y descripción: Next no los toma solos, y si los heredara del
// layout todas las páginas se compartirían con los datos de la portada. La imagen (app/opengraph-image) también va
// explícita: un openGraph propio de la página reemplaza la que Next agregaría desde la raíz.
export function pageMetadata({ title, description, path }: { title?: string; description: string; path: string }): Metadata {
  const shared = { title: title ? `${title} | Libtual` : HOME_TITLE, description, images: [SHARE_IMAGE] };
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: { ...shared, url: path, siteName: "Libtual", type: "website" },
    twitter: { ...shared, card: "summary_large_image" },
  };
}
