"use client";

import { CircleUserRound, LogOut, Pencil, TriangleAlert } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Flag } from "@/components/atoms/Flag";
import { DeleteAccount } from "@/components/organisms/DeleteAccount";
import { signOut } from "@/lib/auth";
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
    // Con un modal abierto (cambio de nombre o eliminación de la cuenta), Escape solo cierra el modal.
    if (event.key !== "Escape" || wrapperRef.current?.querySelector("dialog[open]")) return;
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
          aria-label="Mi perfil"
          className="absolute inset-x-4 top-full mt-4 flex flex-col gap-4 rounded-2xl bg-card p-5 text-foreground shadow-lg ring-1 ring-foreground/10 sm:left-auto sm:right-6 sm:w-80 lg:right-8 xl:right-12"
        >
          {/* Pico de la burbuja: un cuadrado girado, centrado bajo el icono (el panel y el icono comparten borde derecho). */}
          <span
            aria-hidden="true"
            className="absolute -top-2.5 right-3 size-5 rotate-45 rounded-tl-[3px] border-l border-t border-foreground/10 bg-card"
          />
          {/* Formulario con server action: cierra la sesión aunque el JavaScript aún no haya cargado. */}
          <form action={signOut} className="self-end">
            <Button type="submit" variant="ghost" className="gap-2">
              Cerrar sesión
              <LogOut aria-hidden="true" className="size-5" />
            </Button>
          </form>

          {/* Cada dato: etiqueta pequeña, valor grande y una línea debajo. */}
          <div className="border-b border-foreground/20 pb-2">
            <p className="text-sm text-foreground/70">Correo</p>
            <p className="break-all text-lg">{profile.email}</p>
          </div>

          {/* Al editar, la línea de la fila hace de subrayado del input. */}
          <div
            className={`border-b pb-2 transition focus-within:border-foreground ${error ? "border-danger focus-within:border-danger" : "border-foreground/20"}`}
          >
            <label htmlFor="profile-username" className="text-sm text-foreground/70">
              Nombre de usuario
            </label>
            {editing ? (
              <input
                ref={inputRef}
                id="profile-username"
                value={username}
                maxLength={20}
                autoComplete="username"
                onChange={(event) => {
                  setUsername(event.target.value);
                  setServerError(undefined);
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={Boolean(error)}
                aria-describedby="profile-username-error"
                className="block h-11 w-full bg-transparent text-lg outline-none"
              />
            ) : (
              // Mismo alto que el input (44 px por el botón del lápiz): al editar no se mueve nada.
              <p className="flex items-center gap-1 text-lg">
                <span className="min-w-0 break-all">{saved}</span>
                <button
                  type="button"
                  aria-label="Editar nombre de usuario"
                  onClick={() => {
                    setEditing(true);
                    setNotice(undefined);
                  }}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full transition hover:bg-foreground/10"
                >
                  <Pencil aria-hidden="true" className="size-5" />
                </button>
              </p>
            )}
            <p id="profile-username-error" className="text-sm text-danger" aria-live="polite">
              {error}
            </p>
            <p role="status" className="text-sm text-success">
              {notice}
            </p>
          </div>

          <div className="border-b border-foreground/20 pb-2">
            <p className="text-sm text-foreground/70">País</p>
            <p className="flex items-center gap-3 text-lg">
              {profile.countryName}
              <Flag code={profile.countryCode} />
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            {/* Guardar solo aparece al editar el nombre de usuario. */}
            {editing && (
              <Button onClick={save} disabled={!changed || checking || saving} className="min-w-40">
                {checking ? "Verificando..." : "Guardar"}
              </Button>
            )}
            <DeleteAccount />
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
          <Button variant="ghost" onClick={() => dialogRef.current?.close()} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={saving}>
            {saving ? "Guardando..." : "Sí, cámbialo"}
          </Button>
        </div>
      </dialog>
    </div>
  );
}
