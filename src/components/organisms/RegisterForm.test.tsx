import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { RegisterState } from "@/app/registro/actions";
import type { Country } from "@/lib/registration";
import { RegisterForm } from "./RegisterForm";

// La server action se reemplaza: aquí solo se prueba el comportamiento del formulario.
const register = vi.hoisted(() => vi.fn<(prev: RegisterState, formData: FormData) => Promise<RegisterState>>());
vi.mock("@/app/registro/actions", () => ({ register }));

const COUNTRIES: Country[] = [
  { code: "CO", name: "Colombia", adultAge: 18 },
  { code: "HN", name: "Honduras", adultAge: 21 },
];

// Fecha de hace N años exactos (UTC), para que los tests no caduquen con el paso del tiempo.
function yearsAgo(years: number) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

const field = {
  email: () => screen.getByLabelText("Correo electrónico"),
  password: () => screen.getByLabelText("Contraseña"),
  username: () => screen.getByLabelText("Nombre de usuario"),
  country: () => screen.getByRole("combobox", { name: "País" }),
  birthDate: () => screen.getByLabelText("Fecha de nacimiento"),
};
const submit = () => screen.getByRole("button", { name: "Crear cuenta" });
const errorOf = (id: string) => document.getElementById(`${id}-error`)!;

// Elige con el calendario el día 1 del mes actual, N años atrás (como lo haría un usuario).
async function pickBirthDateWithCalendar(user: UserEvent, yearsBack: number) {
  const today = new Date();
  const year = today.getFullYear() - yearsBack;
  const month = today.toLocaleDateString("es", { month: "long" });
  await user.click(screen.getByRole("button", { name: "Elegir fecha de nacimiento" }));
  const dialog = screen.getByRole("dialog");
  await user.selectOptions(within(dialog).getByRole("combobox", { name: /año/i }), String(year));
  await user.click(within(dialog).getByRole("button", { name: new RegExp(`\\b1 de ${month} de ${year}`, "i") }));
}

async function chooseCountry(user: UserEvent, name: string) {
  await user.click(field.country());
  await user.click(screen.getByRole("option", { name }));
}

async function fillValid(user: UserEvent) {
  await user.type(field.email(), "ana@correo.com");
  await user.type(field.password(), "Clave#2026");
  await user.type(field.username(), "ana_23");
  await chooseCountry(user, "Colombia");
  await user.type(field.birthDate(), yearsAgo(30));
}

beforeEach(() => {
  register.mockReset();
  register.mockResolvedValue({});
});

describe("RegisterForm", () => {
  test("el botón está deshabilitado hasta llenar todos los campos", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    expect(submit()).toBeDisabled();

    await user.type(field.email(), "ana@correo.com");
    await user.type(field.password(), "Clave#2026");
    await user.type(field.username(), "ana_23");
    await chooseCountry(user, "Colombia");
    expect(submit()).toBeDisabled();

    await user.type(field.birthDate(), yearsAgo(30));
    expect(submit()).toBeEnabled();
  });

  test("el botón sigue deshabilitado si la persona es menor de edad, aunque todo esté lleno", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await user.type(field.email(), "ana@correo.com");
    await user.type(field.password(), "Clave#2026");
    await user.type(field.username(), "ana_23");
    await chooseCountry(user, "Colombia");
    await user.type(field.birthDate(), yearsAgo(17));
    await user.tab();
    await user.tab();
    expect(errorOf("birthDate")).toHaveTextContent("Debes tener al menos 18 años");
    expect(submit()).toBeDisabled();

    // Cambiar a una fecha válida lo habilita.
    await user.clear(field.birthDate());
    await user.type(field.birthDate(), yearsAgo(18));
    expect(submit()).toBeEnabled();
  });

  test("elegir con el calendario una fecha de menor de edad muestra el error de inmediato, aun sin país", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    // La fecha es lo primero que se llena: todavía no hay país.
    await pickBirthDateWithCalendar(user, 10);
    expect(errorOf("birthDate")).toHaveTextContent("Debes tener al menos 18 años para registrarte.");
    expect(field.birthDate()).toHaveAttribute("aria-invalid", "true");

    // Al elegir el país, el mensaje usa la mayoría de edad de ese país.
    await chooseCountry(user, "Honduras");
    expect(errorOf("birthDate")).toHaveTextContent("Debes tener al menos 21 años, la mayoría de edad en Honduras.");
    expect(submit()).toBeDisabled();
  });

  test("elegir con el calendario una fecha válida no muestra error", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await pickBirthDateWithCalendar(user, 30);
    expect(errorOf("birthDate")).toBeEmptyDOMElement();
  });

  test("el botón queda deshabilitado con cualquier campo inválido", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await fillValid(user);
    expect(submit()).toBeEnabled();

    await user.clear(field.email());
    await user.type(field.email(), "ana@correo");
    expect(submit()).toBeDisabled();
  });

  test("la lista de requisitos aparece al entrar a la contraseña y se va marcando", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    expect(screen.queryByRole("list", { name: "Requisitos de la contraseña" })).not.toBeInTheDocument();

    await user.click(field.password());
    const rules = screen.getByRole("list", { name: "Requisitos de la contraseña" });
    expect(within(rules).getAllByText(/pendiente/)).toHaveLength(5);

    await user.keyboard("clave20");
    expect(within(rules).getByText(/número/).closest("li")).toHaveClass("text-success");
    expect(within(rules).getByText(/mayúscula/).closest("li")).not.toHaveClass("text-success");
  });

  test("no muestra errores mientras se escribe, solo al salir del campo", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);

    await user.type(field.email(), "ana@correo");
    expect(errorOf("email")).toBeEmptyDOMElement();
    expect(field.email()).toHaveAttribute("aria-invalid", "false");

    await user.tab();
    expect(errorOf("email")).toHaveTextContent("El correo no es válido");
    expect(field.email()).toHaveAttribute("aria-invalid", "true");
  });

  test("un campo obligatorio vacío avisa al salir de él", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await user.click(field.username());
    await user.tab();
    expect(errorOf("username")).toHaveTextContent("El nombre de usuario es obligatorio.");
  });

  test("la lista de requisitos solo se ve con el foco en la contraseña", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    const rules = () => screen.queryByRole("list", { name: "Requisitos de la contraseña" });

    await user.type(field.password(), "Clave#2026");
    expect(rules()).toBeInTheDocument();

    await user.tab();
    expect(rules()).not.toBeInTheDocument();
    expect(errorOf("password")).toBeEmptyDOMElement();

    await user.click(field.password());
    expect(rules()).toBeInTheDocument();
  });

  test("al salir de una contraseña incompleta, el error detalla lo que falta", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await user.type(field.password(), "clave20");
    // Mientras se escribe no hay error, solo la lista.
    expect(errorOf("password")).toBeEmptyDOMElement();

    await user.tab();
    expect(screen.queryByRole("list", { name: "Requisitos de la contraseña" })).not.toBeInTheDocument();
    expect(errorOf("password")).toHaveTextContent(
      "A la contraseña le falta: entre 8 y 20 caracteres, al menos una letra mayúscula, al menos un carácter especial",
    );
    expect(field.password()).toHaveAttribute("aria-invalid", "true");
  });

  test("valida la mayoría de edad según el país y se recalcula al cambiarlo", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await chooseCountry(user, "Honduras");
    await user.type(field.birthDate(), yearsAgo(20));
    // El primer Tab va al botón del calendario, que es parte del mismo campo; el segundo sale del campo.
    await user.tab();
    expect(errorOf("birthDate")).toBeEmptyDOMElement();
    await user.tab();
    expect(errorOf("birthDate")).toHaveTextContent("Debes tener al menos 21 años, la mayoría de edad en Honduras.");

    await chooseCountry(user, "Colombia");
    expect(errorOf("birthDate")).toBeEmptyDOMElement();
  });

  test("con datos inválidos no se puede enviar y cada campo muestra su error", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await user.type(field.email(), "no-es-correo");
    await user.type(field.password(), "corta");
    await user.type(field.username(), "a");
    await chooseCountry(user, "Colombia");
    await user.type(field.birthDate(), yearsAgo(10));
    // Enter en un campo intenta el envío implícito del formulario; con el botón deshabilitado no ocurre.
    await user.keyboard("{Enter}");
    await user.tab();
    await user.tab();

    expect(submit()).toBeDisabled();
    expect(register).not.toHaveBeenCalled();
    expect(errorOf("email")).not.toBeEmptyDOMElement();
    expect(errorOf("password")).not.toBeEmptyDOMElement();
    expect(errorOf("username")).not.toBeEmptyDOMElement();
    expect(errorOf("birthDate")).toHaveTextContent("18 años");
  });

  test("con datos válidos envía todos los campos al servidor", async () => {
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await fillValid(user);
    await user.click(submit());

    expect(register).toHaveBeenCalledOnce();
    const formData = register.mock.calls[0][1];
    expect(Object.fromEntries(formData)).toEqual({
      email: "ana@correo.com",
      password: "Clave#2026",
      username: "ana_23",
      country: "CO",
      birthDate: yearsAgo(30),
    });
  });

  test("muestra el error del servidor y lo oculta al editar ese campo", async () => {
    register.mockResolvedValue({ fieldErrors: { username: "Ese nombre de usuario ya está en uso. Prueba con otro." } });
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await fillValid(user);
    await user.click(submit());

    expect(await screen.findByText("Ese nombre de usuario ya está en uso. Prueba con otro.")).toBeInTheDocument();
    await user.type(field.username(), "x");
    expect(errorOf("username")).toBeEmptyDOMElement();
  });

  test("muestra el error general del servidor", async () => {
    register.mockResolvedValue({ error: "No pudimos crear tu cuenta. Intenta de nuevo." });
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos crear tu cuenta. Intenta de nuevo.");
  });

  test("si Supabase pide confirmar el correo, reemplaza el formulario por el aviso", async () => {
    register.mockResolvedValue({ message: "Revisa tu correo para confirmar tu cuenta." });
    const user = userEvent.setup();
    render(<RegisterForm countries={COUNTRIES} />);
    await fillValid(user);
    await user.click(submit());
    expect(await screen.findByRole("status")).toHaveTextContent("Revisa tu correo para confirmar tu cuenta.");
    expect(screen.queryByRole("button", { name: "Crear cuenta" })).not.toBeInTheDocument();
  });
});
