import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { DateField } from "./DateField";

function Harness({ initial = "", onBlur = () => {} }: { initial?: string; onBlur?: () => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="birthDate">Fecha de nacimiento</label>
      <DateField id="birthDate" name="birthDate" calendarLabel="Elegir fecha" value={value} onChange={setValue} onBlur={onBlur} />
      <output data-testid="value">{value}</output>
      <button type="button">Siguiente</button>
    </>
  );
}

const input = () => screen.getByLabelText("Fecha de nacimiento") as HTMLInputElement;
const calendarButton = () => screen.getByRole("button", { name: "Elegir fecha" });
const value = () => screen.getByTestId("value").textContent;

describe("DateField", () => {
  test("se puede escribir la fecha en el input nativo", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(input(), "1995-05-20");
    expect(value()).toBe("1995-05-20");
  });

  test("el botón abre el calendario en español", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1995-05-20" />);
    expect(calendarButton()).toHaveAttribute("aria-expanded", "false");

    await user.click(calendarButton());
    const dialog = screen.getByRole("dialog", { name: "Elegir fecha" });
    expect(calendarButton()).toHaveAttribute("aria-expanded", "true");
    // Abre en el mes de la fecha ya escrita, con selectores de mes y año.
    expect(within(dialog).getByRole("combobox", { name: /mes/i })).toHaveDisplayValue(/mayo/i);
    expect(within(dialog).getByRole("combobox", { name: /año/i })).toHaveDisplayValue("1995");
  });

  test("elegir un día llena el input y cierra el calendario", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1995-05-20" />);
    await user.click(calendarButton());
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /\b8 de mayo de 1995/i }));
    expect(value()).toBe("1995-05-08");
    expect(input().value).toBe("1995-05-08");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(calendarButton()).toHaveFocus();
  });

  test("cambiar el año con el selector y elegir un día", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1995-05-20" />);
    await user.click(calendarButton());
    const dialog = screen.getByRole("dialog");

    await user.selectOptions(within(dialog).getByRole("combobox", { name: /año/i }), "1980");
    await user.click(within(dialog).getByRole("button", { name: /15 de mayo de 1980/i }));
    expect(value()).toBe("1980-05-15");
  });

  test("no permite elegir fechas futuras", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(calendarButton());
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const month = tomorrow.toLocaleDateString("es", { month: "long" });
    const label = new RegExp(`\\b${tomorrow.getDate()} de ${month} de ${tomorrow.getFullYear()}`, "i");
    const days = within(screen.getByRole("dialog")).queryAllByRole("button", { name: label });

    // El calendario abre en el mes actual: si mañana cae en este mes, debe verse y estar deshabilitado.
    if (tomorrow.getMonth() === today.getMonth()) expect(days).toHaveLength(1);
    days.forEach((day) => expect(day).toBeDisabled());
  });

  test("Escape cierra el calendario sin cambiar el valor", async () => {
    const user = userEvent.setup();
    render(<Harness initial="1995-05-20" />);
    await user.click(calendarButton());
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(value()).toBe("1995-05-20");
    expect(calendarButton()).toHaveFocus();
  });

  test("pasar del input al botón no cuenta como salir del campo", async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<Harness onBlur={onBlur} />);
    await user.click(input());
    await user.tab();
    expect(calendarButton()).toHaveFocus();
    expect(onBlur).not.toHaveBeenCalled();

    await user.tab();
    expect(onBlur).toHaveBeenCalledOnce();
  });
});
