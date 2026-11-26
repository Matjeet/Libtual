// Separador de tela que cuelga del libro, con la punta en V. Su color dice el estado de lectura. Decorativo.
export function Bookmark({ color, className = "" }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 10 14" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <path
        d="M0 0H10V14L5 10.5L0 14Z"
        fill={color}
        stroke={`color-mix(in oklab, ${color} 70%, black)`}
        strokeWidth={0.75}
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
