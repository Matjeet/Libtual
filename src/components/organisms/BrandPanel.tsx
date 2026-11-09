import type { ReactNode } from "react";

type BrandPanelProps = {
  title: string;
  description: ReactNode;
  className?: string;
};

// Panel de marca para equilibrar el espacio en pantallas grandes. Las formas son decorativas y usan solo tokens de la paleta.
export function BrandPanel({ title, description, className = "" }: BrandPanelProps) {
  return (
    <div className={`relative min-h-[28rem] flex-col justify-end overflow-hidden rounded-3xl bg-surface p-10 text-surface-foreground ${className}`}>
      <div aria-hidden="true" className="absolute -right-12 -top-12 size-48 rounded-full bg-secondary" />
      <div aria-hidden="true" className="absolute right-24 top-28 size-16 rounded-full bg-accent" />
      {/* En oscuro el círculo es más oscuro que el panel: queda detrás del texto claro y así no le resta contraste. */}
      <div aria-hidden="true" className="absolute -bottom-20 -left-20 size-64 rounded-full bg-primary opacity-15 dark:bg-background dark:opacity-40" />
      {/* Libro animado arriba a la izquierda, lejos de los círculos. Hecho con HyperFrames (design/open-book): un GIF por
          tema con el color del panel de fondo; con movimiento reducido se muestra el primer cuadro fijo. */}
      <picture className="relative mb-auto">
        <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcSet="/animations/open-book-dark.png" />
        <source media="(prefers-reduced-motion: reduce)" srcSet="/animations/open-book-light.png" />
        <source media="(prefers-color-scheme: dark)" srcSet="/animations/open-book-dark.gif" />
        <img src="/animations/open-book-light.gif" alt="" width={192} height={112} loading="lazy" className="block h-28 w-48" />
      </picture>
      <p className="relative text-5xl font-bold tracking-tight">{title}</p>
      <p className="relative mt-3 max-w-sm text-lg">{description}</p>
    </div>
  );
}
