"use server";

import { redirect } from "next/navigation";
import { validateAll, type Country, type RegisterField, type RegisterValues } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = {
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<RegisterField, string>>;
};

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const read = (key: RegisterField) => String(formData.get(key) ?? "");
  const values: RegisterValues = {
    email: read("email").trim().toLowerCase(),
    password: read("password"),
    username: read("username").trim(),
    country: read("country"),
    birthDate: read("birthDate"),
  };

  const supabase = await createClient();

  // El país y su mayoría de edad salen de la base de datos, nunca del cliente.
  const { data: row } = values.country
    ? await supabase.from("countries").select("code, name, adult_age").eq("code", values.country).maybeSingle()
    : { data: null };
  const country: Country | undefined = row ? { code: row.code, name: row.name, adultAge: row.adult_age } : undefined;

  const fieldErrors = validateAll(values, country);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { data: available, error: rpcError } = await supabase.rpc("is_username_available", { p_username: values.username });
  if (rpcError) return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  if (!available) return { fieldErrors: { username: "Ese nombre de usuario ya está en uso. Prueba con otro." } };

  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: { data: { username: values.username, country: values.country, birth_date: values.birthDate } },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { fieldErrors: { email: "Ya existe una cuenta con este correo." } };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "La contraseña es demasiado débil. Prueba con una diferente." } };
    }
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo." };
  }

  // Sin sesión significa que Supabase exige confirmar el correo antes de iniciar sesión.
  if (!data.session) return { message: "Revisa tu correo para confirmar tu cuenta." };

  redirect("/inicio");
}
