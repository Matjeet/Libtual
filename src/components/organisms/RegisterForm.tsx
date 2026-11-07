"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { register, type RegisterState } from "@/app/registro/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { CountrySelect } from "@/components/molecules/CountrySelect";
import { DateField } from "@/components/molecules/DateField";
import { FormField } from "@/components/molecules/FormField";
import { PasswordRules } from "@/components/molecules/PasswordRules";
import { validateAll, validateField, type Country, type RegisterField, type RegisterValues } from "@/lib/registration";

type Flags = Partial<Record<RegisterField, boolean>>;

const EMPTY: RegisterValues = { email: "", password: "", username: "", country: "", birthDate: "" };
const ALL_TOUCHED: Flags = { email: true, password: true, username: true, country: true, birthDate: true };
const TEXT_FIELDS = ["email", "password", "username", "birthDate"] as const;

export function RegisterForm({ countries }: { countries: Country[] }) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, {});
  const [values, setValues] = useState(EMPTY);
  // Un campo muestra su error al salir de él (touched), no mientras se escribe.
  const [touched, setTouched] = useState<Flags>({});
  // Los errores del servidor (p. ej. usuario en uso) se ocultan en cuanto se edita ese campo.
  const [editedSinceSubmit, setEditedSinceSubmit] = useState<Flags>({});
  const [passwordFocused, setPasswordFocused] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Los inputs no son controlados: si el usuario escribió antes de hidratar, el texto sigue en el DOM y se recupera aquí.
  useEffect(() => {
    const data = new FormData(formRef.current!);
    const typed = Object.fromEntries(TEXT_FIELDS.map((field) => [field, String(data.get(field) ?? "")]));
    setValues((current) => ({ ...current, ...typed }));
  }, []);

  const country = countries.find((item) => item.code === values.country);
  const allFilled = Object.values(values).every((value) => value.trim() !== "");

  const errorFor = (field: RegisterField) =>
    (touched[field] && validateField(field, values, country)) ||
    (!editedSinceSubmit[field] ? state.fieldErrors?.[field] : undefined);

  const change = (field: RegisterField) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setEditedSinceSubmit((current) => ({ ...current, [field]: true }));
  };
  const touch = (field: RegisterField) => () => setTouched((current) => ({ ...current, [field]: true }));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(ALL_TOUCHED);
    if (Object.keys(validateAll(values, country)).length > 0) return;
    setEditedSinceSubmit({});
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  if (state.message) {
    return <p className="rounded-lg bg-surface p-4 text-surface-foreground" role="status">{state.message}</p>;
  }

  const passwordError = errorFor("password");
  const showPasswordRules = passwordFocused || values.password !== "";
  const errors = {
    email: errorFor("email"),
    // Con la lista visible, el detalle ya está marcado en rojo ahí; el mensaje solo remite a ella.
    // Mientras se escribe, la lista da el feedback en vivo; el error aparece al salir del campo.
    password: passwordFocused
      ? undefined
      : passwordError && showPasswordRules && touched.password
        ? "La contraseña no cumple los requisitos marcados en rojo."
        : passwordError,
    username: errorFor("username"),
    country: errorFor("country"),
    birthDate: errorFor("birthDate"),
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-2">
      <FormField id="email" label="Correo electrónico" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required
          onChange={(event) => change("email")(event.target.value)} onBlur={touch("email")}
          aria-invalid={Boolean(errors.email)} aria-describedby="email-error" />
      </FormField>

      <FormField id="password" label="Contraseña" error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required maxLength={20}
          onChange={(event) => change("password")(event.target.value)}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => { setPasswordFocused(false); touch("password")(); }}
          aria-invalid={Boolean(errors.password)} aria-describedby="password-rules password-error" />
        {showPasswordRules && (
          <PasswordRules id="password-rules" password={values.password} showErrors={Boolean(touched.password && !passwordFocused)} />
        )}
      </FormField>

      <FormField id="username" label="Nombre de usuario" error={errors.username}>
        <Input id="username" name="username" autoComplete="username" required maxLength={20}
          onChange={(event) => change("username")(event.target.value)} onBlur={touch("username")}
          aria-invalid={Boolean(errors.username)} aria-describedby="username-error" />
      </FormField>

      <FormField id="country" label="País" error={errors.country}>
        <CountrySelect id="country" name="country" countries={countries} value={values.country}
          onChange={change("country")} onBlur={touch("country")}
          invalid={Boolean(errors.country)} describedBy="country-error" />
      </FormField>

      <FormField id="birthDate" label="Fecha de nacimiento" error={errors.birthDate}>
        <DateField id="birthDate" name="birthDate" required calendarLabel="Elegir fecha de nacimiento"
          value={values.birthDate} onChange={change("birthDate")} onBlur={touch("birthDate")}
          aria-invalid={Boolean(errors.birthDate)} aria-describedby="birthDate-error" />
      </FormField>

      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      {/* Deshabilitado también antes de hidratar (values vacíos): evita el envío nativo sin JavaScript. */}
      <Button type="submit" disabled={!allFilled || pending} className="mt-2">
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
