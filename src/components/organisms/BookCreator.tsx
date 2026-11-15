"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode, type Ref } from "react";
import { BookCover, BookPages } from "@/components/atoms/BookParts";
import type { TakenBook } from "@/components/atoms/PaperBag";
import { HslSliders } from "@/components/molecules/HslSliders";
import { hexToHsl, hslColor, type Hsl } from "@/lib/colors";

const COMMENT_MAX = 2000;
// Letras claras, como un título dorado sobre la tapa.
const TITLE_COLOR: Hsl = { h: 45, s: 80, l: 90 };
const STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "reading", label: "Leyendo" },
  { value: "finished", label: "Terminado" },
];
// Controles sobre el papel: mismos colores en modo claro y oscuro.
const FIELD = "h-11 w-full min-w-0 rounded-md border border-(--ink)/30 bg-white/60 px-2 text-base outline-none transition focus:border-(--ink)";

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
      onClose={onClose}
      // El libro y el botón no cubren toda la pantalla: si el destino es el <dialog> mismo, se hizo clic en el fondo.
      onPointerDown={(event) => (backdropPress.current = event.target === event.currentTarget)}
      onClick={(event) => {
        if (backdropPress.current && event.target === event.currentTarget) dialogRef.current?.close();
      }}
      // pt-16: el libro queda debajo del botón de cerrar.
      className="fixed inset-0 m-0 size-full max-h-none max-w-none place-items-center overflow-hidden bg-transparent px-0 pb-4 pt-16 backdrop:bg-black/40 open:grid motion-safe:backdrop:animate-[fade-in_0.4s_ease-out_both]"
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
      {book && <OpenBook book={book} ref={flyRef} />}
    </dialog>
  );
}

function OpenBook({ book, ref }: { book: TakenBook; ref: Ref<HTMLDivElement> }) {
  // null = todavía el color del libro de la bolsa (con su lomo y bordes originales).
  const [cover, setCover] = useState<Hsl | null>(null);
  const [titleColor, setTitleColor] = useState(TITLE_COLOR);
  const [comment, setComment] = useState("");
  const commentId = useId();
  const coverHsl = cover ?? hexToHsl(book.colors.cover);
  const darker = (by: number) => hslColor({ ...coverHsl, l: Math.max(coverHsl.l - by, 0) });
  const colors = cover ? { ...book.colors, cover: hslColor(cover), spine: darker(13), line: darker(18) } : book.colors;

  return (
    // Llena el espacio disponible; en pantallas grandes mantiene la proporción 3:2 del libro abierto.
    <div
      ref={ref}
      className="h-[min(calc(100dvh-5rem),42.75rem)] w-[min(calc(100%-1rem),64rem,max(calc((100dvh-5rem)*1.5),40rem))] drop-shadow-[0_1.25rem_1.5rem_rgb(0_0_0/0.35)] motion-safe:animate-[book-fly_0.6s_cubic-bezier(0.3,0.7,0.3,1)_both]"
    >
      <div className="relative size-full perspective-[200rem] motion-safe:animate-[book-center_0.7s_ease-in-out_0.6s_both]">
        <BookPages colors={colors} className="absolute inset-y-0 right-0 h-full w-1/2" />
        {/* Tapa: gira sobre el lomo. Por fuera es la tapa del libro cerrado; por dentro, la mitad izquierda del libro abierto. */}
        <div className="absolute inset-y-0 right-0 w-1/2 origin-left transform-3d [transform:rotateY(-180deg)] motion-safe:animate-[book-open_0.7s_ease-in-out_0.6s_both]">
          <BookCover colors={colors} className="absolute inset-0 size-full backface-hidden" />
          <BookPages colors={colors} mirrored className="absolute inset-0 size-full backface-hidden [transform:rotateY(180deg)]" />
        </div>

        {/* Lo escrito en las hojas: aparece cuando el libro ya está abierto. Sobre la hoja de arriba de cada página. */}
        <div className="absolute bottom-[10%] left-[5%] right-1/2 top-[6%] overflow-y-auto text-(--ink) scheme-light [scrollbar-width:thin] @container motion-safe:animate-[fade-in_0.4s_ease-out_1.3s_both]">
          <div className="grid gap-3 p-2 @xs:grid-cols-2 sm:p-4">
            <Field label="Nombre del libro" className="@xs:col-span-2">
              <input name="title" required maxLength={200} className={FIELD} />
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
                <span aria-hidden="true" className="rounded px-1.5 font-serif font-bold leading-5" style={{ background: colors.cover, color: hslColor(titleColor) }}>
                  Aa
                </span>
              }
            />
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
        <div className="absolute bottom-[10%] left-1/2 right-[5%] top-[6%] flex flex-col gap-2 p-2 text-(--ink) scheme-light sm:p-4 motion-safe:animate-[fade-in_0.4s_ease-out_1.3s_both]">
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
          />
          <p id={`${commentId}-count`} className="self-end text-sm">
            {comment.length}/{COMMENT_MAX}
          </p>
        </div>
      </div>
    </div>
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
