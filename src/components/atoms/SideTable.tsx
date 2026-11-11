// Mesa baja de madera, de un café más claro y rojizo que la estantería. Como la bolsa, se dibuja solo la parte
// de arriba: las patas siguen hacia abajo y quedan cortadas por el borde de la pantalla. Decorativa.
const WOOD = { top: "#a0673a", edge: "#6f4424", leg: "#8a5530", light: "#b98152", dark: "#5c371d" };

export function SideTable({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 90" aria-hidden="true" className={className} strokeLinecap="round">
      {/* Patas: llegan hasta abajo del dibujo para que parezcan seguir fuera de la pantalla. */}
      <rect x={22} y={30} width={28} height={70} rx={6} fill={WOOD.leg} stroke={WOOD.edge} strokeWidth={1.5} />
      <rect x={150} y={30} width={28} height={70} rx={6} fill={WOOD.leg} stroke={WOOD.edge} strokeWidth={1.5} />
      {/* Sombra de la tabla sobre las patas. */}
      <path d="M23 41H49M151 41H177" stroke={WOOD.dark} strokeWidth={6} opacity={0.35} />
      {/* Tabla, con el canto de abajo más oscuro y vetas finas a lo largo. */}
      <rect x={4} y={10} width={192} height={28} rx={7} fill={WOOD.top} stroke={WOOD.edge} strokeWidth={1.5} />
      <path d="M10 33H190" stroke={WOOD.edge} strokeWidth={4} opacity={0.6} />
      <path d="M14 17H90M104 17H186M20 23H140M60 28H178" stroke={WOOD.light} strokeWidth={1} opacity={0.6} />
      <path d="M30 20H120M132 25H184M16 26H52" stroke={WOOD.dark} strokeWidth={1} opacity={0.35} />
    </svg>
  );
}
