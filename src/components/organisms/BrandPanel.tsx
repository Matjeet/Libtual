import type { ReactNode } from "react";

// Panel de marca para equilibrar el espacio en pantallas grandes. Las formas son decorativas y usan solo tokens de la paleta.
export function BrandPanel({ title, description, className = "" }: { title: string; description: ReactNode; className?: string }) {
  return (
    <div className={`relative min-h-[28rem] flex-col justify-end overflow-hidden rounded-3xl bg-surface p-10 text-surface-foreground ${className}`}>
      <div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full bg-secondary" />
      <div aria-hidden="true" className="absolute right-24 top-28 size-16 rounded-full bg-accent" />
      <div aria-hidden="true" className="absolute -bottom-20 -left-20 size-64 rounded-full bg-primary opacity-15" />
      <p className="relative text-5xl font-bold tracking-tight">{title}</p>
      <p className="relative mt-3 max-w-sm text-lg">{description}</p>
    </div>
  );
}
