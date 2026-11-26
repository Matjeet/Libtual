import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import type { Country } from "@/lib/registration";
import { CountrySelect } from "./CountrySelect";

const COUNTRIES: Country[] = [
  { code: "AR", name: "Argentina", adultAge: 18 },
  { code: "BO", name: "Bolivia", adultAge: 18 },
  { code: "CO", name: "Colombia", adultAge: 18 },
  { code: "CR", name: "Costa Rica", adultAge: 18 },
  { code: "CU", name: "Cuba", adultAge: 18 },
  { code: "MX", name: "México", adultAge: 18 },
  { code: "PE", name: "Perú", adultAge: 18 },
];

function Harness({ onBlur = () => {}, invalid = false, initial = "" }: { onBlur?: () => void; invalid?: boolean; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <form aria-label="form">
      <label htmlFor="country">País</label>
      <CountrySelect id="country" name="country" countries={COUNTRIES} value={value} onChange={setValue} onBlur={onBlur} invalid={invalid} />
      <button type="button">Otro</button>
    </form>
  );
}

const combobox = () => screen.getByRole("combobox", { name: "País" }) as HTMLInputElement;
const hiddenValue = () => (screen.getByRole("form").querySelector('input[name="country"]') as HTMLInputElement).value;
const visibleOptions = () => screen.queryAllByRole("option").map((option) => option.textContent);
const activeOption = () => document.getElementById(combobox().getAttribute("aria-activedescendant") ?? "");

describe("CountrySelect", () => {
  test("empieza cerrado, vacío y con el placeholder", () => {
    render(<Harness />);
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(combobox()).toHaveValue("");
    expect(combobox()).toHaveAttribute("placeholder", "Escribe o selecciona tu país");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(hiddenValue()).toBe("");
  });

  test("al hacer clic muestra todos los países con su bandera", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(combobox());
    expect(combobox()).toHaveAttribute("aria-expanded", "true");
    expect(visibleOptions()).toEqual(["Argentina", "Bolivia", "Colombia", "Costa Rica", "Cuba", "México", "Perú"]);
    expect(screen.getByRole("option", { name: "México" }).querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/flags/MX.svg"),
    );
  });

  test("escribir filtra los países que contienen el texto", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(combobox(), "c");
    // "Mexico" también contiene la c.
    expect(visibleOptions()).toEqual(["Colombia", "Costa Rica", "Cuba", "México"]);

    await user.type(combobox(), "o");
    // "Méxi-co" también contiene "co".
    expect(visibleOptions()).toEqual(["Colombia", "Costa Rica", "México"]);

    await user.type(combobox(), "l");
    expect(visibleOptions()).toEqual(["Colombia"]);
  });

  test("el filtro busca en cualquier parte del nombre, no solo al inicio", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(combobox(), "rica");
    expect(visibleOptions()).toEqual(["Costa Rica"]);
  });

  test("no distingue mayúsculas", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(combobox(), "COS");
    expect(visibleOptions()).toEqual(["Costa Rica"]);

    await user.clear(combobox());
    await user.type(combobox(), "cUbA");
    expect(visibleOptions()).toEqual(["Cuba"]);
  });

  test("no distingue tildes en ninguna dirección", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(combobox(), "mex");
    expect(visibleOptions()).toEqual(["México"]);

    await user.clear(combobox());
    await user.type(combobox(), "PERÚ");
    expect(visibleOptions()).toEqual(["Perú"]);
  });

  test("avisa cuando no hay coincidencias", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(combobox(), "xyz");
    expect(visibleOptions()).toEqual([]);
    expect(screen.getByText("No hay países que coincidan con “xyz”.")).toBeInTheDocument();
  });

  test("con el mouse: elegir una opción la selecciona y muestra el nombre", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(combobox(), "co");
    await user.click(screen.getByRole("option", { name: "Costa Rica" }));
    expect(hiddenValue()).toBe("CR");
    expect(combobox()).toHaveValue("Costa Rica");
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(combobox()).toHaveFocus();
  });

  test("con el teclado: las flechas recorren los resultados filtrados y Enter elige", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(combobox(), "c");
    expect(activeOption()).toHaveTextContent("Colombia");

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(activeOption()).toHaveTextContent("Cuba");

    await user.keyboard("{Enter}");
    expect(hiddenValue()).toBe("CU");
    expect(combobox()).toHaveValue("Cuba");
  });

  test("flecha abajo abre la lista completa desde el campo vacío", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    combobox().focus();
    await user.keyboard("{ArrowDown}");
    expect(combobox()).toHaveAttribute("aria-expanded", "true");
    expect(visibleOptions()).toHaveLength(COUNTRIES.length);
    expect(activeOption()).toHaveTextContent("Argentina");
  });

  test("Escape cierra y descarta lo escrito", async () => {
    const user = userEvent.setup();
    render(<Harness initial="PE" />);
    await user.clear(combobox());
    await user.type(combobox(), "co");
    await user.keyboard("{Escape}");
    expect(combobox()).toHaveAttribute("aria-expanded", "false");
    expect(combobox()).toHaveValue("Perú");
  });

  test("salir con texto que no es un país borra el país elegido antes", async () => {
    const user = userEvent.setup();
    render(<Harness initial="PE" />);
    await user.type(combobox(), "x");
    await user.tab();
    expect(hiddenValue()).toBe("");
    expect(combobox()).toHaveValue("");
  });

  test("salir sin escribir conserva el país elegido", async () => {
    const user = userEvent.setup();
    render(<Harness initial="PE" />);
    await user.click(combobox());
    await user.tab();
    expect(hiddenValue()).toBe("PE");
    expect(combobox()).toHaveValue("Perú");
  });

  test("al salir, si lo escrito coincide con un solo país lo elige", async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<Harness onBlur={onBlur} />);
    await user.type(combobox(), "colom");
    await user.tab();
    expect(hiddenValue()).toBe("CO");
    expect(combobox()).toHaveValue("Colombia");
    expect(onBlur).toHaveBeenCalledOnce();
  });

  test("al salir, si lo escrito no identifica un país, el campo queda vacío", async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<Harness onBlur={onBlur} />);
    await user.type(combobox(), "co");
    await user.tab();
    expect(hiddenValue()).toBe("");
    expect(combobox()).toHaveValue("");
    expect(onBlur).toHaveBeenCalledOnce();
  });

  test("refleja el estado inválido para lectores de pantalla", () => {
    render(<Harness invalid />);
    expect(combobox()).toHaveAttribute("aria-invalid", "true");
  });
});
