import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MainTemplate } from "@/components/templates/MainTemplate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inicio | Libtual" };

export default function HomePage() {
  return (
    <MainTemplate>
      <Suspense fallback={null}>
        <AuthenticatedHome />
      </Suspense>
    </MainTemplate>
  );
}

// El proxy ya redirige sin sesión; esta es la verificación autoritativa.
async function AuthenticatedHome() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/registro");

  return <h1 className="text-4xl font-semibold tracking-tight">INICIO</h1>;
}
