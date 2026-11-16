import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Bookshelf } from "./Bookshelf";

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
          { id: "b1", title: "Rayuela", category: "extra_large", coverColor: "#2f7a96", fontColor: "#faf0d1", titleFont: "lora" },
          { id: "b2", title: "Aura", category: "small", coverColor: "#a23b4c", fontColor: "#ffffff", titleFont: "caveat" },
        ]}
      />,
    );
    const books = screen.getAllByRole("listitem");
    expect(books.map((book) => book.textContent)).toEqual(["Rayuela", "Aura"]);
    expect(books[0]).toHaveAttribute("data-book-id", "b1");
    const [thick, short] = books.map((book) => book.firstElementChild as HTMLElement);
    expect(thick).toHaveClass("w-14", "h-32");
    expect(thick.style.background).toBe("rgb(47, 122, 150)");
    expect(short).toHaveClass("w-6", "h-24");
    expect(short.style.color).toBe("rgb(255, 255, 255)");
    expect((short.lastElementChild as HTMLElement).style.fontFamily).toBe("Caveat");
  });
});
