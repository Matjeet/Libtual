"use client";

import {
  createContext,
  use,
  useLayoutEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import { BookSpine } from "@/components/atoms/BookSpine";
import { canAnimate } from "@/components/organisms/BookStage";
import type { ViewedBook } from "@/components/organisms/BookViewer";
import { moveBook } from "@/lib/book-actions";
import type { ShelfBook } from "@/lib/books";

// Alto estándar de cada piso (hueco + tablón). La estantería mide un número entero de pisos más el tablón de arriba
// (1.25rem = 20px, con su canto incluido): se ven solo pisos completos y el espacio que sobra queda arriba, sobre la estantería.
// round(down, …) calcula cuántos caben en el alto disponible; max() asegura al menos un piso en pantallas muy bajas.
const FRAME_HEIGHT = "h-[calc(max(10.5rem,round(down,100%-1.25rem,10.5rem))+1.25rem)]";

// shortcut: pisos fijos de sobra (más de los que caben en 2560×1440) y sin scroll: los libros que no quepan en los pisos
// visibles quedan ocultos. Agregar un piso cuando el último se llene y habilitar el scroll solo entonces.
const SHELVES = 10;

// Cada libro tiene su propia perspectiva, centrada en él: todos se ven sacar igual, estén donde estén.
const PERSPECTIVE = "perspective-[500px]";
// El libro sale hacia adelante y se inclina sobre su base (la parte de arriba hacia afuera): con el mouse encima (hover)
// o enfocado con el teclado.
const PULL =
  "origin-bottom transition-transform duration-300 ease-out group-hover:[transform:translateZ(10px)_rotateX(-18deg)] focus-visible:[transform:translateZ(10px)_rotateX(-18deg)] motion-reduce:transition-none";

// Con mouse, el arrastre empieza al moverse unos píxeles con el botón apretado. Con el dedo, al mantenerlo quieto un momento:
// si se mueve antes, es el deslizamiento del carrusel de la habitación.
const DRAG_DISTANCE = 6;
const HOLD_MS = 300;

// Abre un libro de la estantería. Lo da RoomScene, que muestra el libro abierto fuera del carrusel de la habitación.
export const OpenShelfBook = createContext<((viewing: ViewedBook) => void) | null>(null);

// Lugar del libro en pantalla sin la inclinación del hover: su caja dentro del <li> (relative), que no se transforma.
function slotRect(slot: HTMLElement) {
  const shelf = slot.parentElement!.getBoundingClientRect();
  return new DOMRect(shelf.left + slot.offsetLeft, shelf.top + slot.offsetTop, slot.offsetWidth, slot.offsetHeight);
}

type Press = { book: ShelfBook; x: number; y: number; timer?: ReturnType<typeof setTimeout> };
// El libro que se arrastra, el orden que se ve mientras tanto y su lugar en pantalla al levantarlo (de ahí parte la copia).
type Drag = { book: ShelfBook; order: ShelfBook[]; rect: DOMRect };

// books: los libros del usuario, en el orden de su estantería. Se acomodan de izquierda a derecha, piso por piso.
// Se cambian de lugar arrastrándolos (o con las flechas del teclado): mientras se arrastra, los demás se corren y abren el
// hueco donde quedará; al soltarlo se guarda su nuevo lugar (moveBook) y, mientras tanto, ya se ve movido.
export function Bookshelf({ books = [] }: { books?: ShelfBook[] }) {
  const open = use(OpenShelfBook);
  const [shelved, setShelved] = useOptimistic(books);
  const [, startTransition] = useTransition();
  const [drag, setDrag] = useState<Drag | null>(null);
  const [message, setMessage] = useState("");
  const press = useRef<Press | null>(null);
  // Hubo arrastre: el clic que llega al soltar no abre el libro.
  const dragged = useRef(false);
  const listRef = useRef<HTMLUListElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  // Dónde estaba cada libro en pantalla antes de cambiar el orden: desde ahí se desliza a su nuevo lugar.
  const before = useRef<Map<string, DOMRect> | null>(null);
  const shown = drag?.order ?? shelved;

  const items = () => [...(listRef.current?.children ?? [])] as HTMLElement[];
  const snapshot = () => (before.current = new Map(items().map((li) => [li.dataset.bookId!, li.getBoundingClientRect()])));

  useLayoutEffect(() => {
    const prev = before.current;
    if (!prev) return;
    before.current = null;
    if (!canAnimate()) return;
    for (const li of items()) {
      const old = prev.get(li.dataset.bookId!);
      if (!old) continue;
      li.getAnimations().forEach((animation) => animation.cancel());
      const now = li.getBoundingClientRect();
      const [dx, dy] = [old.left - now.left, old.top - now.top];
      if (dx || dy) li.animate({ transform: [`translate(${dx}px, ${dy}px)`, "none"] }, { duration: 200, easing: "ease-out" });
    }
  });

  const openBook = (book: ShelfBook) => (event: MouseEvent<HTMLButtonElement>) => {
    if (dragged.current) {
      dragged.current = false;
      return;
    }
    const slot = event.currentTarget;
    open?.({ book, slot, rect: slotRect(slot) });
  };

  // Guarda el nuevo orden: el libro queda entre sus vecinos.
  function save(book: ShelfBook, order: ShelfBook[]) {
    if (order.every((other, i) => other.id === shelved[i]?.id)) return;
    const i = order.indexOf(book);
    startTransition(async () => {
      setShelved(order);
      const result = await moveBook(book.id, order[i - 1]?.id ?? null, order[i + 1]?.id ?? null);
      setMessage(result.error ?? `${book.title} quedó en el lugar ${i + 1} de ${order.length}.`);
    });
  }

  // El orden con el libro arrastrado donde está el puntero, o null si no cambia. Usa el lugar de cada libro sin la
  // animación (offsetLeft/offsetTop): la mitad izquierda de un libro lo pone antes y la derecha después; a la izquierda o a
  // la derecha de un piso, al principio o al final de ese piso; debajo de todos, al final.
  // Debajo de la estantería cuenta como el último piso visible: los pisos que no caben quedan ocultos (ver SHELVES).
  function orderAt(x: number, y: number, { book, order }: Drag) {
    const box = listRef.current!.getBoundingClientRect();
    const [px, py] = [x - box.left, Math.min(y - box.top, box.height - 1)];
    const lis = items();
    const last = lis.at(-1);
    const row = lis.filter((li) => py >= li.offsetTop && py < li.offsetTop + li.offsetHeight);
    const end = (li: HTMLElement) => li.offsetLeft + li.offsetWidth;
    let target: HTMLElement | undefined;
    let after = false;
    if (row.length > 0) {
      target = row.find((li) => px >= li.offsetLeft && px < end(li));
      if (target) after = px >= target.offsetLeft + target.offsetWidth / 2;
      else if (px < row[0].offsetLeft) target = row[0];
      else if (px >= end(row.at(-1)!)) [target, after] = [row.at(-1), true];
    } else if (last && py >= last.offsetTop + last.offsetHeight) [target, after] = [last, true];
    if (!target || target.dataset.bookId === book.id) return null;
    const next = order.filter((other) => other !== book);
    next.splice(next.findIndex((other) => other.id === target.dataset.bookId) + (after ? 1 : 0), 0, book);
    return next.every((other, i) => other === order[i]) ? null : next;
  }

  function lift(button: HTMLElement) {
    dragged.current = true;
    setDrag({ book: press.current!.book, order: shelved, rect: slotRect(button) });
  }

  function onPointerDown(book: ShelfBook, event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || drag) return;
    dragged.current = false;
    const button = event.currentTarget;
    // Los movimientos siguen llegando a este libro aunque el puntero salga de él.
    button.setPointerCapture?.(event.pointerId);
    const timer = event.pointerType === "mouse" ? undefined : setTimeout(() => lift(button), HOLD_MS);
    press.current = { book, x: event.clientX, y: event.clientY, timer };
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const current = press.current;
    if (!current) return;
    if (drag) {
      ghostRef.current!.style.translate = `${event.clientX - current.x}px ${event.clientY - current.y}px`;
      const next = orderAt(event.clientX, event.clientY, drag);
      if (next) {
        snapshot();
        setDrag({ ...drag, order: next });
      }
      return;
    }
    if (Math.hypot(event.clientX - current.x, event.clientY - current.y) < DRAG_DISTANCE) return;
    // Con el dedo, moverse antes de tiempo es deslizar el carrusel: no se arrastra el libro.
    if (current.timer !== undefined) {
      clearTimeout(current.timer);
      press.current = null;
    } else lift(event.currentTarget);
  }

  // Al soltar, la copia vuela al hueco y el libro queda ahí.
  function onPointerUp(event: PointerEvent<HTMLButtonElement>) {
    clearTimeout(press.current?.timer);
    press.current = null;
    if (!drag) return;
    // El carrusel de la habitación no debe tomarlo como un deslizamiento.
    event.stopPropagation();
    const land = () => {
      setDrag(null);
      save(drag.book, drag.order);
    };
    if (!canAnimate()) return land();
    const slot = items().find((li) => li.dataset.bookId === drag.book.id)!.firstElementChild as HTMLElement;
    const to = slotRect(slot);
    const ghost = ghostRef.current!;
    ghost.animate(
      {
        translate: [ghost.style.translate || "0px 0px", `${to.left - drag.rect.left}px ${to.top - drag.rect.top}px`],
        rotate: ["-3deg", "0deg"],
      },
      { duration: 150, easing: "ease-out", fill: "forwards" },
    ).onfinish = land;
  }

  function onPointerCancel() {
    clearTimeout(press.current?.timer);
    press.current = null;
    setDrag(null);
  }

  // Teclado: las flechas mueven el libro enfocado un lugar a la izquierda o a la derecha.
  function onKeyDown(book: ShelfBook, event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (!step || drag) return;
    // Las flechas sobre un libro no pasan de panel en el carrusel de la habitación.
    event.preventDefault();
    event.stopPropagation();
    const i = shelved.indexOf(book);
    if (i + step < 0 || i + step >= shelved.length) return;
    const order = shelved.filter((other) => other !== book);
    order.splice(i + step, 0, book);
    snapshot();
    save(book, order);
  }

  return (
    // El hueco libre de arriba lo deja justify-end: la estantería queda apoyada en el borde de abajo.
    <div className="flex min-h-0 flex-1 flex-col justify-end">
      <div className={`flex shrink-0 flex-col ${FRAME_HEIGHT}`}>
        <div className="wood-grain-x h-5 shrink-0 rounded-t-lg border-b-[5px] border-wood-edge" />
        <div className="flex min-h-0 flex-1">
          {/* El canto interior más oscuro da profundidad al hueco. */}
          <div className="wood-grain-y w-5 shrink-0 shadow-[inset_-4px_0_0_var(--color-wood-edge)]" />
          <section aria-labelledby="bookshelf-title" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <h1 id="bookshelf-title" className="sr-only">
              Tu estantería
            </h1>
            {Array.from({ length: SHELVES }, (_, i) => (
              <div key={i} data-testid="shelf" className="flex h-[10.5rem] shrink-0 flex-col">
                {/* Fondo oscuro del hueco, con la sombra que deja el tablón de arriba. */}
                <div className="flex-1 bg-wood-back shadow-[inset_0_10px_12px_-8px_rgb(0_0_0/0.7)]" />
                <div className="wood-grain-x h-5 border-b-[5px] border-wood-edge shadow-[0_6px_8px_-6px_rgb(0_0_0/0.45)]" />
              </div>
            ))}
            {/* Cada libro ocupa el alto de un piso (pb-5 = el tablón): al llenarse un piso, el siguiente libro baja al de abajo
                y queda parado sobre su tablón. data-book-id: la creación de un libro busca ahí el lugar del libro nuevo. */}
            {shown.length > 0 && (
              <ul ref={listRef} aria-label="Libros" className="absolute inset-0 flex flex-wrap content-start gap-x-0.5 px-1.5">
                {shown.map((book) => (
                  <li
                    key={book.id}
                    data-book-id={book.id}
                    // El libro que se arrastra deja su hueco vacío: ahí quedará al soltarlo.
                    className={`group relative flex h-[10.5rem] items-end pb-5 focus-within:z-10 hover:z-10 ${PERSPECTIVE} ${drag?.book === book ? "opacity-0" : ""}`}
                  >
                    {/* Al pasar el mouse el libro sale un poco, como al sacarlo: se inclina hacia adelante sobre su base y
                        deja ver arriba el canto de las hojas entre las dos pastas. Con un clic se abre.
                        Excepción a los 44 px de área táctil: el ancho es el del lomo (24 a 56 px, cumple el mínimo de 24 px de
                        WCAG 2.5.8) y los libros cubren el piso sin huecos, así que todo toque cae en algún libro.
                        touch-none: el dedo arrastra el libro (la página no hace scroll y el carrusel usa pointer events). */}
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      aria-describedby="bookshelf-move-hint"
                      onClick={openBook(book)}
                      onPointerDown={(event) => onPointerDown(book, event)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      onPointerCancel={onPointerCancel}
                      // Mantener el dedo sobre el libro no abre el menú del navegador.
                      onContextMenu={(event) => press.current && event.preventDefault()}
                      onKeyDown={(event) => onKeyDown(book, event)}
                      className={`relative touch-none select-none outline-none transform-3d [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${drag ? "cursor-grabbing" : "cursor-pointer"} ${PULL}`}
                    >
                      <BookSpine
                        title={book.title}
                        category={book.category}
                        coverColor={book.coverColor}
                        fontColor={book.fontColor}
                        titleFont={book.titleFont}
                        status={book.status}
                      />
                      {/* Cara de arriba: acostada hacia el fondo (de canto, no se ve) hasta que el libro se inclina. */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-full h-14 origin-bottom rounded-t-sm border-x-2 border-t-2 backface-hidden [transform:rotateX(90deg)]"
                        style={{
                          borderColor: `color-mix(in oklab, ${book.coverColor} 65%, black)`,
                          background: "repeating-linear-gradient(90deg, #d8c8b0 0 1px, #fdfaf5 1px 3px)",
                        }}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p id="bookshelf-move-hint" className="sr-only">
              Arrástralo o usa las flechas izquierda y derecha para cambiarlo de lugar.
            </p>
            <p aria-live="polite" className="sr-only">
              {message}
            </p>
          </section>
          <div className="wood-grain-y w-5 shrink-0 shadow-[inset_4px_0_0_var(--color-wood-edge)]" />
        </div>
      </div>
      {/* Copia del libro que sigue al puntero, fuera de la estantería (que recorta) y del carrusel (que se desplaza). */}
      {drag &&
        createPortal(
          <div
            ref={ghostRef}
            aria-hidden="true"
            className="pointer-events-none fixed z-50 -rotate-3 drop-shadow-xl"
            style={{ left: drag.rect.left, top: drag.rect.top }}
          >
            <BookSpine
              title={drag.book.title}
              category={drag.book.category}
              coverColor={drag.book.coverColor}
              fontColor={drag.book.fontColor}
              titleFont={drag.book.titleFont}
              status={drag.book.status}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
