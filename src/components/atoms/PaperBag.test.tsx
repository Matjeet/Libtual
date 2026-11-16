import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
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

  test("al hacer clic, el libro sale de la bolsa y se entrega con sus colores", async () => {
    const onTakeBook = vi.fn();
    render(<PaperBag onTakeBook={onTakeBook} />);
    fireEvent.click(screen.getByRole("button", { name: "Agregar un libro" }));

    await vi.waitFor(() => expect(onTakeBook).toHaveBeenCalledTimes(1));
    expect(onTakeBook.mock.calls[0][0].colors.cover).toBe(screen.getByTestId("book-cover").getAttribute("fill"));
  });
});
