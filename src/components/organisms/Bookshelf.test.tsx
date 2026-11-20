import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Bookshelf, OpenShelfBook } from "./Bookshelf";

const moveBook = vi.hoisted(() => vi.fn<(...args: unknown[]) => Promise<{ error?: string }>>(async () => ({})));
vi.mock("@/lib/book-actions", () => ({ moveBook }));

const titles = () => screen.getAllByRole("listitem").map((li) => li.textContent);
const book = (id: string, title: string) => ({ id, title, category: "medium" as const, coverColor: "#2f7a96", fontColor: "#faf0d1", titleFont: "lora", ...DETAILS });

const DETAILS = { author: "Julio Cortázar", year: 1963, genre: "Novela", comment: "Un juego.", commentFont: "lora", status: "pending", quote: "" };

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
    expect(button).toHaveAccessibleDescription("Arrástralo o usa las flechas izquierda y derecha para cambiarlo de lugar.");
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
});
