import type { SVGProps } from "react";

// Estantería de 3 pisos cuyos libros son los bits ASCII de "Lib" (L, i, b).
export const LOGO_ROWS = ["01001100", "01101001", "01100010"] as const;

// Cada dígito mide DIGIT_W × BOOK_H con el trazo incluido: el 0 y el 1 son igual de anchos para parecer libros.
const DIGIT_W = 3;
const BOOK_H = 18;
const DIGIT_STROKE = 1;
const GAP = 1.5;
const FRAME = 2;
const PAD = 2.5;
const CLEAR = 3;
const LEVEL_H = CLEAR + BOOK_H;
const BITS = LOGO_ROWS[0].length;
const WIDTH = BITS * DIGIT_W + (BITS - 1) * GAP + 2 * (PAD + FRAME);
const HEIGHT = 2 * FRAME + LOGO_ROWS.length * LEVEL_H + (LOGO_ROWS.length - 1) * FRAME;

const half = DIGIT_STROKE / 2;

function Digit({ bit, x, y }: { bit: string; x: number; y: number }) {
  if (bit === "0") {
    return <rect x={x + half} y={y + half} width={DIGIT_W - DIGIT_STROKE} height={BOOK_H - DIGIT_STROKE} rx={(DIGIT_W - DIGIT_STROKE) / 2} />;
  }
  const center = x + DIGIT_W / 2;
  const top = y + half;
  const bottom = y + BOOK_H - half;
  // Trazo vertical, banderita arriba y base del mismo ancho que el 0.
  return <path d={`M${center} ${top}V${bottom}M${x + half} ${y + 3.5}L${center} ${top}M${x + half} ${bottom}H${x + DIGIT_W - half}`} />;
}

// Usa currentColor: toma el color del texto donde se ubique (funciona en modo claro y oscuro).
export function LogoMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={DIGIT_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x={FRAME / 2} y={FRAME / 2} width={WIDTH - FRAME} height={HEIGHT - FRAME} rx={2} strokeWidth={FRAME} />
      {LOGO_ROWS.map((bits, row) => {
        const top = FRAME + row * (LEVEL_H + FRAME);
        return (
          <g key={bits} data-row={row}>
            {row > 0 && <path d={`M${FRAME} ${top - FRAME / 2}H${WIDTH - FRAME}`} strokeWidth={FRAME} />}
            {[...bits].map((bit, i) => (
              <Digit key={i} bit={bit} x={FRAME + PAD + i * (DIGIT_W + GAP)} y={top + CLEAR} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
