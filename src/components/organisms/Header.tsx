import { Button } from "@/components/atoms/Button";
import { Logo } from "@/components/atoms/Logo";

export function Header() {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <Button variant="secondary">Iniciar sesión</Button>
      </div>
    </header>
  );
}
