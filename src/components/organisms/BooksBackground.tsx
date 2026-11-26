import { Book, BookMarked, BookOpen, BookOpenText, Library, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

const ICONS: LucideIcon[] = [Book, BookOpen, BookMarked, BookOpenText, Library];
export const BOOKS_PER_COPY = 12;

// Cuatro filas repartidas en el body; duración y período distintos para que no se muevan al unísono.
export const BOOK_ROWS = [
  { top: "12%", drift: 70, wave: 4, offset: 0 },
  { top: "37%", drift: 85, wave: 5, offset: 2 },
  { top: "62%", drift: 65, wave: 4.5, offset: 1 },
  { top: "87%", drift: 80, wave: 5.5, offset: 3 },
];

// Retraso de la onda de cada libro dentro de su copia. Es negativo para que todo arranque ya en movimiento y crece
// con la posición para que la onda viaje hacia la derecha. Una copia abarca un período completo, así el empalme
// entre las dos copias no se nota.
export function waveDelay(index: number, period: number) {
  return -period + (index % BOOKS_PER_COPY) * (period / BOOKS_PER_COPY);
}

// Fondo decorativo: filas de libros que avanzan de izquierda a derecha en forma de onda, sin principio ni fin visibles.
// Cada fila tiene dos copias idénticas y se desplaza exactamente una copia por ciclo (de -50 % a 0).
export function BooksBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {BOOK_ROWS.map((row) => (
        <div key={row.top} className="absolute inset-x-0 -translate-y-1/2" style={{ top: row.top }}>
          <div
            className="flex w-max animate-[books-drift_var(--drift)_linear_infinite] motion-reduce:animate-none"
            style={{ "--drift": `${row.drift}s` } as CSSProperties}
          >
            {[0, 1].flatMap((copy) =>
              Array.from({ length: BOOKS_PER_COPY }, (_, index) => {
                const Icon = ICONS[(index + row.offset) % ICONS.length];
                return (
                  // El ancho en vw garantiza que cada copia sea más ancha que la pantalla, en cualquier tamaño.
                  <span key={`${copy}-${index}`} className="flex w-[max(7rem,14vw)] justify-center">
                    <Icon
                      strokeWidth={1.5}
                      className="size-7 animate-[books-wave_var(--wave)_ease-in-out_infinite] text-accent opacity-40 motion-reduce:animate-none sm:size-8"
                      style={{ "--wave": `${row.wave}s`, animationDelay: `${waveDelay(index, row.wave)}s` } as CSSProperties}
                    />
                  </span>
                );
              }),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
