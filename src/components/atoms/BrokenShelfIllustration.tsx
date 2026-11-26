// La estantería del logo (LogoMark) derrumbada: los pisos caídos y los 1 y 0 tirados dentro y en el suelo.
// Mismos trazos que el logo: marco y pisos de 2, dígitos de 3 × 18 con trazo de 1.

// Cada dígito se dibuja con el origen en el centro de su base: rotar alrededor de (0, 0) es girarlo sobre la base.
// Acostado (±90°) se corre 1 unidad para que apoye en la superficie en vez de quedar atravesado.
type Placed = { bit: "0" | "1"; x: number; y: number; angle?: number; lying?: 1 | -1 };

const DIGITS: Placed[] = [
  // Arriba: dos parados contra la pared, uno inclinándose y dos que resbalaron acostados por la pendiente.
  { bit: "0", x: 59, y: 24.2 },
  { bit: "1", x: 55, y: 25.6, angle: -8 },
  { bit: "0", x: 51, y: 26.9, angle: -28 },
  { bit: "1", x: 27, y: 34.3, angle: 71.8, lying: -1 },
  { bit: "0", x: 27, y: 30.8, angle: 71.8, lying: -1 },
  // En medio: uno acostado sobre el piso caído.
  { bit: "1", x: 40, y: 52.8, angle: -69.2, lying: 1 },
  // Abajo: tres parados que sostienen el piso caído y dos acostados uno sobre otro.
  { bit: "0", x: 25, y: 69 },
  { bit: "1", x: 29, y: 69 },
  { bit: "0", x: 33, y: 69, angle: 6 },
  { bit: "0", x: 58.5, y: 69, angle: -90, lying: 1 },
  { bit: "1", x: 57, y: 66, angle: -90, lying: 1 },
  // En el suelo, fuera de la estantería.
  { bit: "0", x: 19, y: 75, angle: -90, lying: 1 },
  { bit: "1", x: 19.5, y: 72, angle: -90, lying: 1 },
  { bit: "1", x: 66.5, y: 75, angle: -14 },
  { bit: "0", x: 82, y: 75, angle: -90, lying: 1 },
];

function Digit({ bit, x, y, angle = 0, lying }: Placed) {
  const shift = lying ? ` translate(${lying} 0)` : "";
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})${shift}`}>
      {bit === "0" ? <rect x={-1} y={-17.5} width={2} height={17} rx={1} /> : <path d="M0 -17.5V-.5M-1 -14.5L0 -17.5M-1 -.5H1" />}
    </g>
  );
}

// Usa currentColor, como el logo: funciona en modo claro y oscuro.
export function BrokenShelfIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 84 78"
      fill="none"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x={21} y={1} width={41.5} height={69} rx={2} strokeWidth={2} />
      {/* Piso de arriba: se soltó a la izquierda. Piso del medio: se soltó a la derecha. */}
      <path d="M22 37L61.5 24" strokeWidth={2} />
      <path d="M22 47L61.5 62" strokeWidth={2} />
      {DIGITS.map((digit, i) => (
        <Digit key={i} {...digit} />
      ))}
      {/* Suelo. */}
      <path d="M2 75H82" strokeWidth={1.5} />
    </svg>
  );
}
