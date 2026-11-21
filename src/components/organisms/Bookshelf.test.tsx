import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { createRef } from "react";
import { BookTrash, Bookshelf, OpenShelfBook, ShelfView } from "./Bookshelf";

const moveBook = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<{ error?: string }>>(async () => ({})));
const deleteBook = vi.hoisted(() => vi.fn<(id: string) => Promise<{ error?: string }>>(async () => ({})));
vi.mock("@/lib/book-actions", () => ({ moveBook, deleteBook }));

const titles = () => screen.getAllByRole("listitem").map((li) => li.textContent);
const book = (id: string, title: string) => ({ id, title, category: "medium" as const, coverColor: "#2f7a96", fontColor: "#faf0d1", titleFont: "lora", ...DETAILS });

const DETAILS = { author: "Julio Cortázar", year: 1963, genre: "Novela", comment: "Un juego.", commentFont: "lora", status: "pending", quote: "", createdAt: "2026-11-15T10:00:00+00:00", updatedAt: "2026-11-15T10:00:00+00:00" };

describe("Bookshelf", () => {
  test("tiene los pisos que caben y, si los libros llenan más, uno por cada fila de libros, con scroll sin barra", () => {
    // Medidas simuladas: cada piso mide 168 px, en la estantería caben 2 y cada libro ocupa su propia fila.
    const height = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
      return this.dataset.testid === "shelf" ? 168 : 0;
    });
    const visible = vi.spyOn(Element.prototype, "clientHeight", "get").mockImplementation(function (this: Element) {
      return this.tagName === "SECTION" ? 336 : 0;
    });
    const top = vi.spyOn(HTMLElement.prototype, "offsetTop", "get").mockImplementation(function (this: HTMLElement) {
      return this.tagName === "LI" ? [...this.parentElement!.children].indexOf(this) * 168 : 0;
    });
    const { rerender } = render(<Bookshelf />);
    const shelf = screen.getByRole("region", { name: "Tu estantería" });
    expect(shelf).toHaveClass("overflow-y-auto", "[scrollbar-width:none]");
    expect(screen.getAllByTestId("shelf")).toHaveLength(2);
    rerender(<Bookshelf books={["b1", "b2", "b3", "b4", "b5"].map((id) => book(id, id))} />);
    expect(screen.getAllByTestId("shelf")).toHaveLength(5);
    for (const spy of [height, visible, top]) spy.mockRestore();
  });

  test("todos los pisos tienen el mismo alto estándar", () => {
    render(<Bookshelf />);
    for (const shelf of screen.getAllByTestId("shelf")) expect(shelf.className).toContain("h-[10.5rem]");
  });

  test("muestra el lomo de cada libro con su título, colores y tamaño según la categoría", () => {
    render(
      <Bookshelf
        books={[
          { id: "b1", title: "Rayuela", category: "extra_large", coverColor: "#2f7a96", fontColor: "#faf0d1", titleFont: "lora", ...DETAILS },
          { id: "b2", title: "Aura", category: "small", coverColor: "#a23b4c", fontColor: "#ffffff", titleFont: "caveat", ...DETAILS },
        ]}
      />,
    );
    const books = screen.getAllByRole("listitem");
    expect(books.map((book) => book.textContent)).toEqual(["Rayuela", "Aura"]);
    expect(books[0]).toHaveAttribute("data-book-id", "b1");
    // Cada libro: el lomo y, detrás, la cara de arriba (las hojas) que se ve al sacarlo.
    const [thick, short] = books.map((book) => book.firstElementChild!.firstElementChild as HTMLElement);
    expect(thick).toHaveClass("w-14", "h-32");
    expect(thick.style.background).toBe("rgb(47, 122, 150)");
    expect(short).toHaveClass("w-6", "h-24");
    expect(short.style.color).toBe("rgb(255, 255, 255)");
    expect(within(short).getByText("Aura").style.fontFamily).toBe("Caveat");
    // Debajo del lomo cuelga el separador, del color del estado (pendiente: amarillo).
    expect(short.querySelector("svg path")).toHaveAttribute("fill", "#f2c230");
  });

  test("al hacer clic en un libro lo abre con su lugar en la estantería", async () => {
    const open = vi.fn();
    const book = { id: "b1", title: "Rayuela", category: "large" as const, coverColor: "#2f7a96", fontColor: "#faf0d1", titleFont: "lora", ...DETAILS };
    render(
      <OpenShelfBook value={open}>
        <Bookshelf books={[book]} />
      </OpenShelfBook>,
    );
    const spine = screen.getByRole("button", { name: "Rayuela" });
    expect(spine).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.setup().click(spine);
    expect(open).toHaveBeenCalledWith({ book, slot: spine, rect: expect.any(DOMRect) });
  });

  test("con las flechas el libro enfocado cambia de lugar y se guarda entre sus nuevos vecinos", async () => {
    moveBook.mockClear();
    let finish!: (result: { error?: string }) => void;
    moveBook.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    const [rayuela, aura, bestiario] = [book("b1", "Rayuela"), book("b2", "Aura"), book("b3", "Bestiario")];
    const { rerender } = render(<Bookshelf books={[rayuela, aura, bestiario]} />);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Aura" });
    expect(button).toHaveAccessibleDescription(
      "Arrástralo o usa las flechas izquierda y derecha para cambiarlo de lugar. Con la tecla Suprimir lo sacas de la estantería.",
    );
    button.focus();
    await user.keyboard("{ArrowLeft}");
    // Mientras se guarda ya se ve en su nuevo lugar.
    expect(titles()).toEqual(["Aura", "Rayuela", "Bestiario"]);
    expect(moveBook).toHaveBeenCalledWith("b2", null, "b1");
    expect(button).toHaveFocus();
    // Como refresh(): la página trae la estantería en el nuevo orden.
    rerender(<Bookshelf books={[aura, rayuela, bestiario]} />);
    await act(async () => finish({}));
    expect(screen.getByText("Aura quedó en el lugar 1 de 3.")).toBeInTheDocument();
    expect(titles()).toEqual(["Aura", "Rayuela", "Bestiario"]);
    // Ya está al principio: no se mueve más.
    await user.keyboard("{ArrowLeft}");
    expect(moveBook).toHaveBeenCalledTimes(1);
  });

  test("si no se puede guardar, el libro vuelve a su lugar y se avisa", async () => {
    moveBook.mockResolvedValueOnce({ error: "No pudimos mover el libro." });
    render(<Bookshelf books={[book("b1", "Rayuela"), book("b2", "Aura")]} />);
    screen.getByRole("button", { name: "Rayuela" }).focus();
    await userEvent.setup().keyboard("{ArrowRight}");
    expect(await screen.findByText("No pudimos mover el libro.")).toBeInTheDocument();
    expect(titles()).toEqual(["Rayuela", "Aura"]);
  });

  test("al arrastrar, soltar fuera de la estantería termina el arrastre y no abre el libro", () => {
    const open = vi.fn();
    render(
      <OpenShelfBook value={open}>
        <Bookshelf books={[book("b1", "Rayuela"), book("b2", "Aura")]} />
      </OpenShelfBook>,
    );
    const rayuela = screen.getByRole("button", { name: "Rayuela" });
    const ghost = () => document.body.querySelector(":scope > [aria-hidden='true']");
    const pointer = { pointerId: 7, isPrimary: true, button: 0, pointerType: "mouse" };
    fireEvent.pointerDown(rayuela, { ...pointer, clientX: 10, clientY: 10 });
    // Al moverse unos píxeles se levanta: una copia sigue al puntero.
    fireEvent.pointerMove(screen.getByRole("list"), { ...pointer, clientX: 40, clientY: 10 });
    expect(ghost()).toHaveTextContent("Rayuela");
    // Se suelta fuera de la lista (como cuando el navegador pierde la captura): igual termina.
    fireEvent.pointerMove(document.body, { ...pointer, clientX: 900, clientY: 900 });
    fireEvent.pointerUp(document.body, { ...pointer, clientX: 900, clientY: 900 });
    expect(ghost()).toBeNull();
    fireEvent.click(rayuela);
    expect(open).not.toHaveBeenCalled();
  });

  test("muestra solo el género elegido, en el orden elegido, y solo deja mover libros en el orden personalizado", async () => {
    const dated = (id: string, title: string, genre: string, day: number) => ({
      ...book(id, title),
      genre,
      createdAt: `2026-11-0${day}T00:00:00+00:00`,
    });
    const books = [dated("b1", "Rayuela", "Novela", 3), dated("b2", "Ficciones", "Cuento", 1), dated("b3", "Aura", "Novela", 2)];
    const { rerender } = render(
      <ShelfView value={{ sort: "oldest", genre: "Novela" }}>
        <Bookshelf books={books} />
      </ShelfView>,
    );
    expect(titles()).toEqual(["Aura", "Rayuela"]);
    const aura = screen.getByRole("button", { name: "Aura" });
    expect(aura).toHaveAccessibleDescription(
      "Para cambiarlo de lugar, ordena la estantería como Personalizado. Con la tecla Suprimir lo sacas de la estantería.",
    );
    aura.focus();
    const user = userEvent.setup();
    await user.keyboard("{ArrowRight}");
    expect(titles()).toEqual(["Aura", "Rayuela"]);

    // Personalizado con el género: Aura pasa antes de Rayuela, su vecino visible (Ficciones, de otro género, no cuenta).
    moveBook.mockClear();
    let finish!: (result: { error?: string }) => void;
    moveBook.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    rerender(
      <ShelfView value={{ sort: "custom", genre: "Novela" }}>
        <Bookshelf books={books} />
      </ShelfView>,
    );
    expect(titles()).toEqual(["Rayuela", "Aura"]);
    screen.getByRole("button", { name: "Aura" }).focus();
    await user.keyboard("{ArrowLeft}");
    expect(moveBook).toHaveBeenCalledWith("b3", null, "b1");
    expect(titles()).toEqual(["Aura", "Rayuela"]);
    // React agrupa las acciones pendientes de todos los tests: se termina para no frenar las siguientes.
    await act(async () => finish({}));
  });

  test("arrastrado hasta el bote, pide confirmar: Cancelar lo deja y Eliminar lo saca de la estantería", async () => {
    deleteBook.mockClear();
    let finish!: (result: { error?: string }) => void;
    deleteBook.mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)));
    // El bote ocupa de (500, 500) a (600, 600).
    const ref = createRef<HTMLDivElement>();
    const setShown = vi.fn();
    render(
      <BookTrash value={{ ref, setShown }}>
        <div ref={ref} />
        <Bookshelf books={[book("b1", "Rayuela"), book("b2", "Aura")]} />
      </BookTrash>,
    );
    ref.current!.getBoundingClientRect = () => new DOMRect(500, 500, 100, 100);
    const pointer = { pointerId: 3, isPrimary: true, button: 0, pointerType: "mouse" };
    const dragToTrash = () => {
      fireEvent.pointerDown(screen.getByRole("button", { name: "Rayuela" }), { ...pointer, clientX: 10, clientY: 10 });
      fireEvent.pointerMove(screen.getByRole("list"), { ...pointer, clientX: 40, clientY: 10 });
      expect(setShown).toHaveBeenLastCalledWith(true);
      fireEvent.pointerMove(document.body, { ...pointer, clientX: 550, clientY: 550 });
      expect(ref.current).toHaveAttribute("data-over");
      fireEvent.pointerUp(document.body, { ...pointer, clientX: 550, clientY: 550 });
      expect(setShown).toHaveBeenLastCalledWith(false);
      expect(ref.current).not.toHaveAttribute("data-over");
    };

    dragToTrash();
    const dialog = screen.getByRole("dialog", { name: "¿Estás seguro que quieres sacar este libro de tu estantería? Se eliminará permanentemente." });
    const user = userEvent.setup();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteBook).not.toHaveBeenCalled();
    expect(titles()).toEqual(["Rayuela", "Aura"]);

    dragToTrash();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));
    expect(deleteBook).toHaveBeenCalledWith("b1");
    // Mientras se elimina, ya no está en la estantería.
    expect(titles()).toEqual(["Aura"]);
    await act(async () => finish({}));
  });

  test("con la tecla Suprimir también se saca un libro, después de confirmarlo; si falla, vuelve y se avisa", async () => {
    deleteBook.mockResolvedValueOnce({ error: "No pudimos sacar el libro. Intenta de nuevo." });
    render(<Bookshelf books={[book("b1", "Rayuela"), book("b2", "Aura")]} />);
    screen.getByRole("button", { name: "Aura" }).focus();
    const user = userEvent.setup();
    await user.keyboard("{Delete}");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Eliminar" }));
    expect(deleteBook).toHaveBeenCalledWith("b2");
    expect(await screen.findByText("No pudimos sacar el libro. Intenta de nuevo.")).toBeInTheDocument();
    await waitFor(() => expect(titles()).toEqual(["Rayuela", "Aura"]));
  });
});
