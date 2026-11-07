import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/organisms/RegisterForm";
import { RegisterFormSkeleton } from "@/components/organisms/RegisterFormSkeleton";
import { MainTemplate } from "@/components/templates/MainTemplate";
import type { Country } from "@/lib/registration";
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
  const { data, error } = await supabase.from("countries").select("code, name, adult_age").order("name");

  if (error) return <p className="text-danger" role="alert">No pudimos cargar el formulario. Intenta de nuevo más tarde.</p>;

  const countries: Country[] = data.map((row) => ({ code: row.code, name: row.name, adultAge: row.adult_age }));
  return <RegisterForm countries={countries} />;
}
