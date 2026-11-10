import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
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

  return <Bookshelf />;
}
