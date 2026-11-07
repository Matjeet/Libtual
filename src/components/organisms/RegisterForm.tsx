"use client";

import { useActionState, useSyncExternalStore } from "react";
import { register, type RegisterState } from "@/app/registro/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { FormField } from "@/components/molecules/FormField";

export type Country = { code: string; name: string };

const noopSubscribe = () => () => {};

export function RegisterForm({ countries }: { countries: Country[] }) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(register, {});
  // Bloquea el envío nativo previo a la hidratación: en rutas con prerender parcial Next responde sin el shell y la página queda rota.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};
  // Remonta el formulario con cada respuesta para que tome los valores devueltos por la acción.
  const formKey = JSON.stringify(values);

  if (state.message) {
    return <p className="rounded-lg bg-surface p-4 text-surface-foreground" role="status">{state.message}</p>;
  }

  return (
    <form key={formKey} action={formAction} noValidate className="flex w-full max-w-sm flex-col gap-2">
      <FormField id="email" label="Correo electrónico" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={values.email}
          aria-invalid={Boolean(errors.email)} aria-describedby="email-error" />
      </FormField>

      <FormField id="password" label="Contraseña" error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={72}
          aria-invalid={Boolean(errors.password)} aria-describedby="password-error" />
      </FormField>

      <FormField id="username" label="Nombre de usuario" error={errors.username}>
        <Input id="username" name="username" autoComplete="username" required defaultValue={values.username}
          aria-invalid={Boolean(errors.username)} aria-describedby="username-error" />
      </FormField>

      <FormField id="country" label="País" error={errors.country}>
        <Select id="country" name="country" required defaultValue={values.country ?? ""}
          aria-invalid={Boolean(errors.country)} aria-describedby="country-error">
          <option value="" disabled>Selecciona tu país</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>{country.name}</option>
          ))}
        </Select>
      </FormField>

      <FormField id="birthDate" label="Fecha de nacimiento" error={errors.birthDate}>
        <Input id="birthDate" name="birthDate" type="date" required defaultValue={values.birthDate}
          aria-invalid={Boolean(errors.birthDate)} aria-describedby="birthDate-error" />
      </FormField>

      {state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      <Button type="submit" disabled={!hydrated || pending} className="mt-2">
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </Button>
    </form>
  );
}
