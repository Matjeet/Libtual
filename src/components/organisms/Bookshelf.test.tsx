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
});
