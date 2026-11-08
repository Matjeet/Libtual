import { Dancing_Script } from "next/font/google";

const script = Dancing_Script({ subsets: ["latin"], weight: "700" });

// Colores fijos: el libro se ve igual (páginas blancas, tinta oscura) en modo claro y oscuro.
const PAPER = "#ffffff";
const PAGE_EDGES = "#ede5d3";
const INK = "#31333b";

// Páginas con bordes curvos (viewBox 192 × 112, lomo en x = 96): el borde superior sube hacia los costados y el
// inferior baja hacia el lomo.
const LEFT_PAGE = "M96 22C70 6 32 6 12 15V92C40 87 74 91 96 101Z";
const RIGHT_PAGE = "M96 22C122 6 160 6 180 15V92C152 87 118 91 96 101Z";

// Libro abierto decorativo que dice "Lib" | "Tual" en letra cursiva. Cada 10 s una hoja gira desde el lomo (de derecha a
// izquierda); el texto queda por encima de la hoja, así que siempre se lee igual.
export function OpenBook({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-28 w-48 [perspective:800px] ${className}`}>
      <svg viewBox="0 0 192 112" className="absolute inset-0 size-full overflow-visible">
        {/* Tapa (toma el color de acento de la paleta). */}
        <path d="M5 19V97C40 92 74 97 96 109C118 97 152 92 187 97V19Z" className="fill-accent" />
        {/* Grosor de las hojas: las mismas páginas desplazadas hacia abajo. */}
        <g transform="translate(0 4)" fill={PAGE_EDGES} stroke={INK} strokeOpacity={0.35} strokeWidth={1}>
          <path d={LEFT_PAGE} />
          <path d={RIGHT_PAGE} />
        </g>
        <g fill={PAPER} stroke={INK} strokeOpacity={0.6} strokeWidth={1.2} strokeLinejoin="round">
          <path d={LEFT_PAGE} />
          <path d={RIGHT_PAGE} />
        </g>
      </svg>

      {/* Hoja que gira: misma forma que la página derecha, con el eje en el lomo. */}
      <div
        data-testid="page"
        className="absolute inset-y-0 left-1/2 w-1/2 origin-left opacity-0 animate-[page-turn_10s_ease-in-out_infinite] motion-reduce:animate-none"
      >
        <svg viewBox="96 0 96 112" className="size-full overflow-visible">
          <path d={RIGHT_PAGE} fill={PAPER} stroke={INK} strokeOpacity={0.6} strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
      </div>

      <span className={`${script.className} absolute left-[29%] top-[48%] -translate-x-1/2 -translate-y-1/2 text-3xl`} style={{ color: INK }}>
        Lib
      </span>
      <span className={`${script.className} absolute left-[71%] top-[48%] -translate-x-1/2 -translate-y-1/2 text-3xl`} style={{ color: INK }}>
        Tual
      </span>
    </div>
  );
}
