import type { Metadata } from "next";
import Link from "next/link";
import { RotatingText } from "@/components/molecules/RotatingText";
import { LoginForm } from "@/components/organisms/LoginForm";
import { AuthTemplate } from "@/components/templates/AuthTemplate";

export const metadata: Metadata = { title: "Ingresar | Libtual" };

const LOGIN_PHRASES = [
  "Ingresa para llenar tu librería con tus libros favoritos",
  "¿Leíste algo nuevo? ¡Agrégalo a tu librería y comparte tu opinión!",
  "No dejes llenar de polvo tu librería. ¡Agrega tus nuevos descubrimientos!",
  "Tu próxima gran lectura podría estar en la librería de alguien más. ¡Descúbrela!",
  "Cada libro que lees cuenta una historia. Guárdala en tu librería.",
] as const;

export default function LoginPage() {
  return (
    <AuthTemplate title="Ingresa a tu cuenta" brandDescription={<RotatingText phrases={LOGIN_PHRASES} />} formSide="left">
      <LoginForm />
      <p className="text-center text-foreground/80">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="inline-flex min-h-11 items-center font-semibold text-foreground underline underline-offset-4">
          Regístrate
        </Link>
      </p>
    </AuthTemplate>
  );
}
