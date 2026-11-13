import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { RoomScene } from "./RoomScene";

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
