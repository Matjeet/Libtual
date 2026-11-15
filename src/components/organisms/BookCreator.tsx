"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { BookCover, BookPages } from "@/components/atoms/BookParts";
import type { TakenBook } from "@/components/atoms/PaperBag";
import { HslSliders } from "@/components/molecules/HslSliders";
import { BOOK_FONTS, fontFamily, type BookFont } from "@/lib/book-fonts";
import { hexToHsl, hslColor, type Hsl } from "@/lib/colors";

const COMMENT_MAX = 2000;
// Letras claras, como un título dorado sobre la tapa.
const TITLE_COLOR: Hsl = { h: 45, s: 80, l: 90 };
const STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "reading", label: "Leyendo" },
  { value: "finished", label: "Terminado" },
];
// Desde sm se ve el libro completo; por debajo, una página a la vez.
const WIDE = "(min-width: 40rem)";
// Distancia mínima (px) de un deslizamiento para pasar de página, como en el carrusel de la habitación.
const SWIPE = 40;
// Flechas para pasar de página: solo con mouse y en celular (con el dedo se desliza).
// Página que no está en pantalla en celular: su borde asoma, pero sin controles visibles ni tocables.
// Sigue en el orden de Tab: al enfocarla se pasa a ella.
const OFF_PAGE = "pointer-events-none opacity-0";
// Lo escrito aparece cuando el libro ya se abrió. Sin fill final, para que la transición de opacidad al pasar de página funcione.
const PAGE_FADE_IN = "motion-safe:animate-[fade-in_0.4s_ease-out_1.3s_backwards]";
const ARROW =
  "absolute top-[calc(50%+1.5rem)] hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-foreground/10 transition hover:bg-surface pointer-fine:flex sm:pointer-fine:hidden";
// Controles sobre el papel: mismos colores en modo claro y oscuro.
const FIELD = "h-11 w-full min-w-0 rounded-md border border-(--ink)/30 bg-white/60 px-2 text-base outline-none transition focus:border-(--ink)";

type Page = "form" | "comment";

type BookCreatorProps = {
  // Libro que salió de la bolsa: dónde estaba en pantalla y sus colores; null = cerrado.
  book: TakenBook | null;
  onClose: () => void;
};

// Creación de un libro: el libro que salió de la bolsa vuela al centro de la pantalla y se abre.
// Animación (keyframes en globals.css): book-fly lo trae desde la bolsa, después book-open gira la tapa
// sobre el lomo mientras book-center corre el libro para dejarlo centrado ya abierto; al final aparecen las páginas escritas.
// Sin animaciones (movimiento reducido) se muestra directamente abierto: los estilos base son el estado final.
export function BookCreator({ book, onClose }: BookCreatorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const backdropPress = useRef(false);
  // En celulares se ve una página a la vez: el formulario o la descripción.
  const [page, setPage] = useState<Page>("form");
  const dragStart = useRef<number | null>(null);

  useEffect(() => {
    if (!book) return;
    const dialog = dialogRef.current!;
    if (!dialog.open) dialog.showModal();
    // Punto de partida: el libro de la bolsa, medido desde el centro del libro cerrado (el centro del área del libro).
    // offsetLeft/Top no incluyen la animación y son relativos al <dialog>, que ocupa toda la pantalla.
    const fly = flyRef.current!;
    fly.style.setProperty("--from-x", `${book.x - (fly.offsetLeft + fly.offsetWidth / 2)}px`);
    fly.style.setProperty("--from-y", `${book.y - (fly.offsetTop + fly.offsetHeight / 2)}px`);
    fly.style.setProperty("--from-sx", `${book.width / (fly.offsetWidth / 2) || 1}`);
    fly.style.setProperty("--from-sy", `${book.height / fly.offsetHeight || 1}`);
  }, [book]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Nuevo libro"
      onClose={() => {
        setPage("form");
        onClose();
      }}
      // Carrusel en celular: deslizar en cualquier parte (dedo o arrastre con el mouse), también fuera del libro, pasa a la otra página.
      // Las barras de color y los campos de texto usan el gesto horizontal: ahí no cuenta.
      onPointerDown={(event) => {
        // El libro y el botón no cubren toda la pantalla: si el destino es el <dialog> mismo, se tocó el fondo.
        backdropPress.current = event.target === event.currentTarget;
        dragStart.current = (event.target as Element).closest("input, textarea, select") ? null : event.clientX;
      }}
      onPointerUp={(event) => {
        if (dragStart.current === null) return;
        const distance = event.clientX - dragStart.current;
        dragStart.current = null;
        if (Math.abs(distance) >= SWIPE) setPage(distance < 0 ? "comment" : "form");
      }}
      onPointerCancel={() => (dragStart.current = null)}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => {
        // En celular el fondo es para deslizar: solo se cierra con la X.
        if (backdropPress.current && event.target === event.currentTarget && window.matchMedia(WIDE).matches) dialogRef.current?.close();
      }}
      // pt-16: el libro queda debajo del botón de cerrar. Flex centra el libro aunque sea más ancho que la pantalla (celular).
      // touch-pan-y: el gesto horizontal lo manejan los eventos; el vertical sigue haciendo scroll del formulario.
      className="fixed inset-0 m-0 size-full max-h-none max-w-none touch-pan-y items-center justify-center overflow-clip bg-transparent px-0 pb-4 pt-16 backdrop:bg-black/40 open:flex motion-safe:backdrop:animate-[fade-in_0.4s_ease-out_both]"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => dialogRef.current?.close()}
        className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:bg-surface"
      >
        <X aria-hidden="true" className="size-6" />
      </button>
      {/* Se desmonta al cerrar: cada libro nuevo empieza con el formulario vacío. */}
      {book && <OpenBook book={book} page={page} onPage={setPage} ref={flyRef} />}
    </dialog>
  );
}

function OpenBook({ book, page, onPage: setPage, ref }: { book: TakenBook; page: Page; onPage: (page: Page) => void; ref: Ref<HTMLDivElement> }) {
  // null = todavía el color del libro de la bolsa (con su lomo y bordes originales).
  const [cover, setCover] = useState<Hsl | null>(null);
  const [titleColor, setTitleColor] = useState(TITLE_COLOR);
  const [titleFont, setTitleFont] = useState<BookFont>("playfair");
  const [descriptionFont, setDescriptionFont] = useState<BookFont>("lora");
  const [comment, setComment] = useState("");
  const commentId = useId();
  const coverHsl = cover ?? hexToHsl(book.colors.cover);
  const darker = (by: number) => hslColor({ ...coverHsl, l: Math.max(coverHsl.l - by, 0) });
  const colors = cover ? { ...book.colors, cover: hslColor(cover), spine: darker(13), line: darker(18) } : book.colors;

  return (
    <>
      {/* Celular: cada página en proporción 3:4 y el libro abierto más ancho que la pantalla; solo se ve la página actual.
          Con mouse, la página es más angosta para dejar lugar a las flechas a los lados.
          Desde sm: el libro abierto completo, lo más grande que quepa (3:2; en pantallas bajas se estira a lo ancho). */}
      <div
        ref={ref}
        className="h-[min(calc(100dvh-6rem),calc(var(--page)*4/3))] w-[calc(var(--page)*2)] shrink-0 [--page:min(100vw-2rem,28rem)] pointer-fine:[--page:min(100vw-8rem,28rem)] drop-shadow-[0_1.25rem_1.5rem_rgb(0_0_0/0.35)] sm:h-[min(calc(100dvh-5rem),calc(min(100vw-2rem,max((100dvh-5rem)*1.5,40rem))/1.5))] sm:w-[min(calc(100vw-2rem),max(calc((100dvh-5rem)*1.5),40rem))] motion-safe:animate-[book-fly_0.6s_cubic-bezier(0.3,0.7,0.3,1)_both]"
      >
        {/* En celular se corre un cuarto para centrar la página actual. Sin fill final para que la transición al pasar de página funcione.
            Al enfocar un campo de la otra página (con Tab) se pasa a esa página. */}
        <div
          className={`relative size-full perspective-[200rem] transition-transform duration-500 ease-in-out motion-reduce:transition-none sm:[transform:none] motion-safe:animate-[book-center_0.7s_ease-in-out_0.6s_backwards] ${page === "form" ? "[transform:translateX(25%)]" : "[transform:translateX(-25%)]"}`}
        >
          <BookPages colors={colors} className="absolute inset-y-0 right-0 h-full w-1/2" />
          {/* Tapa: gira sobre el lomo. Por fuera es la tapa del libro cerrado; por dentro, la mitad izquierda del libro abierto. */}
          <div className="absolute inset-y-0 right-0 w-1/2 origin-left transform-3d [transform:rotateY(-180deg)] motion-safe:animate-[book-open_0.7s_ease-in-out_0.6s_both]">
            <BookCover colors={colors} className="absolute inset-0 size-full backface-hidden" />
            <BookPages colors={colors} mirrored className="absolute inset-0 size-full backface-hidden [transform:rotateY(180deg)]" />
          </div>

          {/* Lo escrito en las hojas: aparece cuando el libro ya está abierto. Sobre la hoja de arriba de cada página. */}
          <div
            onFocus={() => setPage("form")}
            className={`absolute bottom-[10%] left-[5%] right-1/2 top-[6%] text-(--ink) scheme-light transition-opacity duration-500 sm:pointer-events-auto sm:opacity-100 ${PAGE_FADE_IN} ${page === "form" ? "" : OFF_PAGE}`}
          >
            <div className="size-full overflow-y-auto [scrollbar-width:thin] @container">
              <div className="grid gap-3 p-2 @xs:grid-cols-2 sm:p-4">
                <Field label="Nombre del libro" className="@xs:col-span-2">
                  <input name="title" required maxLength={200} className={FIELD} style={{ fontFamily: fontFamily(titleFont) }} />
                </Field>
                <Field label="Autor" className="@xs:col-span-2">
                  <input name="author" required maxLength={200} className={FIELD} />
                </Field>
                <Field label="Año">
                  <input name="year" type="number" required min={-3000} max={2100} className={FIELD} />
                </Field>
                <Field label="Cantidad de páginas">
                  <input name="pages" type="number" required min={1} max={100000} className={FIELD} />
                </Field>
                <HslSliders legend="Color de la pasta" value={coverHsl} onChange={setCover} />
                <HslSliders
                  legend="Color del título"
                  value={titleColor}
                  onChange={setTitleColor}
                  swatch={
                    <span
                      aria-hidden="true"
                      className="rounded px-1.5 font-bold leading-5"
                      style={{ background: colors.cover, color: hslColor(titleColor), fontFamily: fontFamily(titleFont) }}
                    >
                      Aa
                    </span>
                  }
                />
                <Field label="Fuente del título">
                  <FontSelect name="title_font" value={titleFont} onChange={setTitleFont} />
                </Field>
                <Field label="Fuente de la descripción">
                  <FontSelect name="description_font" value={descriptionFont} onChange={setDescriptionFont} />
                </Field>
                <Field label="Estado" className="@xs:col-span-2">
                  <select name="status" defaultValue="pending" className={FIELD}>
                    {STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          </div>
          <div
            onFocus={() => setPage("comment")}
            className={`absolute bottom-[10%] left-1/2 right-[5%] top-[6%] flex flex-col gap-2 p-2 text-(--ink) scheme-light transition-opacity duration-500 sm:pointer-events-auto sm:p-4 sm:opacity-100 ${PAGE_FADE_IN} ${page === "comment" ? "" : OFF_PAGE}`}
          >
            <label htmlFor={commentId} className="font-semibold sm:text-lg">
              ¿Qué quieres expresar de este libro?
            </label>
            <textarea
              id={commentId}
              name="comment"
              maxLength={COMMENT_MAX}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              aria-describedby={`${commentId}-count`}
              className="min-h-0 flex-1 resize-none rounded-md border border-(--ink)/20 bg-white/40 p-2 text-base outline-none transition [scrollbar-width:thin] focus:border-(--ink)"
              style={{ fontFamily: fontFamily(descriptionFont) }}
            />
            <p id={`${commentId}-count`} className="self-end text-sm">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>
        </div>
      </div>
      {page === "form" ? (
        <button type="button" aria-label="Ver la descripción" onClick={() => setPage("comment")} className={`right-2 ${ARROW}`}>
          <ChevronRight aria-hidden="true" className="size-6" />
        </button>
      ) : (
        <button type="button" aria-label="Ver el formulario" onClick={() => setPage("form")} className={`left-2 ${ARROW}`}>
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
      )}
    </>
  );
}

function FontSelect({ name, value, onChange }: { name: string; value: BookFont; onChange: (font: BookFont) => void }) {
  return (
    <select name={name} value={value} onChange={(event) => onChange(event.target.value as BookFont)} className={FIELD} style={{ fontFamily: fontFamily(value) }}>
      {BOOK_FONTS.map((font) => (
        <option key={font.value} value={font.value} style={{ fontFamily: font.family }}>
          {font.label}
        </option>
      ))}
    </select>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 text-sm font-medium ${className}`}>
      {label}
      {children}
    </label>
  );
}
