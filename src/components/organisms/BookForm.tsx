"use client";

import { Feather } from "lucide-react";
import { useId, useState, type FormEvent, type ReactNode, type Ref } from "react";
import { Combobox, type ComboboxOption } from "@/components/molecules/Combobox";
import { HslSliders } from "@/components/molecules/HslSliders";
import { pageClass, type BookSide } from "@/components/organisms/BookStage";
import type { NewBook } from "@/lib/book-actions";
import { BOOK_FONTS, FONT_GROUPS, fontFamily, type BookFont } from "@/lib/book-fonts";
import { BOOK_GENRES, BOOK_STATUSES } from "@/lib/books";
import { hexToHsl, hslColor, hslToHex, type Hsl } from "@/lib/colors";

const COMMENT_MAX = 4000;
const QUOTE_MAX = 300;
// Desde aquí el contador se pone rojo: avisa que se acerca al límite (al 75 %, en la descripción y en la cita).
const COMMENT_WARNING = 3000;
const QUOTE_WARNING = 225;
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

// Lo que el formulario muestra al abrirse: vacío al crear un libro, lo guardado al editarlo.
export type BookFormInitial = {
  title: string;
  author: string;
  year: number | "";
  pages: number | "";
  titleFont: BookFont;
  commentFont: BookFont;
  genre: string;
  status: string;
  comment: string;
  quote: string;
};

// Cómo se ve el libro mientras se escribe: el color de la pasta (null = todavía sin mover) y el estado (el separador).
export type BookLook = { cover: Hsl | null; status: string };

type BookFormProps = {
  initial: BookFormInitial;
  // Colores de partida ("#rrggbb"): si no se mueven sus barras, se guardan iguales.
  coverColor: string;
  titleColor: string;
  side: BookSide;
  onSide: (side: BookSide) => void;
  // true: lo escrito aparece con la animación de entrada del libro (al crearlo).
  entrance: boolean;
  leftRef: Ref<HTMLDivElement>;
  rightRef: Ref<HTMLDivElement>;
  // La página izquierda todavía no se ve (mientras se pasa la página para editar, la cubre la hoja que gira).
  leftHidden?: boolean;
  onLook: (look: BookLook) => void;
  // Se firmó con todos los campos válidos.
  onSign: (book: NewBook) => void;
  saving: boolean;
  // Ya firmado: no se puede volver a firmar.
  locked: boolean;
  error?: string;
};

// El formulario del libro abierto, el mismo al crear y al editar: en la página izquierda los datos (con las barras de
// color y las listas) y Firmar; en la derecha la cita y la descripción. Va dentro de BookFrame.
export function BookForm(props: BookFormProps) {
  const { initial, coverColor, titleColor: baseTitle, side, onSide, entrance, leftRef, rightRef, leftHidden, onLook, onSign, saving, locked, error } = props;
  const [cover, setCover] = useState<Hsl | null>(null);
  const [titleColor, setTitleColor] = useState<Hsl | null>(null);
  const [titleFont, setTitleFont] = useState(initial.titleFont);
  const [commentFont, setCommentFont] = useState(initial.commentFont);
  const [genre, setGenre] = useState(initial.genre);
  const [status, setStatus] = useState(initial.status);
  // Errores de los campos, por id del input.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [comment, setComment] = useState(initial.comment);
  const [quote, setQuote] = useState(initial.quote);
  const commentId = useId();
  const quoteId = useId();
  const fieldId = useId();
  const coverHsl = cover ?? hexToHsl(coverColor);
  const titleHsl = titleColor ?? hexToHsl(baseTitle);

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
    onSign({
      title: text("title"),
      author: text("author"),
      genre: text("genre"),
      year: Number(text("year")),
      pages: Number(text("pages")),
      // Si no se movieron las barras, se guarda el color de partida exacto.
      coverColor: cover ? hslToHex(cover) : coverColor,
      fontColor: titleColor ? hslToHex(titleColor) : baseTitle,
      titleFont,
      commentFont,
      status: text("status"),
      comment,
      quote,
    });
  }

  return (
    // Lo escrito en las hojas, sobre la hoja de arriba de cada página. Un solo formulario con las dos páginas; se envía
    // con Firmar. noValidate: los errores se muestran bajo cada campo; al escribir en un campo se quita su error.
    <form onSubmit={sign} onInput={(event) => clearError((event.target as HTMLElement).id)} noValidate aria-label="Datos del libro" className="contents">
      <div ref={leftRef} onFocus={() => onSide("left")} className={`${pageClass("left", side, entrance)} ${leftHidden ? "invisible" : ""}`}>
        <div className="size-full overflow-y-auto [scrollbar-width:thin] @container">
          {/* min-h-full + content-evenly: si sobra alto (libro grande), las filas se reparten en toda la página en vez de quedar arriba.
              Cuando no cabe, no sobra espacio y la página hace scroll como siempre. */}
          <div className="grid min-h-full content-evenly gap-3 p-2 text-sm @xs:grid-cols-2 sm:p-4 @lg:gap-x-6 @lg:text-base">
            <Field label="Nombre del libro" className="@xs:col-span-2" {...label("title")}>
              <input name="title" required maxLength={200} defaultValue={initial.title} {...field("title")} className={FIELD} style={{ fontFamily: fontFamily(titleFont) }} />
            </Field>
            <Field label="Autor" className="@xs:col-span-2" {...label("author")}>
              <input name="author" required maxLength={200} defaultValue={initial.author} {...field("author")} className={FIELD} />
            </Field>
            <Field label="Año" {...label("year")}>
              <input name="year" type="number" required min={-3000} max={2100} defaultValue={initial.year} {...field("year")} className={FIELD} />
            </Field>
            <Field label="Cantidad de páginas" {...label("pages")}>
              <input name="pages" type="number" required min={1} max={100000} defaultValue={initial.pages} {...field("pages")} className={FIELD} />
            </Field>
            <HslSliders
              legend="Color de la pasta"
              value={coverHsl}
              onChange={(value) => {
                setCover(value);
                onLook({ cover: value, status });
              }}
            />
            <HslSliders
              legend="Color del título"
              value={titleHsl}
              onChange={setTitleColor}
              swatch={
                <span
                  aria-hidden="true"
                  className="rounded px-1.5 font-bold leading-5"
                  style={{ background: hslColor(coverHsl), color: hslColor(titleHsl), fontFamily: fontFamily(titleFont) }}
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
            <Field label="Fuente del comentario" className={LIST_FIELD} htmlFor={`${fieldId}-comment-font`}>
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
                onChange={(value) => {
                  setStatus(value);
                  onLook({ cover, status: value });
                }}
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
                disabled={saving || locked}
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-(--ink) px-5 font-semibold text-[#fdfaf5] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 @lg:h-12 @lg:px-6 @lg:text-lg"
              >
                {saving ? "Firmando..." : "Firmar"}
                {/* Con el mouse encima, la pluma escribe (keyframes feather-write en globals.css); no mientras se guarda. */}
                <Feather aria-hidden="true" className="size-5 origin-bottom-left motion-safe:group-hover:group-enabled:animate-[feather-write_0.9s_ease-in-out_infinite]" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        ref={rightRef}
        onFocus={() => onSide("right")}
        // overflow-y-auto: en pantallas bajas la página hace scroll en vez de aplastar la descripción (mínimo de 4 renglones).
        className={`flex flex-col gap-2 overflow-y-auto p-2 [scrollbar-width:thin] @container sm:p-4 ${pageClass("right", side, entrance)}`}
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
          className="shrink-0 resize-none rounded-md border border-(--ink)/20 bg-white/40 p-2 pr-4 font-[Arial,Helvetica,sans-serif] text-base outline-none transition [scrollbar-width:thin] focus:border-(--ink) @lg:p-3 @lg:pr-5 @lg:text-lg @xl:text-xl"
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
          className="min-h-28 flex-1 resize-none rounded-md border border-(--ink)/20 bg-white/40 p-2 pr-4 text-base outline-none transition [scrollbar-width:thin] focus:border-(--ink) @lg:p-3 @lg:pr-5 @lg:text-lg @xl:text-xl"
          style={{ fontFamily: fontFamily(commentFont) }}
        />
        <p id={`${commentId}-count`} className={`self-end text-sm ${comment.length >= COMMENT_WARNING ? "font-semibold text-[#b42318]" : ""}`}>
          {comment.length}/{COMMENT_MAX}
        </p>
      </div>
    </form>
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
