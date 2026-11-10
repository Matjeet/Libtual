import { Skeleton } from "@/components/atoms/Skeleton";

// Misma caja que la estantería: llena el espacio disponible y toca el borde de abajo.
export function BookshelfSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex min-h-0 flex-1 flex-col">
      <span className="sr-only">Cargando tu estantería</span>
      <Skeleton className="flex-1 rounded-b-none rounded-t-lg" />
    </div>
  );
}
