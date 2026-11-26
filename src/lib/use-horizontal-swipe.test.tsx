import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, test } from "vitest";
import { useHorizontalSwipe } from "./use-horizontal-swipe";

function Carousel() {
  const ref = useRef<HTMLDivElement>(null);
  useHorizontalSwipe(ref);
  return (
    <div ref={ref} data-testid="carousel">
      <input aria-label="Campo" />
    </div>
  );
}

// fireEvent devuelve false si el evento se canceló.
const move = (element: Element, x: number, y: number) => fireEvent.touchMove(element, { touches: [{ clientX: x, clientY: y }] });

describe("useHorizontalSwipe", () => {
  test("cancela los movimientos de un gesto horizontal para que el navegador no lo tome como desplazamiento", () => {
    render(<Carousel />);
    const carousel = screen.getByTestId("carousel");
    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 300 }] });
    expect(move(carousel, 180, 302)).toBe(false);
    // Una vez horizontal, todo el gesto lo es aunque después se mueva más en vertical.
    expect(move(carousel, 170, 340)).toBe(false);
  });

  test("no cancela el scroll vertical ni los gestos que empiezan en un campo", () => {
    render(<Carousel />);
    const carousel = screen.getByTestId("carousel");
    fireEvent.touchStart(carousel, { touches: [{ clientX: 200, clientY: 300 }] });
    expect(move(carousel, 198, 260)).toBe(true);
    expect(move(carousel, 150, 250)).toBe(true);

    const field = screen.getByRole("textbox", { name: "Campo" });
    fireEvent.touchStart(field, { touches: [{ clientX: 100, clientY: 100 }] });
    expect(move(field, 40, 100)).toBe(true);
  });
});
