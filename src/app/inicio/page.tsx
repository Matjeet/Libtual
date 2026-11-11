import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PaperBag } from "@/components/atoms/PaperBag";
import { SideTable } from "@/components/atoms/SideTable";
import { Bookshelf } from "@/components/organisms/Bookshelf";
import { BookshelfSkeleton } from "@/components/organisms/BookshelfSkeleton";
import { RoomTemplate } from "@/components/templates/RoomTemplate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inicio | Libtual" };

export default function HomePage() {
  return (
    <RoomTemplate>
      <Suspense fallback={<BookshelfSkeleton />}>
        <AuthenticatedHome />
      </Suspense>
    </RoomTemplate>
  );
}

// El proxy ya redirige sin sesión; esta es la verificación autoritativa.
async function AuthenticatedHome() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/ingresar");

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* La bolsa va en el espacio libre a la izquierda de la estantería, sin taparla: solo desde xl hay lugar.
          Su ancho es el espacio libre menos un margen, con un máximo de 13rem.
          Al pasar el mouse se comprime un poco desde la base (que está en el suelo) y se queda así mientras dure el hover. */}
      <PaperBag className="absolute bottom-0 right-full mr-4 hidden w-[min(13rem,calc((100vw-72rem)/2+2rem))] origin-bottom transition-transform duration-300 ease-out hover:scale-x-[1.04] hover:scale-y-[0.9] motion-reduce:transition-none xl:block" />
      <Bookshelf />
      {/* La mesa, igual que la bolsa pero a la derecha: mismo ancho y apoyada en el borde de abajo. */}
      <SideTable className="absolute bottom-0 left-full ml-4 hidden w-[min(13rem,calc((100vw-72rem)/2+2rem))] xl:block" />
    </div>
  );
}
