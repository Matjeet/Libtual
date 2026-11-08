import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { OpenBook } from "./OpenBook";

// next/font solo funciona al compilar con Next; en los tests basta con una clase.
vi.mock("next/font/google", () => ({ Dancing_Script: () => ({ className: "font-script" }) }));

describe("OpenBook", () => {
  test("es decorativo y siempre dice Libtual en letra cursiva", () => {
    const { container } = render(<OpenBook />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Libtual")).toHaveClass("font-script");
  });

  test("la hoja gira cada 10 s y respeta 'reducir movimiento'", () => {
    render(<OpenBook />);
    const page = screen.getByTestId("page");
    expect(page.className).toContain("animate-[page-turn_10s_ease-in-out_infinite]");
    expect(page.className).toContain("motion-reduce:animate-none");
    expect(page).toHaveClass("origin-left");
  });

  test("el texto queda por encima de la hoja que gira", () => {
    const { container } = render(<OpenBook />);
    const children = [...container.firstElementChild!.children];
    expect(children.indexOf(screen.getByText("Libtual"))).toBeGreaterThan(children.indexOf(screen.getByTestId("page")));
  });
});
