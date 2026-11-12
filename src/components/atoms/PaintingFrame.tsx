// Marcos de cuadro colgados en la pared, con detalles como los marcos tallados: borde de perlas, banda tallada
// y biseles. Cada forma tiene su proporción fija (viewBox): el SVG se escala entero y nunca se deforma en una sola
// dimensión, porque más adelante estos marcos contendrán imágenes. El área de la imagen por ahora es un lienzo vacío.
export type FrameShape = "oval" | "portrait" | "round" | "landscape";

const GOLD = { base: "#c8962e", light: "#ecc764", dark: "#8a6418", deep: "#5e420e" };
const WOOD = { base: "#5a3a22", light: "#8a5a32", dark: "#3b2414", deep: "#24150b", bronze: "#c79a4a" };
const CANVAS = "#efe6d2";

// Perlas: un trazo punteado de puntos redondos sobre el borde.
const beads = { fill: "none", strokeWidth: 1.6, strokeDasharray: "0 3.4", strokeLinecap: "round" } as const;

export function PaintingFrame({ shape, className = "" }: { shape: FrameShape; className?: string }) {
  const common = { "aria-hidden": true, className, "data-shape": shape } as const;

  if (shape === "oval") {
    return (
      <svg viewBox="0 0 120 150" {...common}>
        {/* Borde ondulado: círculos gruesos alrededor del óvalo. */}
        <ellipse cx={60} cy={75} rx={56} ry={71} fill="none" stroke={GOLD.base} strokeWidth={6} strokeDasharray="0 7" strokeLinecap="round" />
        <ellipse cx={60} cy={75} rx={54} ry={69} fill={GOLD.base} stroke={GOLD.deep} strokeWidth={1} />
        <ellipse cx={60} cy={75} rx={49} ry={64} stroke={GOLD.light} {...beads} />
        {/* Banda tallada: relieve con trazos claros sobre una banda oscura. */}
        <ellipse cx={60} cy={75} rx={44} ry={59} fill="none" stroke={GOLD.dark} strokeWidth={6} />
        <ellipse cx={60} cy={75} rx={44} ry={59} fill="none" stroke={GOLD.light} strokeWidth={6} strokeDasharray="2.5 3.5" opacity={0.55} />
        <ellipse cx={60} cy={75} rx={39} ry={54} fill={GOLD.light} stroke={GOLD.deep} strokeWidth={0.8} />
        <ellipse cx={60} cy={75} rx={36} ry={51} fill={CANVAS} stroke={GOLD.deep} strokeWidth={0.8} />
      </svg>
    );
  }

  if (shape === "round") {
    return (
      <svg viewBox="0 0 130 130" {...common}>
        <circle cx={65} cy={65} r={62} fill={GOLD.base} stroke={GOLD.deep} strokeWidth={1.2} />
        <circle cx={65} cy={65} r={57} stroke={GOLD.light} {...beads} />
        {/* Corona de laurel: hojas sugeridas con trazos cortos claros y oscuros alternados. */}
        <circle cx={65} cy={65} r={49} fill="none" stroke={GOLD.dark} strokeWidth={9} />
        <circle cx={65} cy={65} r={49} fill="none" stroke={GOLD.light} strokeWidth={8} strokeDasharray="5 2.5" opacity={0.6} />
        <circle cx={65} cy={65} r={49} fill="none" stroke={GOLD.deep} strokeWidth={1} strokeDasharray="1.2 6.3" />
        <circle cx={65} cy={65} r={42} fill={GOLD.light} stroke={GOLD.deep} strokeWidth={0.8} />
        <circle cx={65} cy={65} r={39} fill={CANVAS} stroke={GOLD.deep} strokeWidth={0.8} />
      </svg>
    );
  }

  if (shape === "landscape") {
    // Madera oscura tallada con perlas y filetes de bronce.
    return (
      <svg viewBox="0 0 160 120" {...common}>
        <rect x={2} y={2} width={156} height={116} rx={1.5} fill={WOOD.base} stroke={WOOD.deep} strokeWidth={1.5} />
        <rect x={6} y={6} width={148} height={108} stroke={WOOD.bronze} {...beads} />
        <rect x={14} y={14} width={132} height={92} fill="none" stroke={WOOD.dark} strokeWidth={8} />
        <rect x={14} y={14} width={132} height={92} fill="none" stroke={WOOD.light} strokeWidth={7} strokeDasharray="4 3" opacity={0.6} />
        <rect x={20} y={20} width={120} height={80} fill={WOOD.bronze} stroke={WOOD.deep} strokeWidth={0.8} />
        <rect x={23} y={23} width={114} height={74} fill={WOOD.dark} />
        <rect x={25} y={25} width={110} height={70} fill={CANVAS} stroke={WOOD.deep} strokeWidth={0.8} />
      </svg>
    );
  }

  // portrait: rectángulo vertical dorado.
  return (
    <svg viewBox="0 0 120 160" {...common}>
      <rect x={2} y={2} width={116} height={156} rx={1.5} fill={GOLD.base} stroke={GOLD.deep} strokeWidth={1.5} />
      <rect x={6} y={6} width={108} height={148} stroke={GOLD.light} {...beads} />
      <rect x={13} y={13} width={94} height={134} fill="none" stroke={GOLD.dark} strokeWidth={7} />
      <rect x={13} y={13} width={94} height={134} fill="none" stroke={GOLD.light} strokeWidth={7} strokeDasharray="2.5 3.5" opacity={0.55} />
      <rect x={18} y={18} width={84} height={124} fill={GOLD.light} stroke={GOLD.deep} strokeWidth={0.8} />
      <rect x={22} y={22} width={76} height={116} fill={CANVAS} stroke={GOLD.deep} strokeWidth={0.8} />
    </svg>
  );
}
