import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { RotatingText } from "./RotatingText";

const PHRASES = ["Primera", "Segunda", "Tercera"];

const stateOf = (container: HTMLElement, text: string) =>
  [...container.querySelectorAll("[data-state]")].find((el) => el.textContent === text)!.getAttribute("data-state");
const visibleText = (container: HTMLElement) =>
  [...container.querySelectorAll("[aria-hidden='false']")].map((el) => el.textContent);

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("RotatingText", () => {
  test("empieza con la primera frase, sin animación de entrada", () => {
    const { container } = render(<RotatingText phrases={PHRASES} />);
    expect(stateOf(container, "Primera")).toBe("shown");
    expect(stateOf(container, "Segunda")).toBe("hidden");
    expect(visibleText(container)).toEqual(["Primera"]);
  });

  test("cambia cada 30 segundos: la anterior sale y la nueva entra", () => {
    const { container } = render(<RotatingText phrases={PHRASES} />);
    act(() => vi.advanceTimersByTime(29_999));
    expect(visibleText(container)).toEqual(["Primera"]);

    act(() => vi.advanceTimersByTime(1));
    expect(stateOf(container, "Primera")).toBe("leaving");
    expect(stateOf(container, "Segunda")).toBe("entering");
    expect(stateOf(container, "Tercera")).toBe("hidden");
    // Solo la frase actual se expone a lectores de pantalla.
    expect(visibleText(container)).toEqual(["Segunda"]);
  });

  test("vuelve a la primera después de la última", () => {
    const { container } = render(<RotatingText phrases={PHRASES} />);
    act(() => vi.advanceTimersByTime(30_000 * 3));
    expect(stateOf(container, "Primera")).toBe("entering");
    expect(stateOf(container, "Tercera")).toBe("leaving");
  });

  test("las animaciones se desactivan con 'reducir movimiento'", () => {
    const { container } = render(<RotatingText phrases={PHRASES} />);
    act(() => vi.advanceTimersByTime(30_000));
    const entering = [...container.querySelectorAll("[data-state='entering']")][0];
    const leaving = [...container.querySelectorAll("[data-state='leaving']")][0];
    expect(entering.className).toContain("motion-reduce:animate-none");
    expect(leaving.className).toContain("motion-reduce:invisible");
  });

  test("modo en línea y velocidad de animación configurable", () => {
    const { container } = render(<RotatingText phrases={["o", "a"]} intervalMs={5_000} animationMs={300} inline />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("inline-grid");
    expect(root.style.getPropertyValue("--rotate-ms")).toBe("300ms");

    act(() => vi.advanceTimersByTime(5_000));
    expect(stateOf(container, "a")).toBe("entering");
    expect(stateOf(container, "o")).toBe("leaving");
  });

  test("deja de cambiar al desmontarse", () => {
    const clear = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(<RotatingText phrases={PHRASES} />);
    unmount();
    expect(clear).toHaveBeenCalled();
  });
});
