import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { BookCreator } from "./BookCreator";

const saveBook = vi.hoisted(() => vi.fn());
vi.mock("@/lib/book-actions", () => ({ saveBook }));

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
    // Género obligatorio, con la lista de sugerencias.
    const genre = screen.getByRole("combobox", { name: "Género" });
    expect(genre).toBeRequired();
    await user.click(genre);
    expect(screen.getByRole("option", { name: "Ciencia ficción" })).toBeInTheDocument();
    const status = screen.getByRole("combobox", { name: "Estado" });
    expect(status).toHaveValue("Pendiente");
    await user.click(status);
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Pendiente", "Leyendo", "Terminado"]);
    await user.keyboard("{Escape}");

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
    // Desde 1500 caracteres el contador se pone rojo.
    const counter = screen.getByText("10/2000");
    expect(counter).not.toHaveClass("text-[#b42318]");
    fireEvent.change(comment, { target: { value: "a".repeat(1499) } });
    expect(counter).not.toHaveClass("text-[#b42318]");
    fireEvent.change(comment, { target: { value: "a".repeat(1500) } });
    expect(counter).toHaveTextContent("1500/2000");
    expect(counter).toHaveClass("text-[#b42318]");
  });

  test("las fuentes elegidas se ven en el nombre y en la descripción", async () => {
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={() => {}} />);
    const titleFont = screen.getByRole("combobox", { name: "Fuente del título" });
    const commentFont = screen.getByRole("combobox", { name: "Fuente de la descripción" });
    // Abre la lista de un campo y devuelve sus grupos y opciones; Escape la cierra.
    const open = async (field: HTMLElement) => {
      await user.click(field);
      const list = screen.getByRole("listbox");
      const groups = within(list)
        .getAllByRole("group")
        .map((group) => document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent);
      const options = within(list)
        .getAllByRole("option")
        .map((option) => option.textContent);
      await user.keyboard("{Escape}");
      return { groups, options };
    };
    const title = await open(titleFont);
    const comment = await open(commentFont);
    // Agrupadas, con el nombre real de cada fuente; las 5 que cuestan leer en un texto largo son solo para el título.
    expect(title.groups).toEqual(["Clásicas", "Modernas", "Manuscritas", "Máquina de escribir", "Antiguas", "Decorativas"]);
    expect(comment.groups).toEqual(title.groups);
    expect(title.options).toHaveLength(30);
    const titleOnly = ["Great Vibes", "Uncial Antiqua", "UnifrakturMaguntia", "Creepster", "Orbitron"];
    expect(comment.options).toEqual(title.options.filter((label) => !titleOnly.includes(label!)));
    expect(titleFont).toHaveValue("Playfair Display");
    expect(commentFont).toHaveValue("Lora");

    await user.click(titleFont);
    await user.click(screen.getByRole("option", { name: "Creepster" }));
    expect(screen.getByRole("textbox", { name: "Nombre del libro" }).style.fontFamily).toBe("Creepster");
    // También se puede escribir para buscar la fuente.
    await user.clear(commentFont);
    await user.type(commentFont, "courier{Enter}");
    expect(screen.getByRole("textbox", { name: "¿Qué quieres expresar de este libro?" }).style.fontFamily).toBe("Courier Prime");
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

  test("Firmar guarda el libro, muestra la estantería y, con el libro ya en ella, cierra el modal", async () => {
    // Lomo del libro nuevo en la estantería, como queda después del refresco.
    const shelf = document.createElement("ul");
    shelf.innerHTML = '<li data-book-id="book-1"><div></div></li>';
    document.body.append(shelf);
    saveBook.mockResolvedValue({ id: "book-1" });
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={onClose} onSaved={onSaved} />);

    await user.type(screen.getByRole("textbox", { name: "Nombre del libro" }), "Rayuela");
    await user.type(screen.getByRole("textbox", { name: "Autor" }), "Julio Cortázar");
    // Un género que no está en la lista también vale.
    await user.type(screen.getByRole("combobox", { name: "Género" }), "Antinovela");
    await user.type(screen.getByRole("spinbutton", { name: "Año" }), "1963");
    await user.type(screen.getByRole("spinbutton", { name: "Cantidad de páginas" }), "600");
    await user.click(screen.getByRole("combobox", { name: "Estado" }));
    await user.click(screen.getByRole("option", { name: "Leyendo" }));
    const quote = screen.getByRole("textbox", { name: "¿Tienes alguna cita del libro?" });
    expect(quote).toHaveAttribute("maxlength", "300");
    // Su contador, como el de la descripción: en rojo desde el 75 % (225 caracteres).
    expect(quote).toHaveAccessibleDescription("0/300");
    fireEvent.change(quote, { target: { value: "a".repeat(224) } });
    expect(screen.getByText("224/300")).not.toHaveClass("text-[#b42318]");
    fireEvent.change(quote, { target: { value: "a".repeat(225) } });
    expect(screen.getByText("225/300")).toHaveClass("text-[#b42318]");
    fireEvent.change(quote, { target: { value: "" } });
    await user.type(quote, "Andábamos sin buscarnos.");
    await user.type(screen.getByRole("textbox", { name: "¿Qué quieres expresar de este libro?" }), "Un juego.");
    const sign = screen.getByRole("button", { name: "Firmar" });
    // Firmar + pluma, en ese orden.
    expect(sign.textContent).toBe("Firmar");
    expect(sign.lastElementChild?.tagName).toBe("svg");
    await user.click(sign);

    expect(saveBook).toHaveBeenCalledWith({
      title: "Rayuela",
      author: "Julio Cortázar",
      genre: "Antinovela",
      year: 1963,
      pages: 600,
      coverColor: BOOK.colors.cover,
      fontColor: "#faf0d1",
      titleFont: "playfair",
      commentFont: "lora",
      status: "reading",
      comment: "Un juego.",
      quote: "Andábamos sin buscarnos.",
    });
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSaved).toHaveBeenCalled();
    expect((shelf.querySelector("div") as HTMLElement).style.visibility).toBe("");
    shelf.remove();
  });

  test("los campos obligatorios vacíos o fuera de rango se marcan con su mensaje y no se guarda", async () => {
    saveBook.mockClear();
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={() => {}} />);
    const title = screen.getByRole("textbox", { name: "Nombre del libro" });
    const genre = screen.getByRole("combobox", { name: "Género" });
    const pages = screen.getByRole("spinbutton", { name: "Cantidad de páginas" });
    await user.type(title, "   ");
    await user.type(pages, "0");
    await user.click(screen.getByRole("button", { name: "Firmar" }));

    expect(saveBook).not.toHaveBeenCalled();
    for (const field of [title, screen.getByRole("textbox", { name: "Autor" }), screen.getByRole("spinbutton", { name: "Año" }), genre]) {
      expect(field).toBeInvalid();
      expect(field).toHaveAccessibleDescription("Este campo es obligatorio.");
    }
    expect(pages).toHaveAccessibleDescription("Escribe un número entre 1 y 100000.");
    // El primero con error queda enfocado.
    expect(title).toHaveFocus();

    // Al corregir un campo se quita su error.
    await user.type(title, "Rayuela");
    expect(title).not.toBeInvalid();
    await user.click(genre);
    await user.click(screen.getByRole("option", { name: "Novela" }));
    expect(genre).not.toBeInvalid();
  });

  test("si no se puede guardar, muestra el error y deja firmar de nuevo", async () => {
    saveBook.mockResolvedValue({ error: "No pudimos guardar tu libro. Intenta de nuevo." });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<BookCreator book={BOOK} onClose={onClose} />);
    await user.type(screen.getByRole("textbox", { name: "Nombre del libro" }), "Aura");
    await user.type(screen.getByRole("textbox", { name: "Autor" }), "Carlos Fuentes");
    await user.type(screen.getByRole("combobox", { name: "Género" }), "Novela");
    await user.type(screen.getByRole("spinbutton", { name: "Año" }), "1962");
    await user.type(screen.getByRole("spinbutton", { name: "Cantidad de páginas" }), "80");
    await user.click(screen.getByRole("button", { name: "Firmar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos guardar tu libro. Intenta de nuevo.");
    expect(screen.getByRole("button", { name: "Firmar" })).toBeEnabled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
