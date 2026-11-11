// Bolsa de papel kraft con "Libtual", dibujada solo de la mitad hacia arriba: abajo queda cortada
// para que parezca apoyada en el suelo, fuera de la pantalla. Decorativa.
// Libro con el estilo de la referencia: tapa plana, bandas en el lomo y el canto de las hojas color crema.
const BOOK = { cover: "#2f7a96", spine: "#1d5468", band: "#f2b632", pages: "#fbe3cf", line: "#174556" };
const KRAFT = { front: "#c9a878", hem: "#d8bb8c", side: "#a8865a", crease: "#94744b", inside: "#6b4f30", back: "#584027", handle: "#b8955f", line: "#7d5f3a", ink: "#3a2414" };

export function PaperBag({ className = "" }: { className?: string }) {
  return (
    // group: el libro reacciona al hover de toda la bolsa.
    <svg viewBox="0 0 200 180" aria-hidden="true" className={`group ${className}`} strokeLinejoin="round" strokeLinecap="round">
      {/* Boca de la bolsa: el interior oscuro y la pared de atrás. */}
      <path d="M10 72L50 54H190L150 72Z" fill={KRAFT.inside} stroke={KRAFT.line} strokeWidth={1.5} />
      <path d="M50 54H190L182 60H56Z" fill={KRAFT.back} />
      {/* Asa de atrás, que sale de la pared trasera. */}
      <path d="M88 56C88 10 150 10 150 56" fill="none" stroke={KRAFT.crease} strokeWidth={5} />
      {/* Un libro guardado entre la pared de atrás y la cara de adelante: escondido bajo el borde de la bolsa,
          al pasar el mouse sube y asoma su parte de abajo (el canto de las hojas). */}
      <g className="translate-y-[76px] transition-transform duration-300 ease-out group-hover:translate-y-0 motion-reduce:transition-none">
        <g transform="rotate(-8 80 70)">
          <rect x={50} y={20} width={58} height={100} rx={3} fill={BOOK.cover} stroke={BOOK.line} strokeWidth={1.5} />
          <rect x={50} y={20} width={11} height={100} rx={2} fill={BOOK.spine} />
          <rect x={53} y={12} width={52} height={9} rx={2} fill={BOOK.pages} stroke={BOOK.line} strokeWidth={1.5} />
          <path d="M57 15.5H101M57 18H101" stroke={BOOK.line} strokeWidth={0.75} opacity={0.35} />
          <path d="M61 31H108M61 37H108" stroke={BOOK.band} strokeWidth={3} />
          <ellipse cx={84} cy={58} rx={13} ry={7} fill={BOOK.spine} />
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
