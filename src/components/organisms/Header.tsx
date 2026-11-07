import { Button } from "@/components/atoms/Button";
import { Logo } from "@/components/atoms/Logo";

export function Header() {
  return (
    <header className="border-b border-accent bg-surface text-surface-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <Button variant="secondary">Iniciar sesión</Button>
      </div>
    </header>
  );
}
