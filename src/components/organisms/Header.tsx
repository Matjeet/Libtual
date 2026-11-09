import { Suspense } from "react";
import { Logo } from "@/components/atoms/Logo";
import { HeaderActions, HeaderActionsSkeleton } from "@/components/organisms/HeaderActions";

// El botón "Ingresar" está oculto por defecto: solo lo muestran las páginas que lo indican (hoy `/` y `/registro`).
// Con sesión iniciada se muestra el menú del perfil en su lugar.
// relative z-20: el menú del perfil se posiciona respecto al header y queda por encima del contenido.
export function Header({ showSignIn = false }: { showSignIn?: boolean }) {
  return (
    <header className="relative z-20 border-b border-accent bg-header text-surface-foreground">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
        <Logo />
        <Suspense fallback={<HeaderActionsSkeleton showSignIn={showSignIn} />}>
          <HeaderActions showSignIn={showSignIn} />
        </Suspense>
      </div>
    </header>
  );
}
