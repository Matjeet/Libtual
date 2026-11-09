import Link from "next/link";
import { buttonClasses } from "@/components/atoms/Button";
import { Skeleton } from "@/components/atoms/Skeleton";
import { ProfileMenu } from "@/components/organisms/ProfileMenu";
import { createClient } from "@/lib/supabase/server";

// Lado derecho del header: con sesión, el menú del perfil; sin sesión, el botón "Ingresar" si la página lo pide.
export async function HeaderActions({ showSignIn }: { showSignIn: boolean }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;

  if (!userId) {
    return showSignIn ? (
      <Link href="/ingresar" className={buttonClasses("secondary")}>
        Ingresar
      </Link>
    ) : null;
  }

  const { data } = await supabase.from("profiles").select("email, username, country_code, countries(name)").eq("id", userId).maybeSingle();
  // shortcut: sin perfil (error de lectura) el header queda sin menú; mostrar un aviso si llega a pasar.
  if (!data) return null;
  // Relación muchos a uno: Supabase devuelve un objeto, aunque sin tipos generados lo infiere como arreglo.
  const country = data.countries as unknown as { name: string } | null;

  return (
    <ProfileMenu
      profile={{ email: data.email, username: data.username, countryCode: data.country_code, countryName: country?.name ?? data.country_code }}
    />
  );
}

// Mismo tamaño que lo que se mostrará: el botón "Ingresar" en las páginas que lo piden, el icono del perfil en el resto.
export function HeaderActionsSkeleton({ showSignIn }: { showSignIn: boolean }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando tu sesión</span>
      <Skeleton className={showSignIn ? "h-11 w-[5.75rem] rounded-full" : "size-11 rounded-full"} />
    </div>
  );
}
