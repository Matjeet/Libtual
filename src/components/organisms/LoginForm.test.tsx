import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, onTestFinished, test, vi } from "vitest";
import type { LoginState } from "@/app/ingresar/actions";
import { LoginForm } from "./LoginForm";

// La server action se reemplaza: aquí solo se prueba el comportamiento del formulario.
const login = vi.hoisted(() => vi.fn<(prev: LoginState, formData: FormData) => Promise<LoginState>>());
vi.mock("@/app/ingresar/actions", () => ({ login }));

const email = () => screen.getByLabelText("Correo electrónico");
const password = () => screen.getByLabelText("Contraseña");
const submit = () => screen.getByRole("button", { name: /Ingresa/ });
const errorOf = (id: string) => document.getElementById(`${id}-error`)!;

async function fillValid(user: UserEvent) {
  await user.type(email(), "ana@correo.com");
  await user.type(password(), "Clave#2026");
}

beforeEach(() => {
  login.mockReset();
  login.mockResolvedValue({});
});

describe("LoginForm", () => {
  test("el botón está deshabilitado hasta tener un correo válido y una contraseña", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    expect(submit()).toBeDisabled();

    await user.type(email(), "ana@correo");
    await user.type(password(), "x");
    expect(submit()).toBeDisabled();

    await user.type(email(), ".com");
    expect(submit()).toBeEnabled();
  });

  test("los errores aparecen al salir de cada campo, no mientras se escribe", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(email(), "ana@correo");
    expect(errorOf("email")).toBeEmptyDOMElement();

    await user.tab();
    expect(errorOf("email")).toHaveTextContent("El correo no es válido");
    await user.tab();
    expect(errorOf("password")).toHaveTextContent("La contraseña es obligatoria.");
  });

  test("con datos válidos envía correo y contraseña al servidor", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await fillValid(user);
    await user.click(submit());

    expect(login).toHaveBeenCalledOnce();
    expect(Object.fromEntries(login.mock.calls[0][1])).toEqual({ email: "ana@correo.com", password: "Clave#2026" });
  });

  test("muestra el error del servidor y lo oculta mientras se reintenta", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await fillValid(user);

    login.mockResolvedValueOnce({ error: "El correo o la contraseña no son correctos." });
    await user.click(submit());
    expect(await screen.findByRole("alert")).toHaveTextContent("El correo o la contraseña no son correctos.");

    let respond!: (state: LoginState) => void;
    login.mockImplementationOnce(() => new Promise((resolve) => (respond = resolve)));
    // Si un expect falla antes de responder, la acción quedaría pendiente y enredaría los tests siguientes.
    onTestFinished(() => respond?.({}));
    await user.click(submit());
    expect(screen.getByRole("button", { name: "Ingresando..." })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    respond({ error: "El correo o la contraseña no son correctos." });
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
