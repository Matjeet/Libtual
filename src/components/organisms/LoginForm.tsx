"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { login, type LoginState } from "@/app/ingresar/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { validateLogin, validateLoginField, type LoginField, type LoginValues } from "@/lib/login";

type Flags = Partial<Record<LoginField, boolean>>;

const EMPTY: LoginValues = { email: "", password: "" };
const FIELDS = ["email", "password"] as const;

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, {});
  const [values, setValues] = useState(EMPTY);
  // Un campo muestra su error al salir de él (touched), no mientras se escribe.
  const [touched, setTouched] = useState<Flags>({});
  // Campos editados desde la última respuesta del servidor; se reinician solos cuando llega una nueva.
  const [edited, setEdited] = useState<{ response: LoginState; fields: Flags }>({ response: state, fields: {} });
  const editedFields = edited.response === state ? edited.fields : {};
  const formRef = useRef<HTMLFormElement>(null);

  // Los inputs no son controlados: si el usuario escribió antes de hidratar, el texto sigue en el DOM y se recupera aquí.
  useEffect(() => {
    const data = new FormData(formRef.current!);
    setValues(Object.fromEntries(FIELDS.map((field) => [field, String(data.get(field) ?? "")])) as LoginValues);
  }, []);

  const isValid = Object.keys(validateLogin(values)).length === 0;

  // Mientras se envía, los errores del servidor son del intento anterior: no se muestran hasta tener la respuesta nueva.
  const serverError = (field: LoginField) => (pending || editedFields[field] ? undefined : state.fieldErrors?.[field]);
  const errorFor = (field: LoginField) => (touched[field] && validateLoginField(field, values)) || serverError(field);

  const change = (field: LoginField) => (value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setEdited((current) => ({
      response: state,
      fields: { ...(current.response === state ? current.fields : {}), [field]: true },
    }));
  };
  const touch = (field: LoginField) => () => setTouched((current) => ({ ...current, [field]: true }));

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Defensa extra: con el botón deshabilitado no debería llegarse aquí con datos inválidos.
    if (!isValid) return setTouched({ email: true, password: true });
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  const errors = { email: errorFor("email"), password: errorFor("password") };

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-2">
      <FormField id="email" label="Correo electrónico" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required
          onChange={(event) => change("email")(event.target.value)} onBlur={touch("email")}
          aria-invalid={Boolean(errors.email)} aria-describedby="email-error" />
      </FormField>

      <FormField id="password" label="Contraseña" error={errors.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required
          onChange={(event) => change("password")(event.target.value)} onBlur={touch("password")}
          aria-invalid={Boolean(errors.password)} aria-describedby="password-error" />
      </FormField>

      {!pending && state.error && <p className="text-sm text-danger" role="alert">{state.error}</p>}

      {/* Solo se habilita con todo lleno y válido; antes de hidratar (values vacíos) también queda deshabilitado. */}
      <Button type="submit" disabled={!isValid || pending} className="mt-2">
        {pending ? "Ingresando..." : "Ingresar"}
      </Button>
    </form>
  );
}
