import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Bookshelf } from "./Bookshelf";

describe("Bookshelf", () => {
  test("es una región con título que se puede enfocar para hacer scroll, con sus pisos vacíos", () => {
    render(<Bookshelf />);
    const shelf = screen.getByRole("region", { name: "Tu estantería" });
    expect(shelf).toHaveAttribute("tabindex", "0");
    expect(shelf.className).toContain("overflow-y-auto");
    expect(screen.getAllByTestId("shelf").length).toBeGreaterThan(0);
  });
});
