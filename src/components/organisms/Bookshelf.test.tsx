import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Bookshelf, OpenShelfBook } from "./Bookshelf";

const DETAILS = { author: "Julio Cortázar", year: 1963, genre: "Novela", comment: "Un juego.", commentFont: "lora" };

describe("Bookshelf", () => {
  test("es una región con título y, sin libros, no tiene scroll", () => {
    render(<Bookshelf />);
    const shelf = screen.getByRole("region", { name: "Tu estantería" });
    expect(shelf.className).toContain("overflow-hidden");
  });

  test("todos los pisos tienen el mismo alto estándar", () => {
    render(<Bookshelf />);
    for (const shelf of screen.getAllByTestId("shelf")) expect(shelf.className).toContain("h-[10.5rem]");
  });

  test("muestra el lomo de cada libro con su título, colores y tamaño según la categoría", () => {
    render(
      <Bookshelf
        books={[
          { id: "b1", title: "Rayuela", category: "extra_large", coverColor: "#2f7a96", fontColor: "#faf0d1", titleFont: "lora", ...DETAILS },
          { id: "b2", title: "Aura", category: "small", coverColor: "#a23b4c", fontColor: "#ffffff", titleFont: "caveat", ...DETAILS },
        ]}
      />,
    );
    const books = screen.getAllByRole("listitem");
    expect(books.map((book) => book.textContent)).toEqual(["Rayuela", "Aura"]);
    expect(books[0]).toHaveAttribute("data-book-id", "b1");
    // Cada libro: el lomo y, detrás, la cara de arriba (las hojas) que se ve al sacarlo.
    const [thick, short] = books.map((book) => book.firstElementChild!.firstElementChild as HTMLElement);
    expect(thick).toHaveClass("w-14", "h-32");
    expect(thick.style.background).toBe("rgb(47, 122, 150)");
    expect(short).toHaveClass("w-6", "h-24");
    expect(short.style.color).toBe("rgb(255, 255, 255)");
    expect((short.lastElementChild as HTMLElement).style.fontFamily).toBe("Caveat");
  });

  test("al hacer clic en un libro lo abre con su lugar en la estantería", async () => {
    const open = vi.fn();
    const book = { id: "b1", title: "Rayuela", category: "large" as const, coverColor: "#2f7a96", fontColor: "#faf0d1", titleFont: "lora", ...DETAILS };
    render(
      <OpenShelfBook value={open}>
        <Bookshelf books={[book]} />
      </OpenShelfBook>,
    );
    const spine = screen.getByRole("button", { name: "Rayuela" });
    expect(spine).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.setup().click(spine);
    expect(open).toHaveBeenCalledWith({ book, slot: spine, rect: expect.any(DOMRect) });
  });
});
