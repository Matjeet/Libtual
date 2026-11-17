"use client";

import { ChevronLeft, ChevronRight, Feather, X } from "lucide-react";
import { useEffect, useEffectEvent, useId, useRef, useState, useTransition, type FormEvent, type ReactNode, type Ref } from "react";
import { flushSync } from "react-dom";
import { BookCover, BookPages } from "@/components/atoms/BookParts";
import { BookSpine } from "@/components/atoms/BookSpine";
import type { TakenBook } from "@/components/atoms/PaperBag";
import { Combobox, type ComboboxOption } from "@/components/molecules/Combobox";
import { HslSliders } from "@/components/molecules/HslSliders";
import { saveBook, type NewBook } from "@/lib/book-actions";
import { BOOK_FONTS, FONT_GROUPS, fontFamily, type BookFont } from "@/lib/book-fonts";
import { BOOK_GENRES, BOOK_STATUSES, bookCategory, type BookCategory } from "@/lib/books";
import { hexToHsl, hslColor, hslToHex, type Hsl } from "@/lib/colors";
import { useHorizontalSwipe } from "@/lib/use-horizontal-swipe";

const COMMENT_MAX = 2000;
// Desde aquí el contador se pone rojo: avisa que se acerca al límite.
const COMMENT_WARNING = 1500;
// Letras claras, como un título dorado sobre la tapa.
const TITLE_COLOR: Hsl = { h: 45, s: 80, l: 90 };
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
// En páginas anchas (libro grande) los campos crecen con la letra.
const FIELD = "h-11 w-full min-w-0 rounded-md border border-(--ink)/30 bg-white/60 px-2 text-base outline-none transition focus:border-(--ink) aria-invalid:border-[#b42318] aria-invalid:ring-1 aria-invalid:ring-[#b42318] @lg:h-12 @lg:px-3 @lg:text-lg";

// Opciones de las listas del formulario. Las fuentes van agrupadas y cada una se escribe con su fuente;
// la descripción no ofrece las que solo sirven para títulos.
const fontOptions = (forComment: boolean): ComboboxOption[] =>
  FONT_GROUPS.flatMap((group) => BOOK_FONTS.filter((font) => font.group === group && !(forComment && "titleOnly" in font))).map(
    (font) => ({ value: font.value, label: font.label, group: font.group, style: { fontFamily: font.family } }),
  );
const TITLE_FONTS = fontOptions(false);
const COMMENT_FONTS = fontOptions(true);
const GENRES = BOOK_GENRES.map((genre) => ({ value: genre, label: genre }));

// Las listas ocupan la fila entera hasta que la página es ancha (@md): en media columna no se leían los nombres largos.
const LIST_FIELD = "@xs:col-span-2 @md:col-span-1";

// Mensaje bajo un campo que no se puede guardar así (en vez del globo del navegador).
function fieldError(input: HTMLInputElement) {
  if (input.required && !input.value.trim()) return "Este campo es obligatorio.";
  if (input.validity.valid) return undefined;
  if (input.validity.stepMismatch) return "Escribe un número entero.";
  return `Escribe un número entre ${input.min} y ${input.max}.`;
}

type Page = "form" | "comment";
// Libro ya guardado: su id (para encontrarlo en la estantería) y cómo se ve su lomo.
type SavedBook = { id: string; title: string; category: BookCategory; coverColor: string; fontColor: string; titleFont: string };

type BookCreatorProps = {
  // Libro que salió de la bolsa: dónde estaba en pantalla y sus colores; null = cerrado.
  book: TakenBook | null;
  onClose: () => void;
  // Se guardó el libro: quien lo usa muestra la estantería (en celular está en otro panel del carrusel).
  onSaved?: () => void;
};

// Creación de un libro: el libro que salió de la bolsa vuela al centro de la pantalla y se abre.
// Animación (keyframes en globals.css): book-fly lo trae desde la bolsa, después book-open gira la tapa
// sobre el lomo mientras book-center corre el libro para dejarlo centrado ya abierto; al final aparecen las páginas escritas.
// Sin animaciones (movimiento reducido) se muestra directamente abierto: los estilos base son el estado final.
// Al firmar se guarda el libro; el libro se cierra, gira para mostrar el lomo y vuela a su lugar en la estantería.
export function BookCreator({ book, onClose, onSaved }: BookCreatorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const backdropPress = useRef(false);
  // En celulares se ve una página a la vez: el formulario o la descripción.
  const [page, setPage] = useState<Page>("form");
  const dragStart = useRef<number | null>(null);
  // Sin esto, en Chrome para celular el primer toque después de deslizar no hace nada.
  useHorizontalSwipe(dialogRef);

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
      {book && <OpenBook book={book} page={page} onPage={setPage} onSaved={onSaved} onShelved={() => dialogRef.current?.close()} ref={flyRef} />}
    </dialog>
  );
}

type OpenBookProps = {
  book: TakenBook;
  page: Page;
  onPage: (page: Page) => void;
  onSaved?: () => void;
  // Terminó la animación hacia la estantería: se cierra el modal.
  onShelved: () => void;
  ref: Ref<HTMLDivElement>;
};

function OpenBook({ book, page, onPage: setPage, onSaved, onShelved, ref }: OpenBookProps) {
  // null = todavía el color del libro de la bolsa (con su lomo y bordes originales).
  const [cover, setCover] = useState<Hsl | null>(null);
  const [titleColor, setTitleColor] = useState(TITLE_COLOR);
  const [titleFont, setTitleFont] = useState<BookFont>("playfair");
  const [commentFont, setCommentFont] = useState<BookFont>("lora");
  const [genre, setGenre] = useState("");
  const [status, setStatus] = useState("pending");
  // Errores de los campos, por id del input.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [comment, setComment] = useState("");
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState<SavedBook | null>(null);
  // Lugar del libro nuevo en la estantería (en pantalla): ahí se dibuja el lomo que vuela.
  const [landing, setLanding] = useState<DOMRect | null>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const flipperRef = useRef<HTMLDivElement>(null);
  const formPageRef = useRef<HTMLDivElement>(null);
  const commentPageRef = useRef<HTMLDivElement>(null);
  const spineRef = useRef<HTMLDivElement>(null);
  const shelving = useRef(false);
  // Lomo real del libro nuevo, escondido mientras vuela el de la animación.
  const hiddenSpine = useRef<HTMLElement | null>(null);
  const commentId = useId();
  const fieldId = useId();
  const coverHsl = cover ?? hexToHsl(book.colors.cover);
  const darker = (by: number) => hslColor({ ...coverHsl, l: Math.max(coverHsl.l - by, 0) });
  const colors = cover ? { ...book.colors, cover: hslColor(cover), spine: darker(13), line: darker(18) } : book.colors;

  // Props del input de un campo: su id y, si tiene error, cómo anunciarlo.
  const field = (name: string) => {
    const id = `${fieldId}-${name}`;
    return { id, "aria-invalid": fieldErrors[id] ? true : undefined, "aria-describedby": fieldErrors[id] ? `${id}-error` : undefined };
  };
  // Etiqueta del campo y su mensaje de error.
  const label = (name: string) => ({ htmlFor: `${fieldId}-${name}`, error: fieldErrors[`${fieldId}-${name}`] });
  const clearError = (id: string) =>
    setFieldErrors((errors) => (id in errors ? Object.fromEntries(Object.entries(errors).filter(([key]) => key !== id)) : errors));

  function sign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    for (const element of event.currentTarget.elements) {
      const message = element instanceof HTMLInputElement && element.id ? fieldError(element) : undefined;
      if (message) errors[element.id] = message;
    }
    setFieldErrors(errors);
    const [first] = Object.keys(errors);
    if (first) return document.getElementById(first)?.focus();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "");
    const newBook: NewBook = {
      title: text("title"),
      author: text("author"),
      genre: text("genre"),
      year: Number(text("year")),
      pages: Number(text("pages")),
      // Si no se movieron las barras, se guarda el color exacto del libro que salió de la bolsa.
      coverColor: cover ? hslToHex(cover) : book.colors.cover,
      fontColor: hslToHex(titleColor),
      titleFont,
      commentFont,
      status: text("status"),
      comment,
    };
    setError(undefined);
    startSaving(async () => {
      const result = await saveBook(newBook);
      startSaving(() => {
        if (!result.id) return setError(result.error);
        onSaved?.();
        setSaved({
          id: result.id,
          title: newBook.title.trim(),
          category: bookCategory(newBook.pages),
          coverColor: newBook.coverColor,
          fontColor: newBook.fontColor,
          titleFont,
        });
      });
    });
  }

  // Animación hacia la estantería (Web Animations API, para encadenar los pasos). Sin animaciones, cierra al instante.
  const shelve = useEffectEvent(async (id: string) => {
    if (shelving.current) return;
    shelving.current = true;
    const fly = flyRef.current!;
    const dialog = fly.closest("dialog")!;
    const animated = typeof dialog.animate === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const run = (element: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes, options: KeyframeAnimationOptions) =>
      element.animate(keyframes, { fill: "forwards", ...options }).finished;

    // La página se refrescó al guardar: el lomo del libro nuevo ya está en la estantería. Se esconde hasta que llegue el que vuela.
    const target = await findShelvedBook(id);
    if (target) {
      target.style.visibility = "hidden";
      hiddenSpine.current = target;
    }
    if (animated) {
      // 1. Se borra lo escrito y el libro se cierra (al revés de como se abrió).
      const inner = innerRef.current!;
      const pages = [formPageRef.current!, commentPageRef.current!];
      await Promise.all([
        ...pages.map((page) => run(page, { opacity: [getComputedStyle(page).opacity, "0"] }, { duration: 200 })),
        run(flipperRef.current!, { transform: ["rotateY(-180deg)", "rotateY(0deg)"] }, { duration: 600, delay: 150, easing: "ease-in-out" }),
        run(inner, { transform: [getComputedStyle(inner).transform, "translateX(-25%)"] }, { duration: 600, delay: 150, easing: "ease-in-out" }),
      ]);
      if (target) {
        // En celular la estantería entra al carrusel: se espera a que termine de moverse para medir su lugar.
        await settle(target);
        const from = flipperRef.current!.getBoundingClientRect();
        const to = target.getBoundingClientRect();
        flushSync(() => setLanding(to));
        const dx = from.left + from.width / 2 - (to.left + to.width / 2);
        const dy = from.top + from.height / 2 - (to.top + to.height / 2);
        const scale = from.height / to.height;
        const at = (x: number, y: number, s: number, turn: number) => `translate(${x}px, ${y}px) scale(${s}) perspective(60rem) rotateY(${turn}deg)`;
        // 2. El libro gira: la tapa se va de canto y aparece el lomo, que vuela a su lugar mientras se aclara el fondo.
        await Promise.all([
          run(fly, { transform: ["perspective(60rem) rotateY(0deg)", "perspective(60rem) rotateY(90deg)"] }, { duration: 250, easing: "ease-in" }),
          run(
            spineRef.current!,
            [
              { offset: 0, transform: at(dx, dy, scale, -90) },
              { offset: 0.2, transform: at(dx, dy, scale, -90), easing: "ease-out" },
              { offset: 0.4, transform: at(dx, dy, scale, 0), easing: "cubic-bezier(0.5, 0, 0.3, 1)" },
              { offset: 1, transform: at(0, 0, 1, 0) },
            ],
            { duration: 1250 },
          ),
          run(dialog, { opacity: [1, 0] }, { duration: 500, delay: 750, pseudoElement: "::backdrop" }),
        ]);
      }
    }
    reveal();
    onShelved();
  });

  function reveal() {
    if (hiddenSpine.current) hiddenSpine.current.style.visibility = "";
    hiddenSpine.current = null;
  }

  // Empieza cuando la página ya se refrescó con el libro nuevo (la transición del guardado terminó).
  useEffect(() => {
    if (saved && !saving) shelve(saved.id);
  }, [saved, saving]);

  // Si se cierra a mitad de la animación, el lomo real no queda escondido.
  useEffect(() => reveal, []);

  return (
    <>
      {/* Celular: cada página en proporción 3:4 y el libro abierto más ancho que la pantalla; solo se ve la página actual.
          Con mouse, la página es más angosta para dejar lugar a las flechas a los lados.
          Desde sm: el libro abierto completo, lo más grande que quepa (3:2; en pantallas bajas se estira a lo ancho). */}
      <div
        ref={(element) => {
          flyRef.current = element;
          if (typeof ref === "function") ref(element);
          else if (ref) ref.current = element;
        }}
        className="h-[min(calc(100dvh-6rem),calc(var(--page)*4/3))] w-[calc(var(--page)*2)] shrink-0 [--page:min(100vw-2rem,28rem)] pointer-fine:[--page:min(100vw-8rem,28rem)] drop-shadow-[0_1.25rem_1.5rem_rgb(0_0_0/0.35)] sm:h-[min(calc(100dvh-5rem),calc(min(100vw-2rem,max((100dvh-5rem)*1.5,40rem))/1.5))] sm:w-[min(calc(100vw-2rem),max(calc((100dvh-5rem)*1.5),40rem))] motion-safe:animate-[book-fly_0.6s_cubic-bezier(0.3,0.7,0.3,1)_both]"
      >
        {/* En celular se corre un cuarto para centrar la página actual. Sin fill final para que la transición al pasar de página funcione.
            Al enfocar un campo de la otra página (con Tab) se pasa a esa página. */}
        <div
          ref={innerRef}
          className={`relative size-full perspective-[200rem] transition-transform duration-500 ease-in-out motion-reduce:transition-none sm:[transform:none] motion-safe:animate-[book-center_0.7s_ease-in-out_0.6s_backwards] ${page === "form" ? "[transform:translateX(25%)]" : "[transform:translateX(-25%)]"}`}
        >
          <BookPages colors={colors} className="absolute inset-y-0 right-0 h-full w-1/2" />
          {/* Tapa: gira sobre el lomo. Por fuera es la tapa del libro cerrado; por dentro, la mitad izquierda del libro abierto. */}
          <div ref={flipperRef} className="absolute inset-y-0 right-0 w-1/2 origin-left transform-3d [transform:rotateY(-180deg)] motion-safe:animate-[book-open_0.7s_ease-in-out_0.6s_both]">
            <BookCover colors={colors} className="absolute inset-0 size-full backface-hidden" />
            <BookPages colors={colors} mirrored className="absolute inset-0 size-full backface-hidden [transform:rotateY(180deg)]" />
          </div>

          {/* Lo escrito en las hojas: aparece cuando el libro ya está abierto. Sobre la hoja de arriba de cada página.
              Un solo formulario con las dos páginas; se envía con Firmar. */}
          {/* noValidate: los errores se muestran bajo cada campo; al escribir en un campo se quita su error. */}
          <form onSubmit={sign} onInput={(event) => clearError((event.target as HTMLElement).id)} noValidate aria-label="Datos del libro" className="contents">
            <div
              ref={formPageRef}
              onFocus={() => setPage("form")}
              className={`absolute bottom-[10%] left-[5%] right-1/2 top-[6%] text-(--ink) scheme-light transition-opacity duration-500 sm:pointer-events-auto sm:opacity-100 ${PAGE_FADE_IN} ${page === "form" ? "" : OFF_PAGE}`}
            >
              <div className="size-full overflow-y-auto [scrollbar-width:thin] @container">
                {/* min-h-full + content-evenly: si sobra alto (libro grande), las filas se reparten en toda la página en vez de quedar arriba.
                    Cuando no cabe, no sobra espacio y la página hace scroll como siempre. */}
                <div className="grid min-h-full content-evenly gap-3 p-2 text-sm @xs:grid-cols-2 sm:p-4 @lg:gap-x-6 @lg:text-base">
                  <Field label="Nombre del libro" className="@xs:col-span-2" {...label("title")}>
                    <input name="title" required maxLength={200} {...field("title")} className={FIELD} style={{ fontFamily: fontFamily(titleFont) }} />
                  </Field>
                  <Field label="Autor" className="@xs:col-span-2" {...label("author")}>
                    <input name="author" required maxLength={200} {...field("author")} className={FIELD} />
                  </Field>
                  <Field label="Año" {...label("year")}>
                    <input name="year" type="number" required min={-3000} max={2100} {...field("year")} className={FIELD} />
                  </Field>
                  <Field label="Cantidad de páginas" {...label("pages")}>
                    <input name="pages" type="number" required min={1} max={100000} {...field("pages")} className={FIELD} />
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
                  {/* Listas editables: escribir filtra las opciones. El género además acepta uno que no esté en la lista. */}
                  <Field label="Fuente del título" className={LIST_FIELD} htmlFor={`${fieldId}-title-font`}>
                    <Combobox
                      id={`${fieldId}-title-font`}
                      name="title_font"
                      options={TITLE_FONTS}
                      value={titleFont}
                      onChange={(font) => setTitleFont(font as BookFont)}
                      listLabel="Fuentes"
                      className={FIELD}
                      style={{ fontFamily: fontFamily(titleFont) }}
                    />
                  </Field>
                  <Field label="Fuente de la descripción" className={LIST_FIELD} htmlFor={`${fieldId}-comment-font`}>
                    <Combobox
                      id={`${fieldId}-comment-font`}
                      name="comment_font"
                      options={COMMENT_FONTS}
                      value={commentFont}
                      onChange={(font) => setCommentFont(font as BookFont)}
                      listLabel="Fuentes"
                      className={FIELD}
                      style={{ fontFamily: fontFamily(commentFont) }}
                    />
                  </Field>
                  <Field label="Género" className={LIST_FIELD} {...label("genre")}>
                    <Combobox
                      id={`${fieldId}-genre`}
                      name="genre"
                      options={GENRES}
                      value={genre}
                      onChange={(value) => {
                        setGenre(value);
                        clearError(`${fieldId}-genre`);
                      }}
                      invalid={Boolean(fieldErrors[`${fieldId}-genre`])}
                      describedBy={`${fieldId}-genre-error`}
                      listLabel="Géneros"
                      allowCustom
                      required
                      maxLength={100}
                      className={FIELD}
                    />
                  </Field>
                  <Field label="Estado" className={LIST_FIELD} htmlFor={`${fieldId}-status`}>
                    <Combobox
                      id={`${fieldId}-status`}
                      name="status"
                      options={BOOK_STATUSES}
                      value={status}
                      onChange={setStatus}
                      listLabel="Estados"
                      className={FIELD}
                    />
                  </Field>
                  {/* Al final de la hoja, donde se firma. Colores fijos: va sobre el papel en modo claro y oscuro. */}
                  <div className="flex flex-col items-end gap-2 @xs:col-span-2">
                    {error && (
                      <p role="alert" className="text-[#b42318]">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={saving || saved !== null}
                      className="group inline-flex h-11 items-center gap-2 rounded-full bg-(--ink) px-5 font-semibold text-[#fdfaf5] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 @lg:h-12 @lg:px-6 @lg:text-lg"
                    >
                      {saving ? "Firmando..." : "Firmar"}
                      {/* Con el mouse encima, la pluma escribe (keyframes feather-write en globals.css); no mientras se guarda. */}
                      <Feather
                        aria-hidden="true"
                        className="size-5 origin-bottom-left motion-safe:group-hover:group-enabled:animate-[feather-write_0.9s_ease-in-out_infinite]"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div
              ref={commentPageRef}
              onFocus={() => setPage("comment")}
              className={`absolute bottom-[10%] left-1/2 right-[5%] top-[6%] flex flex-col gap-2 p-2 text-(--ink) scheme-light @container transition-opacity duration-500 sm:pointer-events-auto sm:p-4 sm:opacity-100 ${PAGE_FADE_IN} ${page === "comment" ? "" : OFF_PAGE}`}
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
                // En páginas anchas (libro grande) la letra crece con la hoja, como en el formulario.
                className="min-h-0 flex-1 resize-none rounded-md border border-(--ink)/20 bg-white/40 p-2 text-base outline-none transition [scrollbar-width:thin] focus:border-(--ink) @lg:p-3 @lg:text-lg @xl:text-xl"
                style={{ fontFamily: fontFamily(commentFont) }}
              />
              <p id={`${commentId}-count`} className={`self-end text-sm ${comment.length >= COMMENT_WARNING ? "font-semibold text-[#b42318]" : ""}`}>
                {comment.length}/{COMMENT_MAX}
              </p>
            </div>
          </form>
        </div>
      </div>
      {/* Lomo que vuela a la estantería: se dibuja en el lugar final y la animación lo trae desde el libro cerrado. */}
      {saved && landing && (
        <div ref={spineRef} aria-hidden="true" className="absolute" style={{ left: landing.left, top: landing.top }}>
          <BookSpine
            title={saved.title}
            category={saved.category}
            coverColor={saved.coverColor}
            fontColor={saved.fontColor}
            titleFont={saved.titleFont}
          />
        </div>
      )}
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

// Etiqueta, control y, debajo, el mensaje de error (id `${htmlFor}-error`, al que apunta el aria-describedby del control).
// La etiqueta no envuelve el control: así el texto de las listas no se suma al nombre del campo.
function Field({ label, htmlFor, error, className = "", children }: { label: string; htmlFor: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 font-medium ${className}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="font-normal text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
}

// El lomo del libro guardado en la estantería. Lo busca unos instantes por si la página todavía se está refrescando.
async function findShelvedBook(id: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const spine = document.querySelector<HTMLElement>(`[data-book-id="${id}"] > *`);
    if (spine) return spine;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

// Espera a que terminen las animaciones de los contenedores del elemento (por ejemplo, el carrusel de la habitación).
function settle(element: Element) {
  const animations: Animation[] = [];
  for (let node: Element | null = element; node; node = node.parentElement) animations.push(...(node.getAnimations?.() ?? []));
  return Promise.all(animations.filter((animation) => animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => {})));
}
