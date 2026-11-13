// Mesa baja de madera, de un café más claro y rojizo que la estantería. Como la bolsa, se dibuja solo la parte
// de arriba: las patas siguen hacia abajo y quedan cortadas por el borde de la pantalla. Decorativa.
const WOOD = { top: "#a0673a", edge: "#6f4424", leg: "#8a5530", light: "#b98152", dark: "#5c371d" };
// Marco de foto sobre la mesa. shortcut: el avatar es un marcador (cabeza crema y torso azul) hasta diseñar el real.
const FRAME = { wood: "#5a3820", edge: "#3a2414", photo: "#e6eef0", head: "#f3e2bf", body: "#3b6fb6", line: "#2a1a0e" };

export function SideTable({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 -97 200 187" aria-hidden="true" className={className} strokeLinecap="round">
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
      {/* Marco de foto parado sobre la tabla (y = 10), con su soporte atrás a la derecha. */}
      <path d="M127 -50L156 10H146L119 -42Z" fill={FRAME.wood} stroke={FRAME.edge} strokeWidth={1.5} strokeLinejoin="round" />
      <ellipse cx={97} cy={11} rx={45} ry={3} fill={FRAME.line} opacity={0.25} />
      <rect x={57} y={-91} width={80} height={101} rx={4} fill={FRAME.wood} stroke={FRAME.edge} strokeWidth={1.5} />
      <svg x={66} y={-82} width={62} height={83} overflow="hidden">
        <rect width={62} height={83} fill={FRAME.photo} />
        <path d="M8 83C8 55 54 55 54 83Z" fill={FRAME.body} />
        <circle cx={31} cy={37} r={13} fill={FRAME.head} stroke={FRAME.line} strokeWidth={0.75} />
      </svg>
      <rect x={66} y={-82} width={62} height={83} fill="none" stroke={FRAME.edge} strokeWidth={1.5} />
    </svg>
  );
}
