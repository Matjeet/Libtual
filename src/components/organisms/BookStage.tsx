"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLayoutEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from "react";
import { BookCover, BookPages, type BookColors } from "@/components/atoms/BookParts";
import { useHorizontalSwipe } from "@/lib/use-horizontal-swipe";

// Lo que comparten crear un libro (BookCreator) y verlo (BookViewer): el modal, el libro abierto con sus tamaños y su
// carrusel en celular, y los vuelos entre el libro y su lomo en la estantería.

// Página que se ve en celular (una a la vez); desde sm se ven las dos.
export type BookSide = "left" | "right";

// Desde sm se ve el libro completo; por debajo, una página a la vez.
const WIDE = "(min-width: 40rem)";
// Distancia mínima (px) de un deslizamiento para pasar de página, como en el carrusel de la habitación.
const SWIPE = 40;
// Flechas para pasar de página: solo con mouse y en celular (con el dedo se desliza).
const ARROW =
  "absolute top-[calc(50%+1.5rem)] hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card text-foreground shadow-md ring-1 ring-foreground/10 transition hover:bg-surface pointer-fine:flex sm:pointer-fine:hidden";
// Página que no está en pantalla en celular: su borde asoma, pero sin controles visibles ni tocables.
// Sigue en el orden de Tab: al enfocarla se pasa a ella.
const OFF_PAGE = "pointer-events-none opacity-0";
// Lo escrito aparece cuando el libro ya se abrió. Sin fill final, para que la transición de opacidad al pasar de página funcione.
const PAGE_FADE_IN = "motion-safe:animate-[fade-in_0.4s_ease-out_1.3s_backwards]";
const PAGE_BOX = { left: "left-[5%] right-1/2", right: "left-1/2 right-[5%]" };

// Lugar de lo escrito sobre la hoja de cada página. entrance: aparece con la animación de entrada en CSS (crear un libro).
export function pageClass(side: BookSide, current: BookSide, entrance: boolean) {
  return `absolute bottom-[10%] top-[6%] ${PAGE_BOX[side]} text-(--ink) scheme-light transition-opacity duration-500 sm:pointer-events-auto sm:opacity-100 ${entrance ? PAGE_FADE_IN : ""} ${side === current ? "" : OFF_PAGE}`;
}

type BookDialogProps = {
  dialogRef: RefObject<HTMLDialogElement | null>;
  label: string;
  // Lo que se muestra (el libro); null = cerrado. Cada libro distinto vuelve a abrir el modal.
  showing: object | null;
  onClose: () => void;
  // Si se da, la X, el fondo y Escape no cierran: avisan, y quien lo usa cierra después de su animación.
  onRequestClose?: () => void;
  children: (side: BookSide, onSide: (side: BookSide) => void) => ReactNode;
};

// El modal a pantalla completa con el libro. En celular es un carrusel: deslizar en cualquier parte (dedo o arrastre con
// el mouse), también fuera del libro, pasa a la otra página; los campos de texto y las barras de color usan el gesto
// horizontal, ahí no cuenta. El fondo cierra solo en pantallas anchas: en celular es para deslizar y se cierra con la X.
export function BookDialog({ dialogRef, label, showing, onClose, onRequestClose, children }: BookDialogProps) {
  const [side, setSide] = useState<BookSide>("left");
  const backdropPress = useRef(false);
  const dragStart = useRef<number | null>(null);
  // Sin esto, en Chrome para celular el primer toque después de deslizar no hace nada.
  useHorizontalSwipe(dialogRef);
  const requestClose = () => (onRequestClose ? onRequestClose() : dialogRef.current?.close());

  // Antes de pintar: quien lo usa mide y anima el libro en sus propios efectos, con el modal ya abierto.
  // Solo cuando llega un libro: si se acaba de cerrar, un render antes del evento close no lo vuelve a abrir.
  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    if (showing && !dialog.open) dialog.showModal();
  }, [showing, dialogRef]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={(event) => {
        // El modal se reutiliza: se quita el fondo transparente que deja el vuelo a la estantería (las animaciones de CSS se quedan).
        for (const animation of event.currentTarget.getAnimations?.({ subtree: true }) ?? []) if (animation.constructor === Animation) animation.cancel();
        setSide("left");
        onClose();
      }}
      onCancel={(event) => {
        if (!onRequestClose) return;
        event.preventDefault();
        onRequestClose();
      }}
      onPointerDown={(event) => {
        // El libro y el botón no cubren toda la pantalla: si el destino es el <dialog> mismo, se tocó el fondo.
        backdropPress.current = event.target === event.currentTarget;
        dragStart.current = (event.target as Element).closest("input, textarea, select") ? null : event.clientX;
      }}
      onPointerUp={(event) => {
        if (dragStart.current === null) return;
        const distance = event.clientX - dragStart.current;
        dragStart.current = null;
        if (Math.abs(distance) >= SWIPE) setSide(distance < 0 ? "right" : "left");
      }}
      onPointerCancel={() => (dragStart.current = null)}
      onDragStart={(event) => event.preventDefault()}
      onClick={(event) => {
        if (backdropPress.current && event.target === event.currentTarget && window.matchMedia(WIDE).matches) requestClose();
      }}
      // pt-16: el libro queda debajo del botón de cerrar. Flex centra el libro aunque sea más ancho que la pantalla (celular).
      // touch-pan-y: el gesto horizontal lo manejan los eventos; el vertical sigue haciendo scroll de las páginas.
      className="fixed inset-0 m-0 size-full max-h-none max-w-none touch-pan-y items-center justify-center overflow-clip bg-transparent px-0 pb-4 pt-16 backdrop:bg-black/40 open:flex motion-safe:backdrop:animate-[fade-in_0.4s_ease-out_both]"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={requestClose}
        className="absolute right-4 top-4 inline-flex size-11 items-center justify-center rounded-full bg-card text-foreground shadow-md transition hover:bg-surface"
      >
        <X aria-hidden="true" className="size-6" />
      </button>
      {showing && children(side, setSide)}
    </dialog>
  );
}

type BookFrameProps = {
  colors: BookColors;
  side: BookSide;
  onSide: (side: BookSide) => void;
  // true: el libro llega y se abre con las animaciones de CSS (crear un libro). false: quien lo usa lo anima.
  entrance: boolean;
  // Nombre de las flechas de celular: a la página derecha y a la izquierda.
  arrows: { right: string; left: string };
  flyRef: Ref<HTMLDivElement>;
  innerRef: Ref<HTMLDivElement>;
  flipperRef: Ref<HTMLDivElement>;
  // Lo escrito en cada página, ubicado con pageClass.
  children: ReactNode;
};

// El libro abierto, del mismo tamaño al crear y al ver.
// Celular: cada página en proporción 3:4 y el libro abierto más ancho que la pantalla; solo se ve la página actual.
// Con mouse, la página es más angosta para dejar lugar a las flechas a los lados.
// Desde sm: el libro abierto completo, lo más grande que quepa (3:2; en pantallas bajas se estira a lo ancho).
// Animación de entrada (keyframes en globals.css): book-fly lo trae, después book-open gira la tapa sobre el lomo mientras
// book-center corre el libro para dejarlo centrado ya abierto. Sin animaciones, los estilos base son el estado final.
export function BookFrame({ colors, side, onSide, entrance, arrows, flyRef, innerRef, flipperRef, children }: BookFrameProps) {
  return (
    <>
      <div
        ref={flyRef}
        className={`h-[min(calc(100dvh-6rem),calc(var(--page)*4/3))] w-[calc(var(--page)*2)] shrink-0 [--page:min(100vw-2rem,28rem)] pointer-fine:[--page:min(100vw-8rem,28rem)] drop-shadow-[0_1.25rem_1.5rem_rgb(0_0_0/0.35)] sm:h-[min(calc(100dvh-5rem),calc(min(100vw-2rem,max((100dvh-5rem)*1.5,40rem))/1.5))] sm:w-[min(calc(100vw-2rem),max(calc((100dvh-5rem)*1.5),40rem))] ${entrance ? "motion-safe:animate-[book-fly_0.6s_cubic-bezier(0.3,0.7,0.3,1)_both]" : ""}`}
      >
        {/* En celular se corre un cuarto para centrar la página actual. Sin fill final para que la transición al pasar de página funcione. */}
        <div
          ref={innerRef}
          className={`relative size-full perspective-[200rem] transition-transform duration-500 ease-in-out motion-reduce:transition-none sm:[transform:none] ${entrance ? "motion-safe:animate-[book-center_0.7s_ease-in-out_0.6s_backwards]" : ""} ${side === "left" ? "[transform:translateX(25%)]" : "[transform:translateX(-25%)]"}`}
        >
          <BookPages colors={colors} className="absolute inset-y-0 right-0 h-full w-1/2" />
          {/* Tapa: gira sobre el lomo. Por fuera es la tapa del libro cerrado; por dentro, la mitad izquierda del libro abierto. */}
          <div
            ref={flipperRef}
            className={`absolute inset-y-0 right-0 w-1/2 origin-left transform-3d [transform:rotateY(-180deg)] ${entrance ? "motion-safe:animate-[book-open_0.7s_ease-in-out_0.6s_both]" : ""}`}
          >
            <BookCover colors={colors} className="absolute inset-0 size-full backface-hidden" />
            <BookPages colors={colors} mirrored className="absolute inset-0 size-full backface-hidden [transform:rotateY(180deg)]" />
          </div>
          {children}
        </div>
      </div>
      {side === "left" ? (
        <button type="button" aria-label={arrows.right} onClick={() => onSide("right")} className={`right-2 ${ARROW}`}>
          <ChevronRight aria-hidden="true" className="size-6" />
        </button>
      ) : (
        <button type="button" aria-label={arrows.left} onClick={() => onSide("left")} className={`left-2 ${ARROW}`}>
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
      )}
    </>
  );
}

// Elementos del libro abierto que se animan al volar entre el centro de la pantalla y la estantería.
export type BookParts = { fly: HTMLElement; inner: HTMLElement; flipper: HTMLElement; pages: HTMLElement[] };

// Se anima con la Web Animations API (para encadenar los pasos) salvo sin soporte o con movimiento reducido.
export const canAnimate = () => typeof document.body.animate === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const run = (element: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes, options: KeyframeAnimationOptions) =>
  element.animate(keyframes, { fill: "forwards", ...options });
// Posición del lomo que vuela: corrido (x, y) desde su lugar en la estantería, escalado y girado (-90 = de canto).
const at = (x: number, y: number, s: number, turn: number) => `translate(${x}px, ${y}px) scale(${s}) perspective(60rem) rotateY(${turn}deg)`;
const BOOK_TURN = (turn: number) => `perspective(60rem) rotateY(${turn}deg)`;
// Distancia y escala entre el libro cerrado (from) y el lomo en la estantería (to).
function offset(from: DOMRect, to: DOMRect) {
  return { dx: from.left + from.width / 2 - (to.left + to.width / 2), dy: from.top + from.height / 2 - (to.top + to.height / 2), scale: from.height / to.height };
}

// 1. Se borra lo escrito y el libro se cierra (al revés de como se abrió).
export async function closeBook({ inner, flipper, pages }: BookParts) {
  await Promise.all([
    ...pages.map((page) => run(page, { opacity: [getComputedStyle(page).opacity, "0"] }, { duration: 200 }).finished),
    run(flipper, { transform: ["rotateY(-180deg)", "rotateY(0deg)"] }, { duration: 600, delay: 150, easing: "ease-in-out" }).finished,
    run(inner, { transform: [getComputedStyle(inner).transform, "translateX(-25%)"] }, { duration: 600, delay: 150, easing: "ease-in-out" }).finished,
  ]);
}

// 2. El libro cerrado gira: la tapa se va de canto y aparece el lomo, que vuela a su lugar (to) mientras se aclara el fondo.
// spine: el lomo dibujado en su lugar de la estantería (la animación lo trae desde el libro).
export async function bookToShelf({ fly, flipper }: BookParts, spine: HTMLElement, to: DOMRect, dialog: HTMLDialogElement) {
  const { dx, dy, scale } = offset(flipper.getBoundingClientRect(), to);
  await Promise.all([
    run(fly, { transform: [BOOK_TURN(0), BOOK_TURN(90)] }, { duration: 250, easing: "ease-in" }).finished,
    run(
      spine,
      [
        { offset: 0, transform: at(dx, dy, scale, -90) },
        { offset: 0.2, transform: at(dx, dy, scale, -90), easing: "ease-out" },
        { offset: 0.4, transform: at(dx, dy, scale, 0), easing: "cubic-bezier(0.5, 0, 0.3, 1)" },
        { offset: 1, transform: at(0, 0, 1, 0) },
      ],
      { duration: 1250 },
    ).finished,
    run(dialog, { opacity: [1, 0] }, { duration: 500, delay: 750, pseudoElement: "::backdrop" }).finished,
  ]);
}

// Al revés de los pasos 2 y 1: el lomo sale de la estantería (from) y vuela al centro, gira mostrando la tapa y el libro
// se abre. Quien lo usa ya dejó el libro de canto (transform en línea) para que no se vea antes de empezar.
// Mientras vuela el lomo, el libro cerrado se arma con estilos en línea y no con animaciones en espera con relleno hacia
// atrás: Chrome no siempre aplica ese relleno al animar en el compositor y se veía el libro abierto un instante.
export async function shelfToBook({ fly, inner, flipper, pages }: BookParts, spine: HTMLElement, from: DOMRect) {
  const open = { inner: getComputedStyle(inner).transform, pages: pages.map((page) => getComputedStyle(page).opacity) };
  // Sin las transiciones de la página y del carrusel: el libro queda cerrado al instante.
  for (const element of [inner, ...pages]) element.style.transition = "none";
  inner.style.transform = "translateX(-25%)";
  flipper.style.transform = "rotateY(0deg)";
  for (const page of pages) page.style.opacity = "0";
  // El libro cerrado ocupa la mitad del centro del área del libro (medida sin transformaciones, relativa al modal).
  const closed = new DOMRect(fly.offsetLeft + fly.offsetWidth / 4, fly.offsetTop, fly.offsetWidth / 2, fly.offsetHeight);
  const { dx, dy, scale } = offset(closed, from);

  // 1. El lomo vuela al centro y se pone de canto; al final, el libro cerrado gira y muestra la tapa.
  const turn = run(fly, { transform: [BOOK_TURN(90), BOOK_TURN(0)] }, { duration: 250, delay: 1000, easing: "ease-out" });
  await Promise.all([
    turn.finished,
    run(
      spine,
      [
        { offset: 0, transform: at(0, 0, 1, 0), easing: "cubic-bezier(0.7, 0, 0.5, 1)" },
        { offset: 0.6, transform: at(dx, dy, scale, 0), easing: "ease-in" },
        { offset: 0.8, transform: at(dx, dy, scale, -90) },
        { offset: 1, transform: at(dx, dy, scale, -90) },
      ],
      { duration: 1250 },
    ).finished,
  ]);
  fly.style.removeProperty("transform");

  // 2. El libro se abre y aparece lo escrito.
  const flip = run(flipper, { transform: ["rotateY(0deg)", "rotateY(-180deg)"] }, { duration: 600, easing: "ease-in-out" });
  const center = run(inner, { transform: ["translateX(-25%)", open.inner] }, { duration: 600, easing: "ease-in-out" });
  const writing = pages.map((page, index) => run(page, { opacity: ["0", open.pages[index]] }, { duration: 300, delay: 500 }));
  await Promise.all([flip, center, ...writing].map((animation) => animation.finished));
  inner.style.removeProperty("transform");
  flipper.style.removeProperty("transform");
  for (const page of pages) page.style.removeProperty("opacity");
  for (const element of [inner, ...pages]) element.style.removeProperty("transition");
  // Se quitan las animaciones que pisarían el carrusel de celular y el paso de página. La del giro y la de la tapa se
  // quedan (terminan en sus estilos de siempre): al quitar la de la tapa, Chrome dejaba de pintar la página derecha.
  for (const animation of [center, ...writing]) animation.cancel();
}

// El lomo de un libro en la estantería. Lo busca unos instantes por si la página todavía se está refrescando.
export async function findShelvedBook(id: string) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const spine = document.querySelector<HTMLElement>(`[data-book-id="${id}"] > *`);
    if (spine) return spine;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

// Espera a que terminen las animaciones de los contenedores del elemento (por ejemplo, el carrusel de la habitación).
export function settle(element: Element) {
  const animations: Animation[] = [];
  for (let node: Element | null = element; node; node = node.parentElement) animations.push(...(node.getAnimations?.() ?? []));
  return Promise.all(animations.filter((animation) => animation.effect?.getTiming().iterations !== Infinity).map((animation) => animation.finished.catch(() => {})));
}
