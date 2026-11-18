"use client";

import { Feather } from "lucide-react";
import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState, useTransition, type FormEvent, type ReactNode, type Ref } from "react";
import { flushSync } from "react-dom";
import { BookSpine } from "@/components/atoms/BookSpine";
import type { TakenBook } from "@/components/atoms/PaperBag";
import { Combobox, type ComboboxOption } from "@/components/molecules/Combobox";
import { HslSliders } from "@/components/molecules/HslSliders";
import { BookDialog, BookFrame, bookToShelf, canAnimate, closeBook, findShelvedBook, pageClass, settle, type BookSide } from "@/components/organisms/BookStage";
import { saveBook, type NewBook } from "@/lib/book-actions";
import { BOOK_FONTS, FONT_GROUPS, fontFamily, type BookFont } from "@/lib/book-fonts";
import { BOOK_GENRES, BOOK_STATUSES, bookCategory, type BookCategory } from "@/lib/books";
import { hexToHsl, hslColor, hslToHex, type Hsl } from "@/lib/colors";

const COMMENT_MAX = 2000;
const QUOTE_MAX = 300;
// Desde aquí el contador se pone rojo: avisa que se acerca al límite (al 75 %, en la descripción y en la cita).
const COMMENT_WARNING = 1500;
const QUOTE_WARNING = 225;
// Letras claras, como un título dorado sobre la tapa.
const TITLE_COLOR: Hsl = { h: 45, s: 80, l: 90 };
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

// Libro ya guardado: su id (para encontrarlo en la estantería) y cómo se ve su lomo.
type SavedBook = { id: string; title: string; category: BookCategory; coverColor: string; fontColor: string; titleFont: string };

type BookCreatorProps = {
  // Libro que salió de la bolsa: dónde estaba en pantalla y sus colores; null = cerrado.
  book: TakenBook | null;
  onClose: () => void;
  // Se guardó el libro: quien lo usa muestra la estantería (en celular está en otro panel del carrusel).
  onSaved?: () => void;
};

// Creación de un libro: el libro que salió de la bolsa vuela al centro de la pantalla y se abre (BookFrame con su
// animación de entrada); al final aparecen las páginas escritas.
// Al firmar se guarda el libro; el libro se cierra, gira para mostrar el lomo y vuela a su lugar en la estantería.
export function BookCreator({ book, onClose, onSaved }: BookCreatorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  // Antes de pintar (justo después de que BookDialog abre el modal): sin el punto de partida, el primer cuadro de la
  // animación mostraba el libro en el centro de la pantalla.
  useLayoutEffect(() => {
    if (!book) return;
    // Punto de partida: el libro de la bolsa, medido desde el centro del libro cerrado (el centro del área del libro).
    // offsetLeft/Top no incluyen la animación y son relativos al <dialog>, que ocupa toda la pantalla.
    const fly = flyRef.current!;
    fly.style.setProperty("--from-x", `${book.x - (fly.offsetLeft + fly.offsetWidth / 2)}px`);
    fly.style.setProperty("--from-y", `${book.y - (fly.offsetTop + fly.offsetHeight / 2)}px`);
    fly.style.setProperty("--from-sx", `${book.width / (fly.offsetWidth / 2) || 1}`);
    fly.style.setProperty("--from-sy", `${book.height / fly.offsetHeight || 1}`);
  }, [book]);

  return (
    <BookDialog dialogRef={dialogRef} label="Nuevo libro" showing={book} onClose={onClose}>
      {/* Se desmonta al cerrar: cada libro nuevo empieza con el formulario vacío. */}
      {(side, setSide) =>
        book && <OpenBook book={book} side={side} onSide={setSide} onSaved={onSaved} onShelved={() => dialogRef.current?.close()} ref={flyRef} />
      }
    </BookDialog>
  );
}

type OpenBookProps = {
  book: TakenBook;
  side: BookSide;
  onSide: (side: BookSide) => void;
  onSaved?: () => void;
  // Terminó la animación hacia la estantería: se cierra el modal.
  onShelved: () => void;
  ref: Ref<HTMLDivElement>;
};

function OpenBook({ book, side, onSide, onSaved, onShelved, ref }: OpenBookProps) {
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
  const [quote, setQuote] = useState("");
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
  const quoteId = useId();
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
      quote,
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

  // Animación hacia la estantería. Sin animaciones, cierra al instante.
  const shelve = useEffectEvent(async (id: string) => {
    if (shelving.current) return;
    shelving.current = true;
    const fly = flyRef.current!;
    const dialog = fly.closest("dialog")!;
    const parts = { fly, inner: innerRef.current!, flipper: flipperRef.current!, pages: [formPageRef.current!, commentPageRef.current!] };

    // La página se refrescó al guardar: el lomo del libro nuevo ya está en la estantería. Se esconde hasta que llegue el que vuela.
    const target = await findShelvedBook(id);
    if (target) {
      target.style.visibility = "hidden";
      hiddenSpine.current = target;
    }
    if (canAnimate()) {
      await closeBook(parts);
      if (target) {
        // En celular la estantería entra al carrusel: se espera a que termine de moverse para medir su lugar.
        await settle(target);
        const to = target.getBoundingClientRect();
        flushSync(() => setLanding(to));
        await bookToShelf(parts, spineRef.current!, to, dialog);
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
      <BookFrame
        colors={colors}
        side={side}
        onSide={onSide}
        entrance
        arrows={{ right: "Ver la descripción", left: "Ver el formulario" }}
        flyRef={(element) => {
          flyRef.current = element;
          if (typeof ref === "function") ref(element);
          else if (ref) ref.current = element;
        }}
        innerRef={innerRef}
        flipperRef={flipperRef}
      >
          {/* Lo escrito en las hojas: aparece cuando el libro ya está abierto. Sobre la hoja de arriba de cada página.
              Un solo formulario con las dos páginas; se envía con Firmar. */}
          {/* noValidate: los errores se muestran bajo cada campo; al escribir en un campo se quita su error. */}
          <form onSubmit={sign} onInput={(event) => clearError((event.target as HTMLElement).id)} noValidate aria-label="Datos del libro" className="contents">
            <div ref={formPageRef} onFocus={() => onSide("left")} className={pageClass("left", side, true)}>
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
              onFocus={() => onSide("right")}
              // overflow-y-auto: en pantallas bajas la página hace scroll en vez de aplastar la descripción (mínimo de 4 renglones).
              className={`flex flex-col gap-2 overflow-y-auto p-2 [scrollbar-width:thin] @container sm:p-4 ${pageClass("right", side, true)}`}
            >
              {/* La cita va primero, con pocas líneas; la descripción ocupa el resto de la página. */}
              <label htmlFor={quoteId} className="font-semibold sm:text-lg">
                ¿Tienes alguna cita del libro?
              </label>
              <textarea
                id={quoteId}
                name="quote"
                rows={3}
                maxLength={QUOTE_MAX}
                value={quote}
                onChange={(event) => setQuote(event.target.value)}
                aria-describedby={`${quoteId}-count`}
                // Siempre en Arial: no usa la fuente elegida para la descripción.
                className="shrink-0 resize-none rounded-md border border-(--ink)/20 bg-white/40 p-2 font-[Arial,Helvetica,sans-serif] text-base outline-none transition [scrollbar-width:thin] focus:border-(--ink) @lg:p-3 @lg:text-lg @xl:text-xl"
              />
              <p id={`${quoteId}-count`} className={`self-end text-sm ${quote.length >= QUOTE_WARNING ? "font-semibold text-[#b42318]" : ""}`}>
                {quote.length}/{QUOTE_MAX}
              </p>
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
                className="min-h-28 flex-1 resize-none rounded-md border border-(--ink)/20 bg-white/40 p-2 text-base outline-none transition [scrollbar-width:thin] focus:border-(--ink) @lg:p-3 @lg:text-lg @xl:text-xl"
                style={{ fontFamily: fontFamily(commentFont) }}
              />
              <p id={`${commentId}-count`} className={`self-end text-sm ${comment.length >= COMMENT_WARNING ? "font-semibold text-[#b42318]" : ""}`}>
                {comment.length}/{COMMENT_MAX}
              </p>
            </div>
          </form>
      </BookFrame>
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
