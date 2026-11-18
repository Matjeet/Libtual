import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { BookViewer } from "./BookViewer";

const BOOK = {
  id: "b1",
  title: "La república",
  category: "large" as const,
  coverColor: "#2f7a96",
  fontColor: "#faf0d1",
  titleFont: "cinzel",
  author: "Platón",
  year: -375,
  genre: "Filosofía",
  comment: "Sobre la justicia.\nY la ciudad ideal.",
  commentFont: "caveat",
};

function view() {
  const slot = document.createElement("button");
  document.body.append(slot);
  const onClose = vi.fn();
  render(<BookViewer viewing={{ book: BOOK, slot, rect: new DOMRect(10, 20, 40, 128) }} onClose={onClose} />);
  return { slot, onClose };
}

describe("BookViewer", () => {
  test("muestra el título con su fuente en negro, los datos del libro y el comentario escrito en la hoja", () => {
    view();
    const dialog = screen.getByRole("dialog", { name: "La república" });
    const title = within(dialog).getByRole("heading", { name: "La república" });
    expect(title).toHaveClass("text-black");
    expect(title.style.fontFamily).toBe("Cinzel");
    expect(within(dialog).getByText("Platón")).toBeInTheDocument();
    expect(within(dialog).getByText("375 a. C.")).toBeInTheDocument();
    expect(within(dialog).getByText("Filosofía")).toBeInTheDocument();
    const comment = within(dialog).getByRole("region", { name: "Comentario" });
    expect(comment).toHaveTextContent("Sobre la justicia. Y la ciudad ideal.");
    expect(comment).toHaveClass("text-justify", "whitespace-pre-line");
    expect(comment.style.fontFamily).toBe("Caveat");
    // No es un campo para escribir.
    expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument();
  });

  test("mientras está abierto deja el hueco en la estantería; al cerrar con la X lo devuelve", async () => {
    const { slot, onClose } = view();
    expect(slot.style.visibility).toBe("hidden");
    await userEvent.setup().click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalled();
    expect(slot.style.visibility).toBe("");
    slot.remove();
  });
});
