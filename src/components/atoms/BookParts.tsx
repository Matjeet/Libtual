import { useId } from "react";

// Partes de un libro abierto visto desde arriba, como la referencia: tapa gruesa que asoma por los bordes,
// el bloque de hojas con sus cantos a los lados y abajo, y la hoja de arriba con sombra junto al lomo.
// Cada parte es media página (dibujada en 3:4, se estira a la forma de la página), con el lomo a la izquierda. Decorativas.

export type BookColors = { cover: string; spine: string; band: string; line: string };

const VIEW_BOX = "0 0 96 128";
const COVER = "M0 4H90Q95 4 95 9V123Q95 128 90 128H0Z";
const PAPER = { edge: "#efe3d0", lines: "#d8c8b0", border: "#cdbca3", spine: "#dccfbc", light: "#f6efe4", page: "#fdfaf5" };

// Tapa de adelante: la que se ve con el libro cerrado.
export function BookCover({ colors, className = "" }: { colors: BookColors; className?: string }) {
  return (
    <svg viewBox={VIEW_BOX} preserveAspectRatio="none" aria-hidden="true" className={className}>
      <path d={COVER} fill={colors.cover} stroke={colors.line} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M0 4H9V128H0Z" fill={colors.spine} />
      <path d="M9 22H94M9 30H94" stroke={colors.band} strokeWidth={3} />
      <ellipse cx={52} cy={70} rx={20} ry={11} fill={colors.spine} />
    </svg>
  );
}

// Una mitad del libro abierto: la tapa por debajo, el bloque de hojas y la hoja de arriba.
// mirrored: la mitad izquierda (lomo a la derecha).
export function BookPages({ colors, mirrored = false, className = "" }: { colors: BookColors; mirrored?: boolean; className?: string }) {
  const shade = `book-shade-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox={VIEW_BOX} preserveAspectRatio="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={shade} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={PAPER.spine} />
          <stop offset="0.14" stopColor={PAPER.light} />
          <stop offset="0.35" stopColor={PAPER.page} />
        </linearGradient>
      </defs>
      <g transform={mirrored ? "matrix(-1 0 0 1 96 0)" : undefined}>
        <path d={COVER} fill={colors.cover} stroke={colors.line} strokeWidth={1.5} strokeLinejoin="round" />
        {/* Grosor de la tapa, más oscuro, por debajo del libro. */}
        <path d="M0 124H95Q95 128 90 128H0Z" fill={colors.spine} />
        {/* Bloque de hojas, con los cantos de las hojas al costado y abajo. */}
        <path d="M0 6C22 1 60 1 92 3V121H0Z" fill={PAPER.edge} stroke={PAPER.border} strokeWidth={0.75} />
        <path d="M88 5V118.5M89.5 5V119.5M91 4V120.5M0 117.5H88M0 119H89.5M0 120.5H91" stroke={PAPER.lines} strokeWidth={0.5} fill="none" />
        {/* Hoja de arriba, más oscura junto al lomo. */}
        <path d="M0 6C22 1 60 1 87 3V116H0Z" fill={`url(#${shade})`} stroke={PAPER.border} strokeWidth={0.5} />
        <path d="M0 6V116" stroke={PAPER.border} strokeWidth={1} />
      </g>
    </svg>
  );
}
