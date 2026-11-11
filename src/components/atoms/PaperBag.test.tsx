import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PaperBag } from "./PaperBag";

describe("PaperBag", () => {
  test("cada vez que el mouse entra a la bolsa, el libro cambia de color", () => {
    const { container } = render(<PaperBag />);
    const bag = container.querySelector("svg")!;
    const color = () => screen.getByTestId("book-cover").getAttribute("fill");

    const seen = [color()];
    for (let i = 0; i < 3; i++) {
      fireEvent.pointerEnter(bag);
      seen.push(color());
    }
    // Cada hover da un color distinto al anterior.
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });
});
