import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/atoms/Skeleton";
import { MainTemplate } from "@/components/templates/MainTemplate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inicio | Libtual" };

export default function HomePage() {
  return (
    <MainTemplate>
      <Suspense fallback={<HomeSkeleton />}>
        <AuthenticatedHome />
      </Suspense>
    </MainTemplate>
  );
}

function HomeSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando inicio</span>
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

// El proxy ya redirige sin sesión; esta es la verificación autoritativa.
async function AuthenticatedHome() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/ingresar");

  return <h1 className="text-4xl font-semibold tracking-tight">INICIO</h1>;
}
