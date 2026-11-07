"use server";

import { redirect } from "next/navigation";
import { ageOn } from "@/lib/age";
import { createClient } from "@/lib/supabase/server";

type Field = "email" | "password" | "username" | "country" | "birthDate";

export type RegisterState = {
  error?: string;
  message?: string;
  fieldErrors?: Partial<Record<Field, string>>;
  // Para volver a llenar el formulario tras un error (nunca la contraseña).
  values?: Partial<Record<Exclude<Field, "password">, string>>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const country = String(formData.get("country") ?? "");
  const birthDate = String(formData.get("birthDate") ?? "");
  const values = { email, username, country, birthDate };

  const fieldErrors: RegisterState["fieldErrors"] = {};
  if (!EMAIL.test(email)) fieldErrors.email = "Ingresa un correo válido.";
  if (password.length < 8 || password.length > 72) fieldErrors.password = "La contraseña debe tener entre 8 y 72 caracteres.";
  if (!USERNAME.test(username)) fieldErrors.username = "Usa de 3 a 20 letras, números o guion bajo.";
  if (!DATE.test(birthDate) || Number.isNaN(Date.parse(birthDate))) fieldErrors.birthDate = "Ingresa una fecha válida.";

  const supabase = await createClient();

  const { data: countryRow } = await supabase.from("countries").select("name, adult_age").eq("code", country).maybeSingle();
  if (!countryRow) {
    fieldErrors.country = "Selecciona un país de la lista.";
  } else if (!fieldErrors.birthDate && ageOn(birthDate) < countryRow.adult_age) {
    fieldErrors.birthDate = `Debes tener al menos ${countryRow.adult_age} años (mayoría de edad en ${countryRow.name}).`;
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors, values };

  const { data: available, error: rpcError } = await supabase.rpc("is_username_available", { p_username: username });
  if (rpcError) return { error: "No pudimos crear tu cuenta. Intenta de nuevo.", values };
  if (!available) return { fieldErrors: { username: "Ese nombre de usuario ya está en uso." }, values };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username, country, birth_date: birthDate } },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { fieldErrors: { email: "Ya existe una cuenta con este correo." }, values };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "La contraseña es demasiado débil." }, values };
    }
    return { error: "No pudimos crear tu cuenta. Intenta de nuevo.", values };
  }

  // Sin sesión significa que Supabase exige confirmar el correo antes de iniciar sesión.
  if (!data.session) return { message: "Revisa tu correo para confirmar tu cuenta." };

  redirect("/inicio");
}
