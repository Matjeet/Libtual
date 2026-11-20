import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { ThemeSwitcher } from "./ThemeSwitcher";

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("ThemeSwitcher", () => {
  test("por defecto marca Predeterminado y al elegir otro modo lo aplica", async () => {
    render(<ThemeSwitcher />);
    expect(screen.getByRole("group", { name: "Modo" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Predeterminado" })).toBeChecked();
    await userEvent.setup().click(screen.getByRole("radio", { name: "Oscuro" }));
    expect(screen.getByRole("radio", { name: "Oscuro" })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  test("muestra marcado el modo que ya estaba elegido", () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeSwitcher />);
    expect(screen.getByRole("radio", { name: "Claro" })).toBeChecked();
  });
});
