import type { ReactNode } from "react";
import { BooksBackground } from "@/components/organisms/BooksBackground";
import { Header } from "@/components/organisms/Header";

// showSignIn: muestra el botón "Ingresar" en el header (oculto por defecto).
export function MainTemplate({ children, showSignIn = false }: { children: ReactNode; showSignIn?: boolean }) {
  return (
    <>
      <Header showSignIn={showSignIn} />
      {/* El fondo animado cubre solo el body; el header queda sólido encima. */}
      <div className="relative flex flex-1 flex-col">
        <BooksBackground />
        {/* Desde 2xl, zoom agranda un 30 % todo el contenido (textos, espacios, ancho máximo e imágenes) por igual. */}
        <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12 2xl:[zoom:1.3]">{children}</main>
      </div>
    </>
  );
}
