"use client";

import { Check, ChevronDown } from "lucide-react";
import { Cabin_Sketch, Schoolbell } from "next/font/google";
import type { CSSProperties, KeyboardEvent } from "react";
import { SHELF_SORTS, type ShelfSort } from "@/lib/books";

const cabinSketch = Cabin_Sketch({ weight: "700", subsets: ["latin"], display: "swap" });
const schoolbell = Schoolbell({ weight: "400", subsets: ["latin"], display: "swap" });

// Tiza: blanco hueso con un halo de polvo alrededor del trazo.
const CHALK = "text-[#f3efe4] [text-shadow:0_0_1px_rgb(255_255_255/0.7),0_0_6px_rgb(255_255_255/0.18)]";
// Borde irregular del trazo de tiza (ver el filtro SVG de abajo).
const ROUGH = "[filter:url(#chalk-rough)]";

type ShelfChalkboardProps = {
  sort: ShelfSort;
  onSortChange: (sort: ShelfSort) => void;
  // null = todos los géneros.
  genre: string | null;
  onGenreChange: (genre: string | null) => void;
  // Géneros de los libros del usuario.
  genres: string[];
  className?: string;
  style?: CSSProperties;
  // Detrás de la bolsa no se usa.
  inert?: boolean;
};

// Pizarra colgada en la pared con el orden de la estantería (uno a la vez, por defecto Personalizado) y el filtro por género.
// Todo se ve escrito con tiza; cada orden es un cuadro dibujado que lleva un check al elegirlo.
// Si se le da un alto menor que su contenido (detrás de la bolsa), la pizarra se desplaza por dentro.
export function ShelfChalkboard({ sort, onSortChange, genre, onGenreChange, genres, className = "", style, inert }: ShelfChalkboardProps) {
  // Las flechas cambian la opción elegida: no deben pasar de panel en el carrusel de la habitación.
  const keepArrows = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.stopPropagation();
  };
  return (
    // Marco de madera y, dentro, la pizarra con manchas de borrador más claras.
    <div
      onKeyDown={keepArrows}
      inert={inert}
      style={style}
      className={`wood-grain-x flex flex-col rounded-md p-1.5 shadow-[0_8px_14px_-6px_rgb(0_0_0/0.45)] ${className}`}
    >
      <svg aria-hidden="true" className="absolute size-0">
        <filter id="chalk-rough">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.6" />
        </filter>
      </svg>
      <div
        // relative: los radios sr-only (absolute) quedan dentro del scroll de la pizarra y no alargan la página.
        className={`relative flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-sm bg-[#25312b] [scrollbar-color:rgb(243_239_228/0.45)_transparent] [scrollbar-width:thin] bg-[radial-gradient(ellipse_at_25%_15%,rgb(255_255_255/0.09),transparent_55%),radial-gradient(ellipse_at_85%_85%,rgb(255_255_255/0.06),transparent_50%)] px-3 py-2.5 shadow-[inset_0_0_16px_rgb(0_0_0/0.55)] ${CHALK} ${schoolbell.className}`}
      >
        <fieldset>
          <legend className={`mb-1 -rotate-2 text-2xl leading-tight ${ROUGH} ${cabinSketch.className}`}>Ordenado por</legend>
          {SHELF_SORTS.map(({ value, label }) => (
            <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-lg leading-tight pointer-fine:min-h-8">
              <input
                type="radio"
                name="shelf-sort"
                value={value}
                checked={sort === value}
                onChange={() => onSortChange(value)}
                className="peer sr-only"
              />
              {/* El cuadro dibujado con tiza; el check aparece al elegirlo. */}
              <span
                aria-hidden="true"
                className={`grid size-5 shrink-0 place-items-center rounded-[3px] border-2 border-current peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-current peer-checked:[&>svg]:opacity-100 ${ROUGH}`}
              >
                <Check strokeWidth={4} className="size-5 -translate-y-0.5 translate-x-0.5 opacity-0" />
              </span>
              <span className={ROUGH}>{label}</span>
            </label>
          ))}
        </fieldset>
        <label className="flex flex-col gap-1">
          <span className={`-rotate-1 text-xl leading-tight ${ROUGH} ${cabinSketch.className}`}>Filtrar por género</span>
          <span className="relative">
            {/* text-base: 16 px, para que iOS no haga zoom al enfocarlo. color-scheme: la lista que despliega el navegador
                también se ve oscura. */}
            <select
              value={genre ?? ""}
              onChange={(event) => onGenreChange(event.target.value || null)}
              className={`min-h-11 w-full cursor-pointer appearance-none rounded-md border-2 border-dashed border-current/70 bg-transparent py-1 pl-2 pr-8 text-base [color-scheme:dark] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current pointer-fine:min-h-9 ${schoolbell.className}`}
            >
              <option value="">Todos los géneros</option>
              {genres.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-5 -translate-y-1/2" />
          </span>
        </label>
      </div>
    </div>
  );
}
