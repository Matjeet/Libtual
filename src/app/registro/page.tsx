import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm, type Country } from "@/components/organisms/RegisterForm";
import { RegisterFormSkeleton } from "@/components/organisms/RegisterFormSkeleton";
import { MainTemplate } from "@/components/templates/MainTemplate";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Registro | Libtual" };

export default function RegisterPage() {
  return (
    <MainTemplate>
      <section className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">Crea tu cuenta</h1>
        <Suspense fallback={<RegisterFormSkeleton />}>
          <RegisterSection />
        </Suspense>
      </section>
    </MainTemplate>
  );
}

async function RegisterSection() {
  const supabase = await createClient();
  const { data: countries, error } = await supabase.from("countries").select("code, name").order("name");

  if (error) return <p className="text-danger" role="alert">No pudimos cargar el formulario. Intenta de nuevo más tarde.</p>;

  return <RegisterForm countries={countries as Country[]} />;
}
