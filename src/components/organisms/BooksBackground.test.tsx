import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { BOOK_ROWS, BOOKS_PER_COPY, BooksBackground, waveDelay } from "./BooksBackground";

describe("BooksBackground", () => {
  test("es decorativo: oculto para lectores de pantalla y sin capturar clics", () => {
    const { container } = render(<BooksBackground />);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("pointer-events-none");
  });

  test("muestra cuatro filas, cada una con dos copias idénticas de libros", () => {
    const { container } = render(<BooksBackground />);
    const tracks = container.querySelectorAll(".flex.w-max");
    expect(tracks).toHaveLength(4);
    tracks.forEach((track) => {
      const icons = [...track.querySelectorAll("svg")];
      expect(icons).toHaveLength(BOOKS_PER_COPY * 2);
      const signature = (svg: SVGElement) => `${svg.getAttribute("class")}|${svg.style.animationDelay}`;
      // La segunda copia repite exactamente a la primera: el salto de -50 % a 0 no se nota.
      expect(icons.slice(BOOKS_PER_COPY).map(signature)).toEqual(icons.slice(0, BOOKS_PER_COPY).map(signature));
    });
  });

  test("la onda arranca en movimiento y avanza hacia la derecha sin cortes entre copias", () => {
    for (const { wave } of BOOK_ROWS) {
      const delays = Array.from({ length: BOOKS_PER_COPY }, (_, index) => waveDelay(index, wave));
      // Todos negativos: ningún libro está quieto al cargar.
      delays.forEach((delay) => expect(delay).toBeLessThan(0));
      // Crecen con la posición: cada libro llega a la cresta después del de su izquierda.
      delays.slice(1).forEach((delay, index) => expect(delay).toBeGreaterThan(delays[index]));
      // El salto entre el último de una copia y el primero de la siguiente equivale a un paso normal (módulo el período).
      const step = wave / BOOKS_PER_COPY;
      const boundary = (waveDelay(BOOKS_PER_COPY, wave) + wave - delays.at(-1)!) % wave;
      expect(boundary).toBeCloseTo(step);
    }
  });
});
