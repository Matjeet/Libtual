import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandPanel } from "@/components/organisms/BrandPanel";
import { RegisterForm } from "@/components/organisms/RegisterForm";
import { RegisterFormSkeleton } from "@/components/organisms/RegisterFormSkeleton";
import { MainTemplate } from "@/components/templates/MainTemplate";
import type { Country } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Registro | Libtual" };

export default function RegisterPage() {
  return (
    <MainTemplate>
      {/* Mobile-first: una columna; desde lg el panel de marca equilibra el espacio junto al formulario. */}
      <section className="flex flex-col items-center gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
        <BrandPanel className="hidden lg:flex" title="Libtual" description="Crea tu cuenta para empezar." />
        {/* Bloque sólido sobre el fondo animado. En celular va de borde a borde (así el calendario conserva el ancho
            para días de 44 px); desde sm es una tarjeta. */}
        <div className="-mx-4 flex flex-col items-center gap-6 self-stretch bg-card px-4 py-8 shadow-sm sm:mx-0 sm:w-full sm:max-w-md sm:self-center sm:rounded-2xl sm:p-8 sm:shadow-lg sm:ring-1 sm:ring-foreground/10 lg:justify-self-center">
          <h1 className="text-3xl font-semibold tracking-tight">Crea tu cuenta</h1>
          <Suspense fallback={<RegisterFormSkeleton />}>
            <RegisterSection />
          </Suspense>
        </div>
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
