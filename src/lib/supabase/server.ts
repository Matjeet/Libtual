import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// Crear uno por request: el cliente guarda los headers de caché de la primera escritura de cookies.
export async function createClient() {
  // Supabase lee Date.now() al cargar la sesión; Next no lo permite durante un prerender aunque haya cookies.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Llamado desde un Server Component: no puede escribir cookies; el proxy refresca la sesión.
          }
        },
      },
    },
  );
}
