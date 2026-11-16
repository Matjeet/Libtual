"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { BookColors } from "@/components/atoms/BookParts";

// Bolsa de papel kraft con "Libtual", dibujada solo de la mitad hacia arriba: abajo queda cortada
// para que parezca apoyada en el suelo, fuera de la pantalla. Es el botón para agregar un libro:
// al hacer clic, el libro sale de la bolsa y se entrega con onTakeBook para seguir la animación fuera de ella.

// Libro con el estilo de la referencia: tapa plana, bandas en el lomo y el canto de las hojas color crema.
// Cada vez que se pasa el mouse sobre la bolsa sale un libro de otro color, en este orden.
const BOOKS: readonly BookColors[] = [
  { cover: "#2f7a96", spine: "#1d5468", band: "#f2b632", line: "#174556" },
  { cover: "#e9792f", spine: "#b85a1c", band: "#f7c948", line: "#8a4214" },
  { cover: "#7a8b1f", spine: "#5a6716", band: "#4a3b2a", line: "#3f4810" },
  { cover: "#f2b632", spine: "#c98f16", band: "#5a3e2b", line: "#8f6510" },
  { cover: "#a23b4c", spine: "#7a2635", band: "#f2b632", line: "#5c1c28" },
];
const PAGES = "#fbe3cf";
const KRAFT = { front: "#c9a878", hem: "#d8bb8c", side: "#a8865a", crease: "#94744b", inside: "#6b4f30", back: "#584027", handle: "#b8955f", line: "#7d5f3a", ink: "#3a2414" };

// Libro que salió de la bolsa: su centro y tamaño en pantalla (px) y sus colores.
export type TakenBook = { x: number; y: number; width: number; height: number; colors: BookColors };

type PaperBagProps = {
  className?: string;
  // El libro está fuera (en la animación de crear un libro): no se ve dentro de la bolsa.
  taken?: boolean;
  onTakeBook?: (book: TakenBook) => void;
};

export function PaperBag({ className = "", taken = false, onTakeBook }: PaperBagProps) {
  // Cambia al entrar el mouse, mientras el libro todavía está escondido dentro de la bolsa.
  const [index, setIndex] = useState(0);
  // El libro sube hasta salir de la bolsa; al terminar se entrega.
  const [rising, setRising] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const bookRef = useRef<SVGGElement>(null);
  const coverRef = useRef<SVGRectElement>(null);
  const book = BOOKS[index];

  const handOver = useEffectEvent(() => {
    const svg = svgRef.current!.getBoundingClientRect();
    const cover = coverRef.current!.getBoundingClientRect();
    setRising(false);
    // El libro mide 58 × 100 en el viewBox de 200 × 180 (la bolsa puede estar comprimida por el hover).
    onTakeBook?.({
      x: cover.left + cover.width / 2,
      y: cover.top + cover.height / 2,
      width: (58 * svg.width) / 200,
      height: (100 * svg.height) / 180,
      colors: book,
    });
  });

  // Espera a que termine la subida; sin transición (movimiento reducido, tests) entrega al instante.
  useEffect(() => {
    if (!rising) return;
    let active = true;
    Promise.all(bookRef.current!.getAnimations?.().map((animation) => animation.finished.catch(() => {})) ?? []).then(() => {
      if (active) handOver();
    });
    return () => {
      active = false;
    };
  }, [rising]);

  const bookPosition = taken
    ? "translate-y-[76px] opacity-0"
    : rising
      ? "-translate-y-[100px] transition-transform duration-[350ms] ease-in motion-reduce:transition-none"
      : "translate-y-[76px] transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 motion-reduce:transition-none";

  return (
    // group: el libro reacciona al hover y al foco de toda la bolsa. z-10: al salir, el libro pasa por delante de los cuadros.
    <button
      type="button"
      aria-label="Agregar un libro"
      onClick={() => !rising && !taken && setRising(true)}
      className={`group relative z-10 block rounded-lg ${className}`}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 200 180"
        aria-hidden="true"
        className="block w-full overflow-visible"
        strokeLinejoin="round"
        strokeLinecap="round"
        onPointerEnter={() => setIndex((current) => (current + 1) % BOOKS.length)}
      >
        {/* Boca de la bolsa: el interior oscuro y la pared de atrás. */}
        <path d="M10 72L50 54H190L150 72Z" fill={KRAFT.inside} stroke={KRAFT.line} strokeWidth={1.5} />
        <path d="M50 54H190L182 60H56Z" fill={KRAFT.back} />
        {/* Asa de atrás, que sale de la pared trasera. */}
        <path d="M88 56C88 10 150 10 150 56" fill="none" stroke={KRAFT.crease} strokeWidth={5} />
        {/* Un libro guardado entre la pared de atrás y la cara de adelante: escondido bajo el borde de la bolsa,
            al pasar el mouse sube y asoma su parte de abajo (el canto de las hojas); al hacer clic sale del todo. */}
        <g ref={bookRef} className={bookPosition}>
          <g transform="rotate(-8 80 70)">
            <rect ref={coverRef} x={50} y={20} width={58} height={100} rx={3} fill={book.cover} stroke={book.line} data-testid="book-cover" strokeWidth={1.5} />
            <rect x={50} y={20} width={11} height={100} rx={2} fill={book.spine} />
            <rect x={53} y={12} width={52} height={9} rx={2} fill={PAGES} stroke={book.line} strokeWidth={1.5} />
            <path d="M57 15.5H101M57 18H101" stroke={book.line} strokeWidth={0.75} opacity={0.35} />
            <path d="M61 31H108M61 37H108" stroke={book.band} strokeWidth={3} />
            <ellipse cx={84} cy={58} rx={13} ry={7} fill={book.spine} />
          </g>
        </g>
        {/* Cara de adelante, con el doblez del borde superior. */}
        <path d="M10 72H150V180H10Z" fill={KRAFT.front} stroke={KRAFT.line} strokeWidth={1.5} />
        <path d="M10 72H150V84H10Z" fill={KRAFT.hem} />
        <path d="M10 84H150" stroke={KRAFT.line} strokeWidth={1} opacity={0.5} />
        {/* Brillo suave del doblez junto al costado. */}
        <path d="M143 88V180" stroke={KRAFT.hem} strokeWidth={3} opacity={0.6} />
        {/* Costado, con su pliegue al medio. */}
        <path d="M150 72L190 54V180H150Z" fill={KRAFT.side} stroke={KRAFT.line} strokeWidth={1.5} />
        <path d="M170 63V180" stroke={KRAFT.crease} strokeWidth={1.5} />
        {/* Asa de adelante. */}
        <path d="M48 74C48 22 112 22 112 74" fill="none" stroke={KRAFT.handle} strokeWidth={5} />
        <path d="M48 74C48 22 112 22 112 74" fill="none" stroke={KRAFT.line} strokeWidth={1} opacity={0.4} />
        <text x={80} y={128} textAnchor="middle" fill={KRAFT.ink} className="font-sans text-[26px] font-bold tracking-tight">
          Libtual
        </text>
      </svg>
    </button>
  );
}
