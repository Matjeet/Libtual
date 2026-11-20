import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { use } from "react";
import { ShelfView } from "./Bookshelf";
import { RoomScene } from "./RoomScene";

// El mercado se prueba aparte: aquí solo importa que se abra con el cuadro elegido.
vi.mock("@/components/organisms/PaintingMarket", () => ({
  PaintingMarket: ({ frame }: { frame: string | null }) => (frame ? <p>mercado abierto en {frame}</p> : null),
}));
vi.mock("@/components/organisms/BookCreator", () => ({
  BookCreator: ({ book }: { book: object | null }) => (book ? <p>creando un libro</p> : null),
}));

function setup() {
  render(
    <RoomScene>
      <p>estantería</p>
    </RoomScene>,
  );
  const scene = screen.getByRole("region", { name: /Tu habitación/ });
  const strip = scene.firstElementChild as HTMLElement;
  const slide = () => strip.style.getPropertyValue("--slide");
  return { scene, strip, slide };
}

describe("RoomScene", () => {
  test("muestra primero la estantería, en el panel del medio", () => {
    const { strip, slide } = setup();
    expect(strip.children).toHaveLength(3);
    expect(strip.children[1]).toHaveTextContent("estantería");
    expect(slide()).toBe("1");
  });

  test("un gesto pasa un panel completo de golpe; uno corto no hace nada", () => {
    const { strip, slide } = setup();
    fireEvent.pointerDown(strip, { clientX: 200 });
    fireEvent.pointerUp(strip, { clientX: 190 });
    expect(slide()).toBe("1");

    // Deslizar hacia la derecha muestra la bolsa (a la izquierda).
    fireEvent.pointerDown(strip, { clientX: 100 });
    fireEvent.pointerUp(strip, { clientX: 220 });
    expect(slide()).toBe("0");

    // Deslizar dos veces hacia la izquierda pasa por la estantería y llega a la mesa, sin pasarse.
    for (let i = 0; i < 3; i++) {
      fireEvent.pointerDown(strip, { clientX: 220 });
      fireEvent.pointerUp(strip, { clientX: 100 });
    }
    expect(slide()).toBe("2");
  });

  test("con mouse hay flechas que llevan a la bolsa, a la mesa y de vuelta", async () => {
    const user = userEvent.setup();
    const { slide } = setup();
    await user.click(screen.getByRole("button", { name: "Ver la bolsa" }));
    expect(slide()).toBe("0");
    expect(screen.queryByRole("button", { name: "Ver la bolsa" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver la estantería" }));
    await user.click(screen.getByRole("button", { name: "Ver la mesa" }));
    expect(slide()).toBe("2");
  });

  test("con teclado se pasa de panel con las flechas", () => {
    const { scene, slide } = setup();
    fireEvent.keyDown(scene, { key: "ArrowRight" });
    expect(slide()).toBe("2");
    fireEvent.keyDown(scene, { key: "ArrowLeft" });
    fireEvent.keyDown(scene, { key: "ArrowLeft" });
    expect(slide()).toBe("0");
  });
});

describe("RoomScene: cuadros", () => {
  test("hacer clic en un cuadro abre el mercado en ese cuadro", () => {
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Elegir la imagen del cuadro redondo" }));
    expect(screen.getByText("mercado abierto en round")).toBeInTheDocument();
  });

  test("un deslizamiento que empieza en un cuadro cambia de panel pero no abre el mercado", () => {
    const { slide } = setup();
    const frame = screen.getByRole("button", { name: "Elegir la imagen del cuadro ovalado" });
    fireEvent.pointerDown(frame, { clientX: 100 });
    fireEvent.pointerUp(frame, { clientX: 220 });
    fireEvent.click(frame);
    expect(slide()).toBe("0");
    expect(screen.queryByText(/mercado abierto/)).not.toBeInTheDocument();
  });
});

describe("RoomScene: bolsa", () => {
  test("hacer clic en la bolsa saca un libro y abre su creación", async () => {
    setup();
    expect(screen.queryByText("creando un libro")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Agregar un libro" }));
    expect(await screen.findByText("creando un libro")).toBeInTheDocument();
  });

  test("la pizarra sobre la bolsa cambia el orden y el género que ve la estantería", async () => {
    function View() {
      const { sort, genre } = use(ShelfView);
      return <p>vista: {`${sort} ${genre ?? "todos"}`}</p>;
    }
    render(
      <RoomScene genres={["Novela", "Poesía"]}>
        <View />
      </RoomScene>,
    );
    expect(screen.getByText("vista: custom todos")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByText("Recién actualizados"));
    await user.selectOptions(screen.getByRole("combobox", { name: "Filtrar por género" }), "Poesía");
    expect(screen.getByText("vista: updated Poesía")).toBeInTheDocument();
  });
});
