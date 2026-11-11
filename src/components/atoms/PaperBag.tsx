"use client";

import { useState } from "react";

// Bolsa de papel kraft con "Libtual", dibujada solo de la mitad hacia arriba: abajo queda cortada
// para que parezca apoyada en el suelo, fuera de la pantalla. Decorativa.

// Libro con el estilo de la referencia: tapa plana, bandas en el lomo y el canto de las hojas color crema.
// Cada vez que se pasa el mouse sobre la bolsa sale un libro de otro color, en este orden.
const BOOKS = [
  { cover: "#2f7a96", spine: "#1d5468", band: "#f2b632", line: "#174556" },
  { cover: "#e9792f", spine: "#b85a1c", band: "#f7c948", line: "#8a4214" },
  { cover: "#7a8b1f", spine: "#5a6716", band: "#4a3b2a", line: "#3f4810" },
  { cover: "#f2b632", spine: "#c98f16", band: "#5a3e2b", line: "#8f6510" },
  { cover: "#a23b4c", spine: "#7a2635", band: "#f2b632", line: "#5c1c28" },
] as const;
const PAGES = "#fbe3cf";
const KRAFT = { front: "#c9a878", hem: "#d8bb8c", side: "#a8865a", crease: "#94744b", inside: "#6b4f30", back: "#584027", handle: "#b8955f", line: "#7d5f3a", ink: "#3a2414" };

export function PaperBag({ className = "" }: { className?: string }) {
  // Cambia al entrar el mouse, mientras el libro todavía está escondido dentro de la bolsa.
  const [index, setIndex] = useState(0);
  const book = BOOKS[index];

  return (
    // group: el libro reacciona al hover de toda la bolsa.
    <svg
      viewBox="0 0 200 180"
      aria-hidden="true"
      className={`group ${className}`}
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
          al pasar el mouse sube y asoma su parte de abajo (el canto de las hojas). */}
      <g className="translate-y-[76px] transition-transform duration-300 ease-out group-hover:translate-y-0 motion-reduce:transition-none">
        <g transform="rotate(-8 80 70)">
          <rect x={50} y={20} width={58} height={100} rx={3} fill={book.cover} stroke={book.line} data-testid="book-cover" strokeWidth={1.5} />
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
  );
}
