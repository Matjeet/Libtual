"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { BookSpine } from "@/components/atoms/BookSpine";
import { BookDialog, BookFrame, bookToShelf, canAnimate, closeBook, pageClass, settle, shelfToBook, type BookParts } from "@/components/organisms/BookStage";
import { BOOK_FONTS } from "@/lib/book-fonts";
import type { ShelfBook } from "@/lib/books";
import { hexToHsl, hslColor } from "@/lib/colors";

// Libro elegido en la estantería: sus datos, su lugar (el lomo, que queda vacío mientras está abierto) y dónde estaba en pantalla.
export type ViewedBook = { book: ShelfBook; slot: HTMLElement; rect: DOMRect };

const family = (font: string) => BOOK_FONTS.find(({ value }) => value === font)?.family;
// Muestra u oculta el lomo en la estantería (oculto, deja el hueco del libro que está abierto).
const showSlot = (slot: HTMLElement, visible: boolean) => slot.style.setProperty("visibility", visible ? "" : "hidden");
// Año de publicación; los negativos son antes de Cristo.
const yearLabel = (year: number) => (year < 0 ? `${-year} a. C.` : String(year));

// El título ocupa la mitad de arriba de la página izquierda: cuanto más largo, más chica la letra, para que siempre quepa.
// La letra se mide en el espacio del título (cqi: ancho, cqh: alto).
function titleSize(title: string) {
  const length = [...title].length;
  if (length <= 12) return "text-[min(16cqi,30cqh)]";
  if (length <= 30) return "text-[min(11cqi,20cqh)]";
  if (length <= 70) return "text-[min(8cqi,14cqh)]";
  return "text-[min(5.5cqi,9cqh)]";
}

type BookViewerProps = { viewing: ViewedBook | null; onClose: () => void };

// Ver un libro de la estantería: el lomo sale de su lugar (que queda vacío) y vuela al centro, gira mostrando la tapa y el
// libro se abre, igual de grande y con el mismo carrusel en celular que al crear un libro. Al cerrar (la X, el fondo en
// pantallas anchas o Escape) hace el camino inverso y vuelve a su lugar. Sin animaciones, aparece y desaparece al instante.
// Página izquierda: el título (con su fuente, siempre en negro) y abajo autor, año y género.
// Página derecha: el comentario, escrito directo sobre la hoja con su fuente y justificado.
export function BookViewer({ viewing, onClose }: BookViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const flipperRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  // Mientras vuela (al abrir o al cerrar) no se puede volver a cerrar.
  const busy = useRef(false);
  // Lugar del lomo en la estantería al cerrar (si cambió desde que se abrió, por ejemplo, al girar el celular).
  const [landing, setLanding] = useState<DOMRect | null>(null);
  const animated = viewing !== null && canAnimate();

  const parts = (): BookParts => ({
    fly: flyRef.current!,
    inner: innerRef.current!,
    flipper: flipperRef.current!,
    pages: [leftRef.current!, rightRef.current!],
  });

  // Antes de pintar: el lugar queda vacío y el libro, de canto (invisible) hasta que empieza a volar.
  useLayoutEffect(() => {
    if (!viewing) return;
    showSlot(viewing.slot, false);
    if (animated) flyRef.current!.style.transform = "perspective(60rem) rotateY(90deg)";
  }, [viewing, animated]);

  // Con el modal ya abierto (los efectos de los hijos corren antes), el lomo vuela al centro y el libro se abre.
  const takeOut = useEffectEvent((rect: DOMRect) => {
    busy.current = true;
    shelfToBook(parts(), spineRef.current!, rect).finally(() => (busy.current = false));
  });
  useEffect(() => {
    if (viewing && animated) takeOut(viewing.rect);
  }, [viewing, animated]);

  async function close() {
    if (!viewing || busy.current) return;
    busy.current = true;
    const dialog = dialogRef.current!;
    if (animated) {
      await closeBook(parts());
      // En celular la estantería está en un carrusel: se espera a que deje de moverse para medir el lugar del libro.
      await settle(viewing.slot);
      const to = viewing.slot.getBoundingClientRect();
      flushSync(() => setLanding(to));
      await bookToShelf(parts(), spineRef.current!, to, dialog);
    }
    // El lomo llegó: su lugar se ve de nuevo en el mismo cuadro en que se cierra el modal.
    showSlot(viewing.slot, true);
    dialog.close();
  }

  const book = viewing?.book;
  const cover = book ? hexToHsl(book.coverColor) : null;
  const darker = (by: number) => (cover ? hslColor({ ...cover, l: Math.max(cover.l - by, 0) }) : "");
  const spot = landing ?? viewing?.rect;

  return (
    <BookDialog
      dialogRef={dialogRef}
      label={book?.title ?? "Libro"}
      showing={viewing}
      onRequestClose={close}
      onClose={() => {
        // Vuelve el lomo a su lugar (también si el modal se cerró de golpe a mitad de un vuelo).
        if (viewing) showSlot(viewing.slot, true);
        busy.current = false;
        setLanding(null);
        onClose();
      }}
    >
      {(side, onSide) =>
        book && (
          <>
            <BookFrame
              colors={{ cover: book.coverColor, spine: darker(13), line: darker(18), band: book.fontColor }}
              side={side}
              onSide={onSide}
              entrance={false}
              arrows={{ right: "Ver el comentario", left: "Ver los datos del libro" }}
              flyRef={flyRef}
              innerRef={innerRef}
              flipperRef={flipperRef}
            >
              <div ref={leftRef} onFocus={() => onSide("left")} className={`flex flex-col p-2 @container sm:p-4 ${pageClass("left", side, false)}`}>
                <div className="flex h-1/2 shrink-0 items-center justify-center overflow-hidden [container-type:size]">
                  <h2
                    className={`text-center leading-tight text-black [overflow-wrap:anywhere] [text-wrap:balance] ${titleSize(book.title)}`}
                    style={{ fontFamily: family(book.titleFont) }}
                  >
                    {book.title}
                  </h2>
                </div>
                <dl className="mt-auto flex flex-col gap-1 text-base text-black @lg:text-lg">
                  {[
                    ["Autor", book.author],
                    ["Año", yearLabel(book.year)],
                    ["Género", book.genre],
                  ].map(([term, value]) => (
                    <div key={term}>
                      <dt className="sr-only">{term}</dt>
                      <dd className="flex gap-2">
                        <span aria-hidden="true">—</span>
                        <span className="min-w-0 [overflow-wrap:anywhere]">{value}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div ref={rightRef} onFocus={() => onSide("right")} className={`p-2 @container sm:p-4 ${pageClass("right", side, false)}`}>
                {/* Con scroll si no cabe; se puede enfocar para leerlo con el teclado. */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Comentario"
                  className="size-full overflow-y-auto whitespace-pre-line text-justify text-base text-black outline-none [hyphens:auto] [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-(--ink)/40 @lg:text-lg @xl:text-xl"
                  style={{ fontFamily: family(book.commentFont) }}
                >
                  {book.comment}
                </div>
              </div>
            </BookFrame>
            {/* Lomo que vuela entre la estantería y el centro: se dibuja en su lugar y la animación lo mueve. */}
            {animated && spot && (
              <div ref={spineRef} aria-hidden="true" className="absolute" style={{ left: spot.left, top: spot.top }}>
                <BookSpine title={book.title} category={book.category} coverColor={book.coverColor} fontColor={book.fontColor} titleFont={book.titleFont} />
              </div>
            )}
          </>
        )
      }
    </BookDialog>
  );
}
