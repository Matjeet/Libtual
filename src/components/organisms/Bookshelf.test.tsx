import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Bookshelf } from "./Bookshelf";

describe("Bookshelf", () => {
  test("es una región con título que se puede enfocar para hacer scroll", () => {
    render(<Bookshelf />);
    const shelf = screen.getByRole("region", { name: "Tu estantería" });
    expect(shelf).toHaveAttribute("tabindex", "0");
    expect(shelf.className).toContain("overflow-y-auto");
  });

  test("al inicio tiene 3 pisos, cada uno de un tercio del alto visible", () => {
    render(<Bookshelf />);
    const shelves = screen.getAllByTestId("shelf");
    expect(shelves).toHaveLength(3);
    for (const shelf of shelves) expect(shelf.className).toContain("basis-1/3");
  });
});
