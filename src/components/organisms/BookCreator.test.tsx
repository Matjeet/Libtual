import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { BookCreator } from "./BookCreator";

const BOOK = { x: 40, y: 500, width: 60, height: 100, colors: { cover: "#2f7a96", spine: "#1d5468", band: "#f2b632", line: "#174556" } };

describe("BookCreator", () => {
  test("cerrado no muestra nada; con un libro se abre con el libro en pantalla", () => {
    const { rerender } = render(<BookCreator book={null} onClose={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<BookCreator book={BOOK} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog", { name: "Nuevo libro" });
    // Libro abierto: la tapa y las dos mitades, con el color del libro que salió de la bolsa.
    expect(dialog.querySelectorAll('svg[viewBox="0 0 96 128"]')).toHaveLength(3);
    expect(dialog.querySelector(`path[fill="${BOOK.colors.cover}"]`)).toBeInTheDocument();
  });

  test("se cierra con el botón o con un clic en el fondo, pero no con un clic en el libro", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<BookCreator book={BOOK} onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Nuevo libro" });

    await user.click(dialog.querySelector('svg[viewBox="0 0 96 128"]')!);
    expect(onClose).not.toHaveBeenCalled();
    await user.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<BookCreator book={{ ...BOOK }} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
