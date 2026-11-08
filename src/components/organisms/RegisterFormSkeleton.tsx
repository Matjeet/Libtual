import { Skeleton } from "@/components/atoms/Skeleton";

// Mismas medidas que RegisterForm para que no salte el layout al terminar de cargar.
export function RegisterFormSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex w-full max-w-sm flex-col gap-2">
      <span className="sr-only">Cargando formulario de registro</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-11 w-full" />
          <div className="h-5" />
        </div>
      ))}
      <Skeleton className="mt-2 h-11 w-full rounded-full" />
    </div>
  );
}
