import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { ShelfChalkboard } from "./ShelfChalkboard";

function setup(sort: "custom" | "newest" = "custom", genre: string | null = null) {
  const onSortChange = vi.fn();
  const onGenreChange = vi.fn();
  render(
    <ShelfChalkboard sort={sort} onSortChange={onSortChange} genre={genre} onGenreChange={onGenreChange} genres={["Novela", "Poesía"]} />,
  );
  return { onSortChange, onGenreChange };
}

describe("ShelfChalkboard", () => {
  test("ordena por una sola opción a la vez, marcada con su check", async () => {
    const { onSortChange } = setup();
    const group = screen.getByRole("group", { name: "Ordenado por" });
    expect(group).toBeInTheDocument();
    const options = screen.getAllByRole("radio");
    expect(options.map((option) => option.parentElement!.textContent)).toEqual(["Personalizado", "Más antiguos", "Más nuevos", "Recién actualizados"]);
    expect(screen.getByRole("radio", { name: "Personalizado" })).toBeChecked();
    await userEvent.setup().click(screen.getByText("Más nuevos"));
    expect(onSortChange).toHaveBeenCalledWith("newest");
  });

  test("filtra por los géneros de la estantería; vacío es todos", async () => {
    const { onGenreChange } = setup("custom", "Poesía");
    const select = screen.getByRole("combobox", { name: "Filtrar por género" });
    expect(select).toHaveValue("Poesía");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Todos los géneros", "Novela", "Poesía"]);
    await userEvent.setup().selectOptions(select, "Novela");
    expect(onGenreChange).toHaveBeenLastCalledWith("Novela");
    await userEvent.setup().selectOptions(select, "Todos los géneros");
    expect(onGenreChange).toHaveBeenLastCalledWith(null);
  });

  test("las flechas del teclado no llegan al carrusel de la habitación", () => {
    const outside = vi.fn();
    render(
      <div onKeyDown={outside}>
        <ShelfChalkboard sort="custom" onSortChange={vi.fn()} genre={null} onGenreChange={vi.fn()} genres={[]} />
      </div>,
    );
    fireEvent.keyDown(screen.getByRole("radio", { name: "Personalizado" }), { key: "ArrowRight" });
    expect(outside).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("radio", { name: "Personalizado" }), { key: "Enter" });
    expect(outside).toHaveBeenCalled();
  });
});
