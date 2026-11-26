import { Skeleton } from "@/components/atoms/Skeleton";

// Misma caja que la estantería: un número entero de pisos de 10.5rem más el tablón de arriba, apoyada abajo.
export function BookshelfSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex min-h-0 flex-1 flex-col justify-end">
      <span className="sr-only">Cargando tu estantería</span>
      <Skeleton className="h-[calc(max(10.5rem,round(down,100%-1.25rem,10.5rem))+1.25rem)] shrink-0 rounded-b-none rounded-t-lg" />
    </div>
  );
}
