import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test } from "vitest";
import { ThemeSwitcher } from "./ThemeSwitcher";

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("ThemeSwitcher", () => {
  test("Tema despliega las opciones; por defecto Predeterminado y al elegir otra la aplica", async () => {
    const user = userEvent.setup();
    render(<ThemeSwitcher />);
    const title = screen.getByRole("button", { name: "Tema" });
    expect(title).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();

    await user.click(title);
    expect(title).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Tema" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio").map((radio) => radio.closest("label")!.textContent)).toEqual(["Predeterminado", "Claro", "Oscuro"]);
    expect(screen.getByRole("radio", { name: "Predeterminado" })).toBeChecked();

    await user.click(screen.getByRole("radio", { name: "Oscuro" }));
    expect(screen.getByRole("radio", { name: "Oscuro" })).toBeChecked();
    expect(document.documentElement.dataset.theme).toBe("dark");

    await user.click(title);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  test("muestra marcado el modo que ya estaba elegido", async () => {
    document.documentElement.dataset.theme = "light";
    render(<ThemeSwitcher />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tema" }));
    expect(screen.getByRole("radio", { name: "Claro" })).toBeChecked();
  });
});
