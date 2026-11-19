import type { ComponentProps } from "react";
import { Bookmark } from "@/components/atoms/Bookmark";
import { BOOK_FONTS } from "@/lib/book-fonts";
import { bookmarkColor, type BookCategory } from "@/lib/books";

// Grosor y alto de cada categoría: cuanto más largo el libro, más grueso; el corto además es más bajo.
// Caben en el hueco de cada piso de la estantería (9.25rem) con aire arriba. La letra del título crece con el grosor.
const SIZE: Record<BookCategory, string> = {
  extra_large: "h-32 w-14 text-base",
  large: "h-32 w-10 text-sm",
  medium: "h-32 w-7 text-xs",
  small: "h-24 w-6 text-[0.7rem]",
};

type BookSpineProps = ComponentProps<"div"> & {
  title: string;
  category: BookCategory;
  coverColor: string;
  // Color del título y de las líneas del lomo.
  fontColor: string;
  titleFont: string;
  // Estado de lectura: da el color del separador que cuelga debajo del lomo.
  status: string;
};

// Lomo de un libro parado en la estantería: la pasta de su color, dos líneas arriba y dos abajo, y el título
// en vertical (se lee de abajo hacia arriba), con el color y la fuente que eligió el usuario. Abajo asoma el separador.
export function BookSpine({ title, category, coverColor, fontColor, titleFont, status, className = "", style, ...props }: BookSpineProps) {
  const family = BOOK_FONTS.find((font) => font.value === titleFont)?.family;
  return (
    <div
      className={`relative flex shrink-0 justify-center rounded-md border-2 py-6 shadow-[inset_-0.25rem_0_0.4rem_rgb(0_0_0/0.25),inset_0.2rem_0_0.25rem_rgb(255_255_255/0.15)] ${SIZE[category]} ${className}`}
      style={{ background: coverColor, borderColor: `color-mix(in oklab, ${coverColor} 65%, black)`, color: fontColor, ...style }}
      {...props}
    >
      <span aria-hidden="true" className="absolute inset-x-0 top-2 h-2.5 border-y-2 border-current" />
      <span aria-hidden="true" className="absolute inset-x-0 bottom-2 h-2.5 border-y-2 border-current" />
      {/* py-[3px]: en vertical el ancho es el alto de línea y el padding de "bloque" es el horizontal; el aire evita recortar descendentes y adornos. */}
      {/* text-center: el título va centrado a lo alto del lomo también fuera de un botón (los botones lo centran solos). */}
      <span className="rotate-180 truncate py-[3px] text-center leading-none [writing-mode:vertical-rl]" style={{ fontFamily: family }}>
        {title}
      </span>
      <Bookmark color={bookmarkColor(status)} className="absolute left-1/2 top-full h-3.5 w-2.5 -translate-x-1/2" />
    </div>
  );
}
