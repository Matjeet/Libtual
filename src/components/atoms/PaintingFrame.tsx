import { cloneElement, useId, type CSSProperties, type ReactElement, type SVGProps } from "react";

// Marcos de cuadro colgados en la pared, con detalles como los marcos tallados: borde de perlas, banda tallada
// y biseles. Cada forma tiene su proporción fija (viewBox): el SVG se escala entero y nunca se deforma en una sola
// dimensión, porque contienen imágenes. Sin imagen, el área muestra un lienzo vacío.
export type FrameShape = "oval" | "portrait" | "round" | "landscape";

const GOLD = { base: "#c8962e", light: "#ecc764", dark: "#8a6418", deep: "#5e420e" };
const WOOD = { base: "#5a3a22", light: "#8a5a32", dark: "#3b2414", deep: "#24150b", bronze: "#c79a4a" };
const CANVAS = "#efe6d2";

// Área de la imagen de cada marco: su forma y la caja que la contiene (x, y, ancho, alto en el viewBox).
// La resolución máxima de cada imagen sale de estas áreas: ver docs/cuadros.md.
const CANVAS_AREA: Record<FrameShape, { shape: ReactElement<SVGProps<SVGElement>>; box: [number, number, number, number] }> = {
  oval: { shape: <ellipse cx={60} cy={75} rx={38.5} ry={53.5} />, box: [21.5, 21.5, 77, 107] },
  portrait: { shape: <rect x={22} y={22} width={76} height={116} />, box: [22, 22, 76, 116] },
  round: { shape: <circle cx={65} cy={65} r={39} />, box: [26, 26, 78, 78] },
  landscape: { shape: <rect x={25} y={25} width={110} height={70} />, box: [25, 25, 110, 70] },
};

// Lienzo del marco: fondo, la imagen recortada a la forma del área (llena sin deformarse: slice) y el borde encima.
function Canvas({ shape, imageUrl, edge }: { shape: FrameShape; imageUrl?: string; edge: string }) {
  // El id de useId puede traer caracteres que no sirven dentro de url(#…).
  const clipId = `canvas-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { shape: area, box } = CANVAS_AREA[shape];
  const [x, y, width, height] = box;

  return (
    <>
      {cloneElement(area, { fill: CANVAS })}
      {imageUrl && (
        <>
          <clipPath id={clipId}>{area}</clipPath>
          <image href={imageUrl} x={x} y={y} width={width} height={height} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
        </>
      )}
      {cloneElement(area, { fill: "none", stroke: edge, strokeWidth: 0.8 })}
    </>
  );
}

// Perlas: un trazo punteado de puntos redondos sobre el borde.
const beads = { fill: "none", strokeWidth: 1.6, strokeDasharray: "0 3.4", strokeLinecap: "round" } as const;

type PaintingFrameProps = { shape: FrameShape; imageUrl?: string; className?: string; style?: CSSProperties };

export function PaintingFrame({ shape, imageUrl, className = "", style }: PaintingFrameProps) {
  const common = { "aria-hidden": true, className, style, "data-shape": shape } as const;

  if (shape === "oval") {
    // Óvalo liso: sin borde ondulado ni relieve, solo biseles suaves.
    return (
      <svg viewBox="0 0 120 150" {...common}>
        <ellipse cx={60} cy={75} rx={57} ry={72} fill={GOLD.base} stroke={GOLD.deep} strokeWidth={1.2} />
        <ellipse cx={60} cy={75} rx={53} ry={68} fill="none" stroke={GOLD.light} strokeWidth={2} />
        <ellipse cx={60} cy={75} rx={47} ry={62} fill="none" stroke={GOLD.dark} strokeWidth={5} />
        <ellipse cx={60} cy={75} rx={42} ry={57} fill={GOLD.light} stroke={GOLD.deep} strokeWidth={0.8} />
        <Canvas shape="oval" imageUrl={imageUrl} edge={GOLD.deep} />
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
        <Canvas shape="round" imageUrl={imageUrl} edge={GOLD.deep} />
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
        <Canvas shape="landscape" imageUrl={imageUrl} edge={WOOD.deep} />
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
      <Canvas shape="portrait" imageUrl={imageUrl} edge={GOLD.deep} />
    </svg>
  );
}
