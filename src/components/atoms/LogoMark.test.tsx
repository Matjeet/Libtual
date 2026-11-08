import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LOGO_ROWS, LogoMark } from "./LogoMark";

// Reconstruye los bits de cada piso: los 0 se dibujan como <rect> y los 1 como <path> (sin contar la repisa).
function readBits(container: HTMLElement) {
  return [...container.querySelectorAll("g[data-row]")].map((row) =>
    [...row.children]
      .filter((el) => !(el.tagName === "path" && el.getAttribute("stroke-width") === "2"))
      .map((el) => (el.tagName === "rect" ? "0" : "1"))
      .join(""),
  );
}

describe("LogoMark", () => {
  test("los tres pisos dicen 'Lib' en binario", () => {
    const { container } = render(<LogoMark />);
    const bits = readBits(container);
    expect(bits).toEqual([...LOGO_ROWS]);
    expect(bits.map((b) => String.fromCharCode(parseInt(b, 2))).join("")).toBe("Lib");
  });

  test("el 0 y el 1 ocupan el mismo ancho", () => {
    const { container } = render(<LogoMark />);
    const zero = container.querySelector("g[data-row] rect")!;
    // Ancho del 0 con su trazo de 1: width + 1.
    expect(Number(zero.getAttribute("width")) + 1).toBe(3);
    // Base del 1: de x+0.5 a x+2.5 con extremos redondeados de 0.5 → 3 de ancho.
    const one = container.querySelector("g[data-row] path:not([stroke-width])")!.getAttribute("d")!;
    const [, from, to] = one.match(/M([\d.]+) [\d.]+H([\d.]+)$/)!;
    expect(Number(to) - Number(from) + 1).toBe(3);
  });

  test("es decorativo y toma el color del texto", () => {
    const { container } = render(<LogoMark className="h-9" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveClass("h-9");
  });
});
