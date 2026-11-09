"use client";

import { CircleUserRound, Pencil, TriangleAlert } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Flag } from "@/components/atoms/Flag";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { checkUsername, updateUsername } from "@/lib/profile";
import { usernameError } from "@/lib/registration";

export type Profile = { email: string; username: string; countryCode: string; countryName: string };

// Menú del perfil en el header: se abre sobre la página actual, sin navegar.
export function ProfileMenu({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(profile.username);
  const [username, setUsername] = useState(profile.username);
  const [editing, setEditing] = useState(false);
  // Igual que en el registro: el error de formato se muestra al salir del campo o al intentar guardar.
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const value = username.trim();
  const changed = editing && value !== saved;
  const error = serverError ?? (touched ? usernameError(value) : undefined);

  // Cerrar descarta la edición sin guardar.
  function close() {
    setOpen(false);
    setEditing(false);
    setUsername(saved);
    setTouched(false);
    setServerError(undefined);
    setNotice(undefined);
  }

  const onOutsidePointer = useEffectEvent((event: PointerEvent) => {
    if (!wrapperRef.current?.contains(event.target as Node)) close();
  });
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    // Con el modal abierto, Escape solo cierra el modal.
    if (event.key !== "Escape" || dialogRef.current?.open) return;
    close();
    triggerRef.current?.focus();
  });

  useEffect(() => {
    if (!open) return;
    document.addEventListener("pointerdown", onOutsidePointer);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("pointerdown", onOutsidePointer);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function save() {
    setTouched(true);
    if (usernameError(value)) return;
    startCheck(async () => {
      const result = await checkUsername(value);
      if (result.error) return setServerError(result.error);
      dialogRef.current?.showModal();
    });
  }

  function confirm() {
    startSave(async () => {
      const result = await updateUsername(value);
      dialogRef.current?.close();
      if (result.error || !result.username) return setServerError(result.error);
      setSaved(result.username);
      setUsername(result.username);
      setEditing(false);
      setTouched(false);
      setNotice("Tu nombre de usuario se actualizó.");
    });
  }

  return (
    <div ref={wrapperRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Mi perfil"
        aria-expanded={open}
        aria-controls="profile-menu"
        onClick={() => (open ? close() : setOpen(true))}
        className="inline-flex size-11 items-center justify-center rounded-full transition hover:bg-foreground/10"
      >
        <CircleUserRound aria-hidden="true" className="size-7" />
      </button>

      {open && (
        // Mobile-first: ocupa el ancho del header menos sus márgenes; desde sm es un panel de 20 rem bajo el icono.
        <div
          id="profile-menu"
          role="dialog"
          aria-labelledby="profile-menu-title"
          className="absolute inset-x-4 top-full mt-2 flex flex-col gap-4 rounded-2xl bg-card p-5 text-foreground shadow-lg ring-1 ring-foreground/10 sm:left-auto sm:right-6 sm:w-80 lg:right-8 xl:right-12"
        >
          <h2 id="profile-menu-title" className="text-lg font-semibold">
            Mi perfil
          </h2>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Correo</p>
            <p className="break-all text-foreground/80">{profile.email}</p>
          </div>

          <FormField id="profile-username" label="Nombre de usuario" error={error}>
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                id="profile-username"
                value={username}
                disabled={!editing}
                maxLength={20}
                autoComplete="username"
                onChange={(event) => {
                  setUsername(event.target.value);
                  setServerError(undefined);
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={Boolean(error)}
                aria-describedby="profile-username-error"
                className="disabled:bg-foreground/5 disabled:text-foreground/80"
              />
              <button
                type="button"
                aria-label="Editar nombre de usuario"
                onClick={() => {
                  setEditing(true);
                  setNotice(undefined);
                  inputRef.current?.focus();
                }}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full transition hover:bg-foreground/10"
              >
                <Pencil aria-hidden="true" className="size-5" />
              </button>
            </div>
          </FormField>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">País</p>
            <p className="flex items-center gap-2 text-foreground/80">
              <Flag code={profile.countryCode} />
              {profile.countryName}
            </p>
          </div>

          <p role="status" className="text-sm text-success empty:hidden">
            {notice}
          </p>

          <Button onClick={save} disabled={!changed || checking || saving} className="w-full">
            {checking ? "Verificando..." : "Guardar"}
          </Button>

          <div className="border-t border-foreground/10 pt-4">
            {/* shortcut: sin acción hasta implementar el flujo de eliminación del perfil. */}
            <Button variant="danger" className="w-full">
              Eliminar perfil
            </Button>
          </div>
        </div>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="username-dialog-title"
        aria-describedby="username-dialog-description"
        onCancel={(event) => saving && event.preventDefault()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-card p-6 text-foreground shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <h2 id="username-dialog-title" className="text-xl font-semibold">
          ¿Cambiar tu nombre de usuario?
        </h2>
        <div id="username-dialog-description" className="mt-3 flex flex-col gap-3">
          <p className="break-words">
            Tu nombre de usuario pasará de <strong>{saved}</strong> a <strong>{value}</strong>.
          </p>
          <p className="flex gap-2 font-medium">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
            Las personas que no sepan del cambio ya no podrán encontrar tu perfil desde el buscador.
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => dialogRef.current?.close()} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={saving}>
            {saving ? "Guardando..." : "Sí, cambiarlo"}
          </Button>
        </div>
      </dialog>
    </div>
  );
}
