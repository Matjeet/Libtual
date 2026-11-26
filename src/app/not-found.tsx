import type { Metadata } from "next";
import Link from "next/link";
import { BrokenShelfIllustration } from "@/components/atoms/BrokenShelfIllustration";
import { buttonClasses } from "@/components/atoms/Button";
import { MainTemplate } from "@/components/templates/MainTemplate";

// Next le agrega noindex y responde con 404.
export const metadata: Metadata = { title: "Página no encontrada" };

// Página para cualquier URL que no existe (y para notFound()): en español, con un camino de vuelta al inicio.
export default function NotFound() {
  return (
    <MainTemplate>
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <BrokenShelfIllustration className="h-36 w-[155px]" />
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">No encontramos esta página</h1>
        <p className="max-w-md text-lg text-foreground/80">
          Puede que el enlace esté mal escrito o que la página ya no exista. Vuelve al inicio para seguir armando tu librería.
        </p>
        <Link href="/" className={buttonClasses()}>
          Volver al inicio
        </Link>
      </section>
    </MainTemplate>
  );
}
