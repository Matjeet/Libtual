// Reglas del registro compartidas por el formulario (validación al salir de cada campo) y la server action.
import { ageOn } from "./age.ts";

export type RegisterField = "email" | "password" | "username" | "country" | "birthDate";
export type RegisterValues = Record<RegisterField, string>;
export type Country = { code: string; name: string; adultAge: number };

export const PASSWORD_RULES = [
  { id: "length", label: "Entre 8 y 20 caracteres", test: (v: string) => [...v].length >= 8 && [...v].length <= 20 },
  { id: "number", label: "Al menos un número", test: (v: string) => /\p{N}/u.test(v) },
  { id: "upper", label: "Al menos una letra mayúscula", test: (v: string) => /\p{Lu}/u.test(v) },
  { id: "lower", label: "Al menos una letra minúscula", test: (v: string) => /\p{Ll}/u.test(v) },
  { id: "special", label: "Al menos un carácter especial (por ejemplo ! @ # $ . -)", test: (v: string) => /[^\p{L}\p{N}]/u.test(v) },
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[A-Za-z0-9_]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string) {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date.getUTCFullYear() >= 1900;
}

// "today" en YYYY-MM-DD (UTC por defecto, igual que la base de datos).
export function validateField(
  field: RegisterField,
  values: RegisterValues,
  country?: Country,
  today = new Date().toISOString().slice(0, 10),
): string | undefined {
  const value = field === "password" ? values.password : values[field].trim();

  switch (field) {
    case "email":
      if (!value) return "El correo es obligatorio.";
      if (!EMAIL.test(value)) return "El correo no es válido. Debe tener el formato nombre@dominio.com.";
      return;
    case "password": {
      if (!value) return "La contraseña es obligatoria.";
      const missing = PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label.toLowerCase());
      if (missing.length) return `A la contraseña le falta: ${missing.join(", ")}.`;
      return;
    }
    case "username":
      if (!value) return "El nombre de usuario es obligatorio.";
      if (value.length < 3 || value.length > 20) return "El nombre de usuario debe tener entre 3 y 20 caracteres.";
      if (!USERNAME.test(value)) return "Usa solo letras sin tildes, números y guion bajo (_), sin espacios.";
      return;
    case "country":
      if (!value) return "Selecciona tu país.";
      if (!country) return "Selecciona un país de la lista.";
      return;
    case "birthDate":
      if (!value) return "La fecha de nacimiento es obligatoria.";
      if (!isRealDate(value)) return "La fecha de nacimiento no es válida.";
      if (value > today) return "La fecha de nacimiento no puede estar en el futuro.";
      if (country && ageOn(value, today) < country.adultAge) {
        return `Debes tener al menos ${country.adultAge} años, la mayoría de edad en ${country.name}.`;
      }
      return;
  }
}

export function validateAll(values: RegisterValues, country?: Country, today?: string) {
  const errors: Partial<Record<RegisterField, string>> = {};
  for (const field of Object.keys(values) as RegisterField[]) {
    const error = validateField(field, values, country, today);
    if (error) errors[field] = error;
  }
  return errors;
}
