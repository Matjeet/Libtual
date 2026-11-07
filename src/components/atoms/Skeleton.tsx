// Bloque de carga decorativo: el contenedor que lo usa debe anunciar el estado de carga.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-foreground/10 motion-reduce:animate-none ${className}`} />;
}
