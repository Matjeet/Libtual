import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { OpenBook } from "./OpenBook";

// next/font solo funciona al compilar con Next; en los tests basta con una clase.
vi.mock("next/font/google", () => ({ Dancing_Script: () => ({ className: "font-script" }) }));

describe("OpenBook", () => {
  test("es decorativo y dice 'Lib' en una página y 'Tual' en la otra, en letra cursiva", () => {
    const { container } = render(<OpenBook />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Lib")).toHaveClass("font-script", "left-[29%]");
    expect(screen.getByText("Tual")).toHaveClass("font-script", "left-[71%]");
  });

  test("las páginas y el texto usan colores fijos: se ve blanco en cualquier tema", () => {
    const { container } = render(<OpenBook />);
    const pages = container.querySelectorAll("g[fill='#ffffff'] path");
    expect(pages).toHaveLength(2);
    expect(screen.getByTestId("page").querySelector("path")).toHaveAttribute("fill", "#ffffff");
    expect(screen.getByText("Lib")).toHaveStyle({ color: "#31333b" });
  });

  test("la hoja gira cada 10 s desde el lomo y respeta 'reducir movimiento'", () => {
    render(<OpenBook />);
    const page = screen.getByTestId("page");
    expect(page.className).toContain("animate-[page-turn_10s_ease-in-out_infinite]");
    expect(page.className).toContain("motion-reduce:animate-none");
    expect(page).toHaveClass("origin-left", "left-1/2");
  });

  test("el texto queda por encima de la hoja que gira", () => {
    const { container } = render(<OpenBook />);
    const children = [...container.firstElementChild!.children];
    const leaf = children.indexOf(screen.getByTestId("page"));
    expect(children.indexOf(screen.getByText("Lib"))).toBeGreaterThan(leaf);
    expect(children.indexOf(screen.getByText("Tual"))).toBeGreaterThan(leaf);
  });
});
