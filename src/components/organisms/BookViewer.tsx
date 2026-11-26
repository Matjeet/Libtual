"use client";

import { Feather } from "lucide-react";
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition } from "react";
import { flushSync } from "react-dom";
import { BookCover, BookSheet } from "@/components/atoms/BookParts";
import { BookSpine } from "@/components/atoms/BookSpine";
import { BookForm, type BookLook } from "@/components/organisms/BookForm";
import { BookDialog, BookFrame, bookToShelf, canAnimate, closeBook, pageClass, settle, shelfToBook, type BookParts } from "@/components/organisms/BookStage";
import { updateBook, type NewBook } from "@/lib/book-actions";
import { BOOK_FONTS, fontFamily, type BookFont } from "@/lib/book-fonts";
import { bookCategory, bookFields, bookmarkColor, changedFields, type ShelfBook } from "@/lib/books";
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
// Página izquierda: el título (con su fuente, siempre en negro), debajo autor, año y género y, al final, la cita del libro si la hay.
// Página derecha: el comentario, escrito directo sobre la hoja con su fuente y justificado.
// Arriba a la derecha de la página izquierda, la pluma: se pasa la página y aparece el mismo formulario que al crear un
// libro, con sus datos; al firmar se guarda solo lo que cambió y se vuelve a pasar la página al libro ya editado.
export function BookViewer({ viewing, onClose }: BookViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const flipperRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  // Se está editando: en las páginas está el formulario.
  const [editing, setEditing] = useState(false);
  // Se está pasando la página: hacia el formulario (forward) o de vuelta al libro (back).
  const [turning, setTurning] = useState<"forward" | "back" | null>(null);
  // Color de la pasta y estado elegidos en el formulario (null = los del libro).
  const [look, setLook] = useState<BookLook | null>(null);
  // El libro con lo último que se guardó (viewing.book es como estaba al abrirlo).
  const [edited, setEdited] = useState<ShelfBook | null>(null);
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string>();
  // Mientras vuela (al abrir o al cerrar) o se pasa la página, no se puede volver a cerrar.
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
    if (animated) flyRef.current!.style.visibility = "hidden";
  }, [viewing, animated]);

  // Con el modal ya abierto (los efectos de los hijos corren antes), el lomo vuela al centro y el libro se abre.
  const takeOut = useEffectEvent((rect: DOMRect) => {
    busy.current = true;
    shelfToBook(parts(), spineRef.current!, coverRef.current!, rect).finally(() => (busy.current = false));
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

  // Pasa la página (una hoja gira sobre el lomo, de la derecha a la izquierda o al revés) y cambia lo escrito: hacia el
  // formulario, la página derecha cambia debajo de la hoja y la izquierda cuando la hoja llega; de vuelta, las dos de entrada.
  async function turn(direction: "forward" | "back") {
    if (!canAnimate()) return setEditing(direction === "forward");
    busy.current = true;
    flushSync(() => {
      setEditing(direction === "forward");
      setTurning(direction);
    });
    // Perspectiva propia: al girar, la hoja dibujada crece desde el centro del libro hasta un factor de hoja/(perspectiva −
    // hoja). Se elige para que no pase del borde de la pantalla (menos 8 px) ni arriba ni abajo; como mínimo, 3,3 veces el
    // ancho del libro (el giro de siempre, que en pantallas grandes se salía de la pantalla).
    const box = innerRef.current!.getBoundingClientRect();
    const sheet = leafRef.current!.querySelector("path")!.getBoundingClientRect();
    const mid = (box.top + box.bottom) / 2;
    const grow = Math.min((sheet.top - 8) / (mid - sheet.top), (innerHeight - 8 - sheet.bottom) / (sheet.bottom - mid));
    const depth = `perspective(${Math.max(box.width * 3.3, (box.width / 2) * (1 + 1 / Math.max(grow, 0.01)))}px)`;
    const turns = [`${depth} rotateY(0deg)`, `${depth} rotateY(-180deg)`];
    // fill: forwards: hasta que se quita la hoja no vuelve a su lugar de partida (se veía un cuadro con lo anterior).
    await leafRef.current!.animate({ transform: direction === "forward" ? turns : turns.toReversed() }, { duration: 700, easing: "ease-in-out", fill: "forwards" })
      .finished.catch(() => {});
    setTurning(null);
    busy.current = false;
  }

  // Firmar: se guarda solo lo que cambió. Sin cambios, vuelve al libro sin guardar.
  function update(next: NewBook) {
    const current = book!;
    const changes = changedFields(bookFields(current), next);
    if (Object.keys(changes).length === 0) return turn("back");
    setError(undefined);
    startSaving(async () => {
      const result = await updateBook(current.id, changes);
      if (result.error) return setError(result.error);
      // El libro muestra lo guardado (sin esperar a que se refresque la página) y se vuelve a él.
      const trim = (text: string) => text.trim();
      setEdited({
        ...current,
        ...next,
        title: trim(next.title),
        author: trim(next.author),
        genre: trim(next.genre),
        quote: trim(next.quote),
        category: bookCategory(next.pages),
      });
      setLook(null);
      turn("back");
    });
  }

  const book = edited && edited.id === viewing?.book.id ? edited : viewing?.book;
  // Mientras se edita, el libro se ve con el color de pasta y el estado del formulario.
  const draft = editing ? look : null;
  const cover = draft?.cover ?? (book ? hexToHsl(book.coverColor) : null);
  const darker = (by: number) => (cover ? hslColor({ ...cover, l: Math.max(cover.l - by, 0) }) : "");
  const colors = book ? { cover: draft?.cover ? hslColor(draft.cover) : book.coverColor, spine: darker(13), line: darker(18), band: book.fontColor } : null;
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
        setEditing(false);
        setTurning(null);
        setLook(null);
        setEdited(null);
        setError(undefined);
        onClose();
      }}
    >
      {(side, onSide) =>
        book && (
          <>
            <BookFrame
              colors={colors!}
              bookmark={bookmarkColor(draft?.status ?? book.status)}
              side={side}
              onSide={onSide}
              entrance={false}
              arrows={{ right: "Ver el comentario", left: "Ver los datos del libro" }}
              flyRef={flyRef}
              innerRef={innerRef}
              flipperRef={flipperRef}
            >
              {(!editing || turning === "forward") && (
              <div
                ref={editing ? undefined : leftRef}
                onFocus={() => onSide("left")}
                className={`flex flex-col overflow-y-auto p-4 [scrollbar-width:thin] @container sm:p-6 lg:p-10 ${pageClass("left", side, false)}`}
              >
                {!editing && !turning && <EditPen onClick={() => !busy.current && turn("forward")} />}
                <div className="flex h-1/2 min-h-24 items-center justify-center overflow-hidden [container-type:size]">
                  <h2
                    className={`text-center leading-tight text-black [overflow-wrap:anywhere] [text-wrap:balance] ${titleSize(book.title)}`}
                    style={{ fontFamily: family(book.titleFont) }}
                  >
                    {book.title}
                  </h2>
                </div>
                {/* Los datos van justo debajo del título; la cita, abajo (a la derecha en una página ancha).
                    En pantallas bajas el título cede espacio (su letra se achica) y, si aun así no cabe, la página tiene scroll. */}
                <dl className="flex shrink-0 flex-col gap-1 pt-4 text-[1.625rem] leading-snug text-black @lg:text-[1.75rem]">
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
                {book.quote && (
                  <blockquote
                    tabIndex={0}
                    aria-label="Cita del libro"
                    className="mt-auto shrink-0 pt-4 font-[Georgia,'Times_New_Roman',serif] whitespace-pre-line text-base text-neutral-600 italic outline-none [overflow-wrap:anywhere] focus-visible:ring-2 focus-visible:ring-(--ink)/40 @md:ml-auto @md:w-3/5 @lg:text-lg @xl:text-xl"
                  >
                    <p>“{book.quote}”</p>
                  </blockquote>
                )}
              </div>
              )}
              {editing && (
                <BookForm
                  initial={{ ...bookFields(book), titleFont: book.titleFont as BookFont, commentFont: book.commentFont as BookFont }}
                  coverColor={book.coverColor}
                  titleColor={book.fontColor}
                  side={side}
                  onSide={onSide}
                  entrance={false}
                  leftRef={leftRef}
                  rightRef={rightRef}
                  leftHidden={turning === "forward"}
                  onLook={setLook}
                  onSign={update}
                  saving={saving}
                  locked={false}
                  error={error}
                />
              )}
              {!editing && (
              <div ref={rightRef} onFocus={() => onSide("right")} className={`p-4 @container sm:p-6 lg:p-10 ${pageClass("right", side, false)}`}>
                {/* Con scroll si no cabe; se puede enfocar para leerlo con el teclado. pr: aire entre el texto y la barra de scroll,
                    que en muchos sistemas se dibuja encima del contenido. */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Comentario"
                  className="size-full overflow-y-auto pr-3 whitespace-pre-line sm:pr-4 text-justify text-base text-black outline-none [hyphens:auto] [scrollbar-width:thin] focus-visible:ring-2 focus-visible:ring-(--ink)/40 @lg:text-lg @xl:text-xl"
                  style={{ fontFamily: family(book.commentFont) }}
                >
                  {book.comment}
                </div>
              </div>
              )}
              {/* La hoja que gira al pasar la página: por delante, la de la derecha; por detrás, la de la izquierda. */}
              {/* El contenedor no se transforma: así la hoja no usa la perspectiva del libro, sino la suya (en turn). */}
              {turning && (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                  <div
                    ref={leafRef}
                    className="absolute inset-y-0 right-0 w-1/2 origin-left transform-3d"
                    style={{ transform: turning === "forward" ? "rotateY(0deg)" : "rotateY(-180deg)" }}
                  >
                    <BookSheet className="absolute inset-0 size-full backface-hidden" />
                    <BookSheet mirrored className="absolute inset-0 size-full backface-hidden [transform:rotateY(180deg)]" />
                  </div>
                </div>
              )}
            </BookFrame>
            {/* Lomo que vuela entre la estantería y el centro: se dibuja en su lugar y la animación lo mueve. */}
            {animated && spot && (
              <div ref={spineRef} aria-hidden="true" className="absolute" style={{ left: spot.left, top: spot.top }}>
                <BookSpine title={book.title} category={book.category} coverColor={book.coverColor} fontColor={book.fontColor} titleFont={book.titleFont} status={book.status} />
              </div>
            )}
            {/* Tapa suelta que gira al llegar el lomo al centro; queda de canto (invisible) antes y después. */}
            {animated && (
              <div
                ref={coverRef}
                aria-hidden="true"
                className="absolute drop-shadow-[0_1.25rem_1.5rem_rgb(0_0_0/0.35)] [transform:perspective(60rem)_rotateY(90deg)]"
              >
                <BookCover colors={colors!} className="size-full" />
              </div>
            )}
          </>
        )
      }
    </BookDialog>
  );
}

// Solo la pluma, arriba a la derecha de la página. Con el mouse encima (o el foco del teclado), escribe "Editar": la
// palabra aparece de izquierda a derecha a su lado mientras la pluma la recorre (keyframes en globals.css).
// --word: el ancho de la palabra, el camino de la pluma.
function EditPen({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Editar"
      onClick={onClick}
      className="group absolute right-1 top-1 z-10 inline-flex size-11 items-center justify-center rounded-full outline-none [--word:3.25rem] focus-visible:ring-2 focus-visible:ring-(--ink)/40 sm:right-3 sm:top-3"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[calc(100%-0.5rem)] top-1/2 w-(--word) -translate-y-1/2 text-right text-2xl leading-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:group-hover:animate-[write-word_0.9s_linear_both] motion-safe:group-focus-visible:animate-[write-word_0.9s_linear_both]"
        style={{ fontFamily: fontFamily("caveat") }}
      >
        Editar
      </span>
      <Feather
        aria-hidden="true"
        className="size-6 origin-bottom-left motion-safe:group-hover:animate-[pen-across_0.9s_linear_both,feather-write_0.45s_ease-in-out_2] motion-safe:group-focus-visible:animate-[pen-across_0.9s_linear_both,feather-write_0.45s_ease-in-out_2]"
      />
    </button>
  );
}
