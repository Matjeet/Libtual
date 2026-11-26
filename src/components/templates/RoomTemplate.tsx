import type { ReactNode } from "react";
import { Header } from "@/components/organisms/Header";

// Página de inicio: fondo sólido y alto fijo de la ventana. La página no hace scroll; lo hace su contenido (la estantería).
// Arriba y a los lados deja aire; abajo el contenido toca el borde de la pantalla.
export function RoomTemplate({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-room">
      <Header />
      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-6 pt-18 sm:px-10 sm:pt-22 lg:px-16 lg:pt-26">{children}</main>
    </div>
  );
}
