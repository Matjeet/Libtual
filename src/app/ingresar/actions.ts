"use server";

import { redirect } from "next/navigation";
import { validateLogin, type LoginField, type LoginValues } from "@/lib/login";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
  fieldErrors?: Partial<Record<LoginField, string>>;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const values: LoginValues = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };

  const fieldErrors = validateLogin(values);
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(values);

  if (error) {
    // No se indica cuál de los dos datos falló, para no revelar qué correos tienen cuenta.
    if (error.code === "invalid_credentials") return { error: "El correo o la contraseña no son correctos." };
    if (error.code === "email_not_confirmed") return { error: "Confirma tu correo antes de ingresar." };
    if (error.code === "over_request_rate_limit") return { error: "Demasiados intentos. Espera un momento y vuelve a intentarlo." };
    return { error: "No pudimos iniciar sesión. Intenta de nuevo." };
  }

  redirect("/inicio");
}
