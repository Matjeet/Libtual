import { Skeleton } from "@/components/atoms/Skeleton";
import { PAINTING_FRAMES } from "@/lib/paintings";

// Misma forma que el mercado: una sección por cuadro con su título y una fila de miniaturas.
const THUMB_ASPECT = { oval: "aspect-[77/107]", portrait: "aspect-[76/116]", round: "aspect-square", landscape: "aspect-[110/70]" };

export function PaintingMarketSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-8">
      <span className="sr-only">Cargando las imágenes del mercado</span>
      {PAINTING_FRAMES.map(({ shape }) => (
        <div key={shape}>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-1 h-5 w-36" />
          <div className="mt-3 grid grid-cols-2 gap-4 min-[30rem]:grid-cols-3 lg:grid-cols-4">
            {[0, 1].map((i) => (
              <div key={i} className="p-2">
                <Skeleton className={`w-full ${THUMB_ASPECT[shape]}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
