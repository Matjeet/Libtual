"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, useTransition, type Ref } from "react";
import { flushSync } from "react-dom";
import { BookSpine } from "@/components/atoms/BookSpine";
import type { TakenBook } from "@/components/atoms/PaperBag";
import { BookForm, type BookFormInitial, type BookLook } from "@/components/organisms/BookForm";
import { BookDialog, BookFrame, bookToShelf, canAnimate, closeBook, findShelvedBook, settle, type BookSide } from "@/components/organisms/BookStage";
import { saveBook, type NewBook } from "@/lib/book-actions";
import { bookCategory, bookmarkColor, type BookCategory } from "@/lib/books";
import { hslColor, hslToHex, type Hsl } from "@/lib/colors";

// Letras claras, como un título dorado sobre la tapa.
const TITLE_COLOR: Hsl = { h: 45, s: 80, l: 90 };
// Un libro nuevo empieza con el formulario vacío.
const EMPTY: BookFormInitial = {
  title: "",
  author: "",
  year: "",
  pages: "",
  titleFont: "playfair",
  commentFont: "lora",
  genre: "",
  status: "pending",
  comment: "",
  quote: "",
};

// Libro ya guardado: su id (para encontrarlo en la estantería) y cómo se ve su lomo.
type SavedBook = { id: string; title: string; category: BookCategory; coverColor: string; fontColor: string; titleFont: string; status: string };

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
  // Color de la pasta (null = todavía el del libro de la bolsa, con su lomo y bordes originales) y estado elegidos.
  const [look, setLook] = useState<BookLook>({ cover: null, status: EMPTY.status });
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
  const { cover } = look;
  const darker = (by: number) => hslColor({ ...cover!, l: Math.max(cover!.l - by, 0) });
  const colors = cover ? { ...book.colors, cover: hslColor(cover), spine: darker(13), line: darker(18) } : book.colors;

  function sign(newBook: NewBook) {
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
          titleFont: newBook.titleFont,
          status: newBook.status,
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
        bookmark={bookmarkColor(look.status)}
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
        {/* Lo escrito en las hojas: aparece cuando el libro ya está abierto. */}
        <BookForm
          initial={EMPTY}
          coverColor={book.colors.cover}
          titleColor={hslToHex(TITLE_COLOR)}
          side={side}
          onSide={onSide}
          entrance
          leftRef={formPageRef}
          rightRef={commentPageRef}
          onLook={setLook}
          onSign={sign}
          saving={saving}
          locked={saved !== null}
          error={error}
        />
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
            status={saved.status}
          />
        </div>
      )}
    </>
  );
}
