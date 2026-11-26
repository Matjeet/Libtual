// Reglas del login compartidas por el formulario y la server action.
// La contraseña solo es obligatoria: sus requisitos aplican al crearla, no al ingresar.
import { emailError } from "./registration.ts";

export type LoginField = "email" | "password";
export type LoginValues = Record<LoginField, string>;

export function validateLoginField(field: LoginField, values: LoginValues): string | undefined {
  if (field === "email") return emailError(values.email.trim());
  if (!values.password) return "La contraseña es obligatoria.";
}

export function validateLogin(values: LoginValues) {
  const errors: Partial<Record<LoginField, string>> = {};
  for (const field of ["email", "password"] as const) {
    const error = validateLoginField(field, values);
    if (error) errors[field] = error;
  }
  return errors;
}
