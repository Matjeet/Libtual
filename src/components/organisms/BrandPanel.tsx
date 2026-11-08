import type { ReactNode } from "react";

type BrandPanelProps = {
  title: string;
  description: ReactNode;
  // Ilustración opcional arriba a la izquierda, en el espacio libre (lejos de los círculos de la derecha).
  decoration?: ReactNode;
  className?: string;
};

// Panel de marca para equilibrar el espacio en pantallas grandes. Las formas son decorativas y usan solo tokens de la paleta.
export function BrandPanel({ title, description, decoration, className = "" }: BrandPanelProps) {
  return (
    <div className={`relative min-h-[28rem] flex-col justify-end overflow-hidden rounded-3xl bg-surface p-10 text-surface-foreground ${className}`}>
      <div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full bg-secondary" />
      <div aria-hidden="true" className="absolute right-24 top-28 size-16 rounded-full bg-accent" />
      {/* En oscuro el círculo es más oscuro que el panel: queda detrás del texto claro y así no le resta contraste. */}
      <div aria-hidden="true" className="absolute -bottom-20 -left-20 size-64 rounded-full bg-primary opacity-15 dark:bg-background dark:opacity-40" />
      {decoration && <div className="relative mb-auto">{decoration}</div>}
      <p className="relative text-5xl font-bold tracking-tight">{title}</p>
      <p className="relative mt-3 max-w-sm text-lg">{description}</p>
    </div>
  );
}
