import { fireEvent, render, screen } from "@testing-library/react";
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

  test("desde sm se cierra con el botón o con un clic en el fondo, pero no con un clic en el libro", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<BookCreator book={BOOK} onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Nuevo libro" });

    await user.click(dialog.querySelector('svg[viewBox="0 0 96 128"]')!);
    expect(onClose).not.toHaveBeenCalled();
    await user.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
    vi.restoreAllMocks();

    rerender(<BookCreator book={{ ...BOOK }} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  test("en celular el fondo no cierra el libro (es para deslizar): solo la X", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={onClose} />);

    await user.click(screen.getByRole("dialog", { name: "Nuevo libro" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("la página izquierda tiene el formulario y la derecha la descripción con su contador", async () => {
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={() => {}} />);

    for (const name of ["Nombre del libro", "Autor"]) expect(screen.getByRole("textbox", { name })).toBeInTheDocument();
    for (const name of ["Año", "Cantidad de páginas"]) expect(screen.getByRole("spinbutton", { name })).toBeInTheDocument();
    const status = screen.getByRole("combobox", { name: "Estado" });
    expect(status).toHaveValue("pending");
    expect([...status.querySelectorAll("option")].map((option) => option.textContent)).toEqual(["Pendiente", "Leyendo", "Terminado"]);

    // Barras HSL: empiezan en el color del libro que salió de la bolsa (#2f7a96 = hsl(196 52% 39%)).
    const cover = screen.getByRole("group", { name: "Color de la pasta" });
    const hue = screen.getAllByRole("slider", { name: /^H ?\(tono\)$/ })[0];
    expect(cover).toContainElement(hue);
    expect(hue).toHaveValue("196");
    expect(screen.getByRole("group", { name: "Color del título" })).toBeInTheDocument();
    fireEvent.change(hue, { target: { value: "10" } });
    expect(document.querySelector('path[fill="hsl(10 52% 39%)"]')).toBeInTheDocument();

    const comment = screen.getByRole("textbox", { name: "¿Qué quieres expresar de este libro?" });
    expect(comment).toHaveAttribute("maxlength", "2000");
    expect(comment).toHaveAccessibleDescription("0/2000");
    await user.type(comment, "Me encantó");
    expect(comment).toHaveAccessibleDescription("10/2000");
  });

  test("las fuentes elegidas se ven en el nombre y en la descripción", async () => {
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={() => {}} />);
    const titleFont = screen.getByRole("combobox", { name: "Fuente del título" });
    const descriptionFont = screen.getByRole("combobox", { name: "Fuente de la descripción" });
    expect([...titleFont.querySelectorAll("option")].map((option) => option.textContent)).toEqual([
      "Clásica",
      "Elegante",
      "Manuscrita",
      "Máquina de escribir",
      "Antigua",
      "Moderna",
    ]);

    await user.selectOptions(titleFont, "Manuscrita");
    expect(screen.getByRole("textbox", { name: "Nombre del libro" }).style.fontFamily).toBe("Caveat");
    await user.selectOptions(descriptionFont, "Antigua");
    expect(screen.getByRole("textbox", { name: "¿Qué quieres expresar de este libro?" }).style.fontFamily).toBe("Cinzel");
  });

  test("en celular es un carrusel: deslizar, las flechas o enfocar la otra página la muestran", async () => {
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    // La tira con las dos páginas; el gesto se puede hacer en cualquier parte del modal.
    const strip = dialog.querySelector('[class*="translateX"]')!;
    const FORM = "[transform:translateX(25%)]";
    const COMMENT = "[transform:translateX(-25%)]";
    expect(strip).toHaveClass(FORM);
    // La página que no está en pantalla no muestra sus controles (su borde asoma).
    const commentPage = screen.getByRole("textbox", { name: "¿Qué quieres expresar de este libro?" }).parentElement;
    expect(commentPage).toHaveClass("opacity-0");

    // Un movimiento corto no pasa de página; deslizar a la izquierda muestra la descripción y a la derecha, el formulario.
    fireEvent.pointerDown(dialog, { clientX: 200 });
    fireEvent.pointerUp(dialog, { clientX: 190 });
    expect(strip).toHaveClass(FORM);
    fireEvent.pointerDown(dialog, { clientX: 220 });
    fireEvent.pointerUp(dialog, { clientX: 100 });
    expect(strip).toHaveClass(COMMENT);
    expect(commentPage).not.toHaveClass("opacity-0");
    fireEvent.pointerDown(dialog, { clientX: 100 });
    fireEvent.pointerUp(dialog, { clientX: 220 });
    expect(strip).toHaveClass(FORM);

    // Mover una barra de color no pasa de página.
    const hue = screen.getAllByRole("slider")[0];
    fireEvent.pointerDown(hue, { clientX: 220 });
    fireEvent.pointerUp(hue, { clientX: 100 });
    expect(strip).toHaveClass(FORM);

    await user.click(screen.getByRole("button", { name: "Ver la descripción" }));
    expect(strip).toHaveClass(COMMENT);
    await user.click(screen.getByRole("button", { name: "Ver el formulario" }));
    expect(strip).toHaveClass(FORM);

    // Con el teclado: al enfocar un campo de la otra página se pasa a ella.
    await user.click(screen.getByRole("textbox", { name: "¿Qué quieres expresar de este libro?" }));
    expect(strip).toHaveClass(COMMENT);
    await user.click(screen.getByRole("textbox", { name: "Autor" }));
    expect(strip).toHaveClass(FORM);
  });
});
