import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/organisms/RegisterForm";
import { RegisterFormSkeleton } from "@/components/organisms/RegisterFormSkeleton";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import type { Country } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Registro | Libtual" };

export default function RegisterPage() {
  return (
    <AuthTemplate title="Crea tu cuenta" brandDescription="Crea tu cuenta para empezar." formSide="right" showSignIn>
      <Suspense fallback={<RegisterFormSkeleton />}>
        <RegisterSection />
      </Suspense>
    </AuthTemplate>
  );
}

async function RegisterSection() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("countries").select("code, name, adult_age").order("name");

  if (error) return <p className="text-danger" role="alert">No pudimos cargar el formulario. Intenta de nuevo más tarde.</p>;

  const countries: Country[] = data.map((row) => ({ code: row.code, name: row.name, adultAge: row.adult_age }));
  return <RegisterForm countries={countries} />;
}
