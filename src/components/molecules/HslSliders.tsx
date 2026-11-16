import { useId, type ReactNode } from "react";
import { hslColor, type Hsl } from "@/lib/colors";

// Cada barra muestra en su fondo los colores que se obtienen al moverla, con los otros dos valores fijos.
const CHANNELS = [
  {
    key: "h",
    name: "tono",
    max: 360,
    track: ({ s, l }: Hsl) => `linear-gradient(to right, ${[0, 60, 120, 180, 240, 300, 360].map((h) => hslColor({ h, s, l })).join()})`,
  },
  { key: "s", name: "saturación", max: 100, track: ({ h, l }: Hsl) => `linear-gradient(to right, ${hslColor({ h, s: 0, l })}, ${hslColor({ h, s: 100, l })})` },
  {
    key: "l",
    name: "luminosidad",
    max: 100,
    track: ({ h, s }: Hsl) => `linear-gradient(to right, ${hslColor({ h, s, l: 0 })}, ${hslColor({ h, s, l: 50 })}, ${hslColor({ h, s, l: 100 })})`,
  },
] as const;

// Barra transparente de 44 px de alto (área táctil) sobre el degradado; el círculo deja ver el color debajo.
const RANGE =
  "relative h-11 w-full cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline-2 focus-visible:outline-current [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-transparent [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.6)] [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.6)]";

type HslSlidersProps = {
  legend: string;
  value: Hsl;
  onChange: (value: Hsl) => void;
  // Muestra junto al nombre; por defecto, un círculo del color elegido.
  swatch?: ReactNode;
  className?: string;
};

// Selector de color con tres barras H, S y L. El tamaño de letra lo hereda de quien lo usa.
export function HslSliders({ legend, value, onChange, swatch, className = "" }: HslSlidersProps) {
  const id = useId();
  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="flex items-center gap-2 font-medium">
        {legend}
        {swatch ?? <span aria-hidden="true" className="size-5 rounded-full ring-1 ring-black/25" style={{ background: hslColor(value) }} />}
      </legend>
      {CHANNELS.map(({ key, name, max, track }) => (
        // La etiqueta no envuelve la barra: si no, su valor también entraría en el nombre accesible.
        <div key={key} className="grid grid-cols-[1.25em_1fr] items-center gap-1 font-medium">
          <label htmlFor={`${id}-${key}`}>
            {key.toUpperCase()}
            <span className="sr-only"> ({name})</span>
          </label>
          <span className="relative">
            <span aria-hidden="true" className="absolute inset-x-1.5 top-1/2 h-3 -translate-y-1/2 rounded-full ring-1 ring-black/15" style={{ background: track(value) }} />
            <input id={`${id}-${key}`} type="range" min={0} max={max} value={value[key]} onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) })} className={RANGE} />
          </span>
        </div>
      ))}
    </fieldset>
  );
}
