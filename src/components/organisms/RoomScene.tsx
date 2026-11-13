"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { PaintingFrame, type FrameShape } from "@/components/atoms/PaintingFrame";
import { PaperBag } from "@/components/atoms/PaperBag";
import { SideTable } from "@/components/atoms/SideTable";

// Desde xl (variables definidas en la escena):
// --side-free: espacio libre al lado de la estantería, menos la separación y 1rem de margen con el borde de la pantalla.
// --side-col: ancho de la columna de la bolsa y la mesa, ese espacio con un máximo de 13rem.
const SIDE_WIDTH = "xl:w-(--side-col)";
const PANELS = ["la bolsa", "la estantería", "la mesa"] as const;
const BOOKSHELF = 1;
// Distancia mínima (px) del gesto para cambiar de panel; menos que esto es un toque o un temblor.
const SWIPE = 40;

// Dos cuadros colgados uno encima del otro, en el espacio libre sobre la bolsa o la mesa. Su SVG se escala sin
// deformarse (proporción fija), centrado en su caja. El cuadro "big" es más grande: recibe 3 partes del alto contra 1
// de su compañero y puede ser hasta un 90 % más ancho que la columna, sin pasar del panel (100cqw).
// Desde xl los cuadros se centran en todo el espacio libre de la pared (--side-free, alineado al lado de la estantería),
// así el grande crece hacia afuera. Del lado de la estantería dejan 10 px más que la separación normal (pr/pl-2.5).
function Paintings({ shapes, big, side }: { shapes: [FrameShape, FrameShape]; big: 0 | 1; side: "left" | "right" }) {
  return (
    // En paneles muy bajos (celular en horizontal) los cuadros serían diminutos: se ocultan y la bolsa o la mesa usan todo el alto.
    <div
      className={`flex min-h-0 w-full max-w-60 flex-1 flex-col items-center justify-center gap-4 py-4 xl:w-(--side-free) xl:max-w-none xl:gap-6 [@container(max-height:20rem)]:hidden ${side === "left" ? "xl:self-end xl:pr-2.5" : "xl:self-start xl:pl-2.5"}`}
    >
      {shapes.map((shape, i) => (
        <PaintingFrame
          key={shape}
          shape={shape}
          className={
            i === big
              ? "min-h-0 w-[min(190%,100cqw)] max-w-none flex-[3] xl:w-[min(calc(var(--side-col)*1.9),calc(var(--side-free)-0.625rem))]"
              : "min-h-0 w-full flex-1 xl:w-[min(var(--side-col),calc(var(--side-free)-0.625rem))]"
          }
        />
      ))}
    </div>
  );
}

// La habitación de la página de inicio: bolsa | estantería | mesa, con dos cuadros sobre la bolsa y dos sobre la mesa.
// - Desde xl hay espacio a los lados: la bolsa y la mesa van junto a la estantería, apoyadas en el borde de abajo,
//   y sus columnas ocupan todo el alto para colgar los cuadros encima.
// - Por debajo de xl es un carrusel como el de fotos: se ve un panel a la vez y un gesto (dedo o arrastre con el mouse)
//   pasa al siguiente de golpe. Con mouse también hay flechas a los lados, y con teclado, las flechas del teclado.
export function RoomScene({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState(BOOKSHELF);
  const dragStart = useRef<number | null>(null);

  const go = (next: number) => setIndex(Math.max(0, Math.min(PANELS.length - 1, next)));

  // Al bajar de xl vuelve a mostrar la estantería.
  useLayoutEffect(() => {
    const wide = window.matchMedia("(min-width: 80rem)");
    const reset = () => setIndex(BOOKSHELF);
    wide.addEventListener("change", reset);
    return () => wide.removeEventListener("change", reset);
  }, []);

  function onPointerDown(event: PointerEvent) {
    dragStart.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent) {
    if (dragStart.current === null) return;
    const distance = event.clientX - dragStart.current;
    dragStart.current = null;
    if (Math.abs(distance) >= SWIPE) go(index + (distance < 0 ? 1 : -1));
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft") go(index - 1);
    if (event.key === "ArrowRight") go(index + 1);
  }

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label="Tu habitación. En pantallas pequeñas, desliza o usa las flechas para ver la bolsa y la mesa."
      // Con teclado se puede enfocar y pasar de panel con las flechas.
      tabIndex={0}
      onKeyDown={onKeyDown}
      // --side-gap: separación entre la estantería y la bolsa/mesa desde xl. 1rem hasta 1536 px y luego crece hasta 6rem.
      // -mt-2 pt-2: el recorte deja 8 px de aire arriba (en pantallas muy bajas la estantería mínima es más alta).
      // Entre 1280 y 1460 px la estantería mide el 80 % (la tira se angosta): el 10 % que libera a cada lado (6.4rem de los
      // 64rem del contenido) se suma a --side-free para la bolsa, la mesa y los cuadros. Desde 1460 px vuelve al 100 %.
      className="relative -mt-2 flex min-h-0 flex-1 overflow-hidden pt-2 -outline-offset-4 [--side-gap:clamp(1rem,calc((100vw-96rem)/4+1rem),6rem)] [--side-free:calc((100vw-72rem)/2+3rem-var(--side-gap))] xl:[--side-free:calc((100vw-72rem)/2+9.4rem-var(--side-gap))] min-[91.25rem]:[--side-free:calc((100vw-72rem)/2+3rem-var(--side-gap))] [--side-col:min(13rem,var(--side-free))] xl:overflow-visible"
    >
      {/* Tira con los tres paneles. Se mueve un panel completo (más el espacio entre paneles, que evita que asome
          el borde del vecino). touch-pan-y: el gesto horizontal lo manejan los eventos, no el navegador. */}
      <div
        style={{ "--slide": index } as CSSProperties}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragStart.current = null)}
        onDragStart={(event) => event.preventDefault()}
        className="relative flex min-h-0 w-full flex-1 touch-pan-y xl:mx-auto xl:max-w-[80%] min-[91.25rem]:max-w-none gap-8 select-none transition-transform duration-300 ease-out translate-x-[calc(var(--slide)*-1*(100%+2rem))] motion-reduce:transition-none xl:translate-x-0 xl:gap-0 xl:transition-none"
      >
        <div
          aria-hidden={index !== 0}
          className={`flex w-full shrink-0 flex-col items-center justify-end [container-type:size] xl:absolute xl:inset-y-0 xl:right-full xl:mr-(--side-gap) ${SIDE_WIDTH}`}
        >
          <Paintings shapes={["oval", "portrait"]} big={1} side="left" />
          {/* Al pasar el mouse se comprime un poco desde la base (que está en el suelo) y se queda así mientras dure el hover.
              Por debajo de xl ocupa a lo sumo la mitad del alto del panel (cqh), para dejar lugar a los cuadros. */}
          <PaperBag className="w-[min(16rem,80%,50cqh)] shrink-0 [@container(max-height:20rem)]:w-[min(16rem,80%,111cqh)] xl:[@container(max-height:20rem)]:w-full origin-bottom transition-transform duration-300 ease-out hover:scale-x-[1.04] hover:scale-y-[0.9] motion-reduce:transition-none xl:w-full" />
        </div>
        {/* Con mouse, margen a los lados para que las flechas (44 px) no tapen los postes ni los libros. */}
        <div className="flex w-full shrink-0 flex-col pointer-fine:px-12 xl:pointer-fine:px-0">{children}</div>
        <div
          aria-hidden={index !== 2}
          className={`flex w-full shrink-0 flex-col items-center justify-end [container-type:size] xl:absolute xl:inset-y-0 xl:left-full xl:ml-(--side-gap) ${SIDE_WIDTH}`}
        >
          <Paintings shapes={["round", "landscape"]} big={0} side="right" />
          <SideTable className="w-[min(18rem,85%,48cqh)] shrink-0 xl:w-full [@container(max-height:20rem)]:w-[min(18rem,85%,107cqh)] xl:[@container(max-height:20rem)]:w-full" />
        </div>
      </div>

      {/* Flechas solo con mouse (pointer-fine) y por debajo de xl: en pantallas táctiles se desliza con el dedo. */}
      {index > 0 && (
        <button
          type="button"
          aria-label={`Ver ${PANELS[index - 1]}`}
          onClick={() => go(index - 1)}
          className="absolute left-0 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-foreground/10 transition hover:bg-surface pointer-fine:flex xl:pointer-fine:hidden"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
      )}
      {index < PANELS.length - 1 && (
        <button
          type="button"
          aria-label={`Ver ${PANELS[index + 1]}`}
          onClick={() => go(index + 1)}
          className="absolute right-0 top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-foreground/10 transition hover:bg-surface pointer-fine:flex xl:pointer-fine:hidden"
        >
          <ChevronRight aria-hidden="true" className="size-6" />
        </button>
      )}
    </div>
  );
}
