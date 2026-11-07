import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import type { Country } from "@/lib/registration";
import { CountrySelect } from "./CountrySelect";

const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", adultAge: 18 },
  { code: "BO", name: "Bolivia", adultAge: 18 },
  // Señuelo: sin normalizar tildes, "me" no coincidiría con "Mé" y la búsqueda se quedaría en Mali.
  { code: "ML", name: "Mali", adultAge: 18 },
  { code: "MX", name: "México", adultAge: 18 },
  { code: "PE", name: "Perú", adultAge: 18 },
];

function Harness({ onBlur = () => {}, invalid = false }: { onBlur?: () => void; invalid?: boolean }) {
  const [value, setValue] = useState("");
  return (
    <form aria-label="form">
      <label htmlFor="country">País</label>
      <CountrySelect id="country" name="country" countries={COUNTRIES} value={value} onChange={setValue} onBlur={onBlur} invalid={invalid} />
      <button type="button">Otro</button>
    </form>
  );
}

const combobox = () => screen.getByRole("combobox", { name: "País" });
const hiddenValue = () => (screen.getByRole("form").querySelector('input[name="country"]') as HTMLInputElement).value;
const activeOption = () => document.getElementById(combobox().getAttribute("aria-activedescendant") ?? "");

describe("CountrySelect", () => {
  test("empieza cerrado, con el placeholder y sin valor", () => {
    render(<Harness />);
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(combobox()).toHaveTextContent("Selecciona tu país");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(hiddenValue()).toBe("");
  });

  test("con el mouse: abre, muestra banderas y selecciona", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(combobox());
    expect(combobox()).toHaveAttribute("aria-expanded", "true");
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Argentina", "Bolivia", "Mali", "México", "Perú"]);
    expect(options[3].querySelector("img")).toHaveAttribute("src", expect.stringContaining("/flags/MX.svg"));

    await user.click(screen.getByRole("option", { name: "México" }));
    expect(hiddenValue()).toBe("MX");
    expect(combobox()).toHaveTextContent("México");
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(combobox()).toHaveFocus();
  });

  test("con el teclado: flechas para moverse y Enter para elegir", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    combobox().focus();

    await user.keyboard("{ArrowDown}");
    expect(combobox()).toHaveAttribute("aria-expanded", "true");
    expect(activeOption()).toHaveTextContent("Argentina");

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(activeOption()).toHaveTextContent("México");

    await user.keyboard("{Enter}");
    expect(hiddenValue()).toBe("MX");
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
  });

  test("la opción seleccionada queda marcada con aria-selected", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(combobox());
    await user.click(screen.getByRole("option", { name: "Bolivia" }));
    await user.click(combobox());
    expect(screen.getByRole("option", { name: "Bolivia" })).toHaveAttribute("aria-selected", "true");
    expect(activeOption()).toHaveTextContent("Bolivia");
  });

  test("Escape cierra sin cambiar el valor", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    combobox().focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Escape}");
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(hiddenValue()).toBe("");
  });

  test("escribir con la lista cerrada elige el país, sin importar tildes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    combobox().focus();
    await user.keyboard("pe");
    expect(hiddenValue()).toBe("PE");
  });

  test("letras sin tilde encuentran nombres con tilde", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    combobox().focus();
    await user.keyboard("mex");
    expect(hiddenValue()).toBe("MX");
  });

  test("avisa al salir del campo", async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<Harness onBlur={onBlur} />);
    await user.click(combobox());
    await user.tab();
    expect(onBlur).toHaveBeenCalledOnce();
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
  });

  test("refleja el estado inválido para lectores de pantalla", () => {
    render(<Harness invalid />);
    expect(combobox()).toHaveAttribute("aria-invalid", "true");
  });
});
