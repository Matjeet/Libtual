"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { BrokenBookIllustration } from "@/components/atoms/BrokenBookIllustration";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { FormField } from "@/components/molecules/FormField";
import { deleteAccount } from "@/lib/profile";

type Step = "warning" | "password" | "farewell";

// Botón "Eliminar cuenta" y su modal en tres pasos: advertencia, contraseña y despedida.
export function DeleteAccount() {
  const [step, setStep] = useState<Step>("warning");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);

  // Cada paso enfoca su control principal; en la advertencia es Cancelar, la opción segura.
  useEffect(() => {
    if (step === "password") passwordRef.current?.focus();
    if (step === "farewell") homeRef.current?.focus();
  }, [step]);

  function open() {
    setStep("warning");
    setPassword("");
    setError(undefined);
    dialogRef.current?.showModal();
    cancelRef.current?.focus();
  }

  // refresh: el header vuelve a leer la sesión (ya cerrada) y deja de mostrar el menú del perfil.
  function goHome() {
    router.replace("/");
    router.refresh();
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!password) return;
    startTransition(async () => {
      const result = await deleteAccount(password);
      if (result.deleted) return setStep("farewell");
      setError(result.error);
    });
  }

  return (
    <>
      <Button variant="danger" className="min-w-40" onClick={open}>
        Eliminar cuenta
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="delete-dialog-title"
        onCancel={(event) => pending && event.preventDefault()}
        onClose={() => step === "farewell" && goHome()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-card p-6 text-foreground shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        {step === "warning" && (
          <>
            <h2 id="delete-dialog-title" className="text-xl font-semibold">
              ¿Eliminar tu cuenta?
            </h2>
            <p className="mt-3 flex gap-2 font-medium">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-danger" />
              Esta acción es irreversible. Una vez eliminada tu cuenta, todos sus datos se perderán definitivamente.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setStep("password")}>
                Continuar
              </Button>
              <Button ref={cancelRef} onClick={() => dialogRef.current?.close()}>
                Cancelar
              </Button>
            </div>
          </>
        )}

        {step === "password" && (
          <form onSubmit={submit} noValidate>
            <h2 id="delete-dialog-title" className="text-xl font-semibold">
              Confirma con tu contraseña
            </h2>
            <p className="mt-2 text-foreground/80">Para eliminar tu cuenta, escribe tu contraseña.</p>
            <div className="mt-4">
              <FormField id="delete-password" label="Contraseña" error={error}>
                <Input
                  ref={passwordRef}
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(undefined);
                  }}
                  aria-invalid={Boolean(error)}
                  aria-describedby="delete-password-error"
                />
              </FormField>
            </div>
            <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => dialogRef.current?.close()} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" variant="destructive" disabled={!password || pending}>
                {pending ? "Eliminando..." : "Eliminar cuenta"}
              </Button>
            </div>
          </form>
        )}

        {step === "farewell" && (
          <div className="flex flex-col items-center text-center">
            <BrokenBookIllustration className="h-24 w-28" />
            <h2 id="delete-dialog-title" className="mt-4 text-xl font-semibold">
              Lamentamos que te vayas
            </h2>
            <p className="mt-2 text-foreground/80">Tu cuenta fue eliminada. Esperamos que pronto vuelvas a Libtual.</p>
            <Button ref={homeRef} className="mt-6" onClick={goHome}>
              Ir al inicio
            </Button>
          </div>
        )}
      </dialog>
    </>
  );
}
