import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/organisms/LoginForm";
import { AuthTemplate } from "@/components/templates/AuthTemplate";

export const metadata: Metadata = { title: "Ingresar | Libtual" };

export default function LoginPage() {
  return (
    <AuthTemplate title="Ingresa a tu cuenta" brandDescription="Ingresa para continuar." formSide="left">
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
