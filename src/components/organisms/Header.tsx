import Link from "next/link";
import { buttonClasses } from "@/components/atoms/Button";
import { Logo } from "@/components/atoms/Logo";

// El botón "Ingresar" está oculto por defecto: solo lo muestran las páginas que lo indican (hoy `/` y `/registro`).
export function Header({ showSignIn = false }: { showSignIn?: boolean }) {
  return (
    <header className="border-b border-accent bg-header text-surface-foreground">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
        <Logo />
        {showSignIn && (
          <Link href="/ingresar" className={buttonClasses("secondary")}>
            Ingresar
          </Link>
        )}
      </div>
    </header>
  );
}
