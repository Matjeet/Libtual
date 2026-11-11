"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { PaperBag } from "@/components/atoms/PaperBag";
import { SideTable } from "@/components/atoms/SideTable";

// Ancho de la bolsa y la mesa desde xl: el espacio libre al lado de la estantería menos la separación y 1rem de margen
// con el borde de la pantalla, con un máximo de 13rem.
const SIDE_WIDTH = "xl:w-[min(13rem,calc((100vw-72rem)/2+3rem-var(--side-gap)))]";

// La habitación de la página de inicio: bolsa | estantería | mesa.
// - Desde xl hay espacio a los lados: la bolsa y la mesa van junto a la estantería, apoyadas en el borde de abajo.
// - Por debajo de xl no caben: son tres paneles del ancho del contenido y se pasa de uno a otro deslizando.
//   El scroll snap obligatorio (con snap-always) avanza siempre un panel completo por gesto, nunca a medias.
//   La bolsa y la mesa se limitan también por el alto del panel (cqh) para no cortarse en pantallas bajas;
//   desde xl el panel es absoluto y sin alto propio, por eso ahí vuelve a container-type normal.
export function RoomScene({ children }: { children: ReactNode }) {
  const sceneRef = useRef<HTMLDivElement>(null);

  // Muestra la estantería (el panel del medio) al cargar y cada vez que la pantalla baja de xl.
  // Desde xl no hay scroll y mover scrollLeft no tiene efecto.
  useLayoutEffect(() => {
    const scene = sceneRef.current!;
    const showBookshelf = () => {
      scene.scrollLeft = scene.clientWidth;
    };
    showBookshelf();
    const wide = window.matchMedia("(min-width: 80rem)");
    wide.addEventListener("change", showBookshelf);
    return () => wide.removeEventListener("change", showBookshelf);
  }, []);

  return (
    <div
      ref={sceneRef}
      role="region"
      aria-label="Tu habitación. En pantallas pequeñas, desliza a los lados para ver la bolsa y la mesa."
      // Con teclado se puede enfocar y pasar de panel con las flechas.
      tabIndex={0}
      // --side-gap: separación entre la estantería y la bolsa/mesa desde xl. 1rem hasta 1536 px y luego crece hasta 6rem.
      // -mt-2 pt-2: el recorte del scroll deja 8 px de aire arriba (en pantallas muy bajas la estantería mínima es más alta).
      className="relative -mt-2 flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto pt-2 overscroll-x-contain -outline-offset-4 [--side-gap:clamp(1rem,calc((100vw-96rem)/4+1rem),6rem)] [scrollbar-width:none] xl:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      <div
        className={`flex w-full shrink-0 snap-center snap-always items-end justify-center [container-type:size] xl:absolute xl:bottom-0 xl:right-full xl:mr-(--side-gap) xl:block xl:[container-type:normal] ${SIDE_WIDTH}`}
      >
        {/* Al pasar el mouse se comprime un poco desde la base (que está en el suelo) y se queda así mientras dure el hover. */}
        <PaperBag className="w-[min(16rem,80%,111cqh)] origin-bottom transition-transform duration-300 ease-out hover:scale-x-[1.04] hover:scale-y-[0.9] motion-reduce:transition-none xl:w-full" />
      </div>
      <div className="flex w-full shrink-0 snap-center snap-always flex-col">{children}</div>
      <div
        className={`flex w-full shrink-0 snap-center snap-always items-end justify-center [container-type:size] xl:absolute xl:bottom-0 xl:left-full xl:ml-(--side-gap) xl:block xl:[container-type:normal] ${SIDE_WIDTH}`}
      >
        <SideTable className="w-[min(18rem,85%,107cqh)] xl:w-full" />
      </div>
    </div>
  );
}
