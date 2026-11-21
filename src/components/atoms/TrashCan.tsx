import type { Ref } from "react";

const LINE = "#333333";

// Bote de basura gris, sin tapa, con tres ranuras verticales y su sombra en el suelo. Decorativo: lo describe quien lo usa.
export function TrashCan({ className = "", ref }: { className?: string; ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} aria-hidden="true" className={className}>
      <svg viewBox="0 0 100 120" className="block w-full overflow-visible" strokeLinejoin="round">
        <ellipse cx={50} cy={114} rx={40} ry={5} fill="rgb(0 0 0 / 0.18)" />
        {/* Cuerpo, más angosto abajo, con una franja de luz a la izquierda. */}
        <path d="M13 30L22 107Q23 112 28 112H72Q77 112 78 107L87 30Z" fill="#8c8c8c" stroke={LINE} strokeWidth={3} />
        <path d="M18 34L25 104Q26 107 29 107H33L26 34Z" fill="#a8a8a8" />
        {/* Ranuras, abiertas hacia los lados como el cuerpo. */}
        <rect x={29} y={44} width={8} height={52} rx={4} fill="#a3a3a3" stroke={LINE} strokeWidth={2.5} transform="rotate(-4 33 70)" />
        <rect x={46} y={44} width={8} height={54} rx={4} fill="#a3a3a3" stroke={LINE} strokeWidth={2.5} />
        <rect x={63} y={44} width={8} height={52} rx={4} fill="#a3a3a3" stroke={LINE} strokeWidth={2.5} transform="rotate(4 67 70)" />
        {/* Borde de la boca y el interior oscuro. */}
        <ellipse cx={50} cy={30} rx={39} ry={10} fill="#7d7d7d" stroke={LINE} strokeWidth={3} />
        <ellipse cx={50} cy={29} rx={32} ry={6.5} fill="#3f3f3f" />
      </svg>
    </div>
  );
}
