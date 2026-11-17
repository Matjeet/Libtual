import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test } from "vitest";
import { Combobox, type ComboboxOption } from "./Combobox";

const OPTIONS: ComboboxOption[] = [
  { value: "lora", label: "Lora", group: "Clásicas" },
  { value: "playfair", label: "Playfair Display", group: "Clásicas" },
  { value: "caveat", label: "Caveat", group: "Manuscritas" },
];

function Field({ initial, allowCustom = false }: { initial: string; allowCustom?: boolean }) {
  const [value, setValue] = useState(initial);
  return (
    <form aria-label="Libro">
      <label htmlFor="field">Campo</label>
      <Combobox id="field" name="field" options={OPTIONS} value={value} onChange={setValue} listLabel="Opciones" allowCustom={allowCustom} />
      <input aria-label="Otro" />
    </form>
  );
}

const hidden = () => screen.getByRole("form").querySelector<HTMLInputElement>('input[name="field"]')!;

describe("Combobox", () => {
  test("muestra las opciones agrupadas y elige con el mouse", async () => {
    const user = userEvent.setup();
    render(<Field initial="lora" />);
    const input = screen.getByRole("combobox", { name: "Campo" });
    expect(input).toHaveValue("Lora");

    await user.click(input);
    const list = screen.getByRole("listbox", { name: "Opciones" });
    expect(within(list).getByRole("group", { name: "Clásicas" })).toBeInTheDocument();
    expect(within(list).getByRole("group", { name: "Manuscritas" })).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Caveat" }));
    expect(input).toHaveValue("Caveat");
    expect(hidden()).toHaveValue("caveat");
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("escribir filtra (sin tildes ni mayúsculas) y Enter elige la primera coincidencia sin enviar el formulario", async () => {
    const user = userEvent.setup();
    render(<Field initial="lora" />);
    const input = screen.getByRole("combobox", { name: "Campo" });
    await user.clear(input);
    await user.type(input, "PLAY");
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Playfair Display"]);
    await user.keyboard("{Enter}");
    expect(hidden()).toHaveValue("playfair");
  });

  test("sin allowCustom, lo que no coincide se descarta y vuelve el valor anterior", async () => {
    const user = userEvent.setup();
    render(<Field initial="lora" />);
    const input = screen.getByRole("combobox", { name: "Campo" });
    await user.clear(input);
    await user.type(input, "Arial");
    expect(screen.getByRole("listbox")).toHaveTextContent("No hay opciones que coincidan con “Arial”.");
    await user.click(screen.getByRole("textbox", { name: "Otro" }));
    expect(input).toHaveValue("Lora");
    expect(hidden()).toHaveValue("lora");
  });

  test("con allowCustom guarda lo escrito, pero usa la opción si coincide", async () => {
    const user = userEvent.setup();
    render(<Field initial="" allowCustom />);
    const input = screen.getByRole("combobox", { name: "Campo" });
    await user.type(input, "Comic Sans");
    expect(screen.getByRole("listbox")).toHaveTextContent("Se guardará “Comic Sans”.");
    await user.keyboard("{Enter}");
    expect(hidden()).toHaveValue("Comic Sans");

    await user.clear(input);
    await user.type(input, "caveat");
    await user.click(screen.getByRole("textbox", { name: "Otro" }));
    expect(input).toHaveValue("Caveat");
    expect(hidden()).toHaveValue("caveat");
  });
});
