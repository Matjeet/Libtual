"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { BookCover, BookPages } from "@/components/atoms/BookParts";
import type { TakenBook } from "@/components/atoms/PaperBag";

type BookCreatorProps = {
  // Libro que salió de la bolsa: dónde estaba en pantalla y sus colores; null = cerrado.
  book: TakenBook | null;
  onClose: () => void;
};

// Creación de un libro: el libro que salió de la bolsa vuela al centro de la pantalla y se abre.
// Animación (keyframes en globals.css): book-fly lo trae desde la bolsa, después book-open gira la tapa
// sobre el lomo mientras book-center corre el libro para dejarlo centrado ya abierto.
// Sin animaciones (movimiento reducido) se muestra directamente abierto: los estilos base son el estado final.
export function BookCreator({ book, onClose }: BookCreatorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);
  const backdropPress = useRef(false);

  useEffect(() => {
    if (!book) return;
    const dialog = dialogRef.current!;
    if (!dialog.open) dialog.showModal();
    // Punto de partida: el libro de la bolsa, medido desde el centro del libro cerrado (el centro de la pantalla).
    const fly = flyRef.current!;
    fly.style.setProperty("--from-x", `${book.x - dialog.clientWidth / 2}px`);
    fly.style.setProperty("--from-y", `${book.y - dialog.clientHeight / 2}px`);
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
      className="fixed inset-0 m-0 size-full max-h-none max-w-none place-items-center overflow-hidden bg-transparent p-0 backdrop:bg-black/40 open:grid motion-safe:backdrop:animate-[fade-in_0.4s_ease-out_both]"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={() => dialogRef.current?.close()}
        className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:bg-surface"
      >
        <X aria-hidden="true" className="size-6" />
      </button>
      {book && (
        <div
          ref={flyRef}
          className="aspect-[3/2] w-[min(calc(100%-2rem),42rem,calc((100dvh-8rem)*1.5))] drop-shadow-[0_1.25rem_1.5rem_rgb(0_0_0/0.35)] motion-safe:animate-[book-fly_0.6s_cubic-bezier(0.3,0.7,0.3,1)_both]"
        >
          <div className="relative size-full perspective-[200rem] motion-safe:animate-[book-center_0.7s_ease-in-out_0.6s_both]">
            <BookPages colors={book.colors} className="absolute inset-y-0 right-0 h-full w-1/2" />
            {/* Tapa: gira sobre el lomo. Por fuera es la tapa del libro cerrado; por dentro, la mitad izquierda del libro abierto. */}
            <div className="absolute inset-y-0 right-0 w-1/2 origin-left transform-3d [transform:rotateY(-180deg)] motion-safe:animate-[book-open_0.7s_ease-in-out_0.6s_both]">
              <BookCover colors={book.colors} className="absolute inset-0 size-full backface-hidden" />
              <BookPages colors={book.colors} mirrored className="absolute inset-0 size-full backface-hidden [transform:rotateY(180deg)]" />
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
