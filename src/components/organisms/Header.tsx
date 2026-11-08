import Link from "next/link";
import { buttonClasses } from "@/components/atoms/Button";
import { Logo } from "@/components/atoms/Logo";

export function Header() {
  return (
    <header className="border-b border-accent bg-header text-surface-foreground">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-12">
        <Logo />
        <Link href="/ingresar" className={buttonClasses("secondary")}>
          Ingresar
        </Link>
      </div>
    </header>
  );
}
