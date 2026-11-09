import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { UsernameResult } from "@/lib/profile";
import { ProfileMenu, type Profile } from "./ProfileMenu";

// Las server actions se reemplazan: aquí solo se prueba el comportamiento del menú.
const actions = vi.hoisted(() => ({
  checkUsername: vi.fn<(username: string) => Promise<UsernameResult>>(),
  updateUsername: vi.fn<(username: string) => Promise<UsernameResult>>(),
}));
vi.mock("@/lib/profile", () => actions);

const PROFILE: Profile = { email: "ana@correo.com", username: "ana_23", countryCode: "CO", countryName: "Colombia" };

const trigger = () => screen.getByRole("button", { name: "Mi perfil" });
const usernameInput = () => screen.getByLabelText("Nombre de usuario");
const pencil = () => screen.getByRole("button", { name: "Editar nombre de usuario" });
const saveButton = () => screen.getByRole("button", { name: "Guardar" });
const usernameError = () => document.getElementById("profile-username-error")!;

async function openAndEdit(user: UserEvent, value: string) {
  await user.click(trigger());
  await user.click(pencil());
  await user.clear(usernameInput());
  await user.type(usernameInput(), value);
}

beforeEach(() => {
  actions.checkUsername.mockReset();
  actions.updateUsername.mockReset();
});

describe("ProfileMenu", () => {
  test("al pulsar el icono muestra correo, nombre de usuario y país sin navegar", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    expect(screen.queryByRole("dialog", { name: "Mi perfil" })).not.toBeInTheDocument();

    await user.click(trigger());
    const menu = screen.getByRole("dialog", { name: "Mi perfil" });
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(within(menu).getByText("ana@correo.com")).toBeInTheDocument();
    expect(usernameInput()).toHaveValue("ana_23");
    expect(within(menu).getByText("Colombia")).toBeInTheDocument();
  });

  test("el nombre de usuario se habilita con el lápiz y Guardar solo cuando cambia", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await user.click(trigger());
    expect(usernameInput()).toBeDisabled();
    expect(saveButton()).toBeDisabled();

    await user.click(pencil());
    expect(usernameInput()).toBeEnabled();
    expect(usernameInput()).toHaveFocus();
    expect(saveButton()).toBeDisabled();

    await user.type(usernameInput(), "x");
    expect(saveButton()).toBeEnabled();
  });

  test("aplica las mismas reglas que el registro sin llamar al servidor", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await openAndEdit(user, "ana maría");
    await user.click(saveButton());

    expect(usernameError()).toHaveTextContent("Usa solo letras sin tildes, números y guion bajo (_), sin espacios.");
    expect(actions.checkUsername).not.toHaveBeenCalled();
  });

  test("si el nombre ya existe muestra el error y no pide confirmación", async () => {
    actions.checkUsername.mockResolvedValue({ error: "Ese nombre de usuario ya está en uso. Prueba con otro." });
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await openAndEdit(user, "pedro");
    await user.click(saveButton());

    expect(actions.checkUsername).toHaveBeenCalledWith("pedro");
    expect(await screen.findByText("Ese nombre de usuario ya está en uso. Prueba con otro.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "¿Cambiar tu nombre de usuario?" })).not.toBeInTheDocument();
  });

  test("pide confirmación con la advertencia del buscador y guarda al confirmar", async () => {
    actions.checkUsername.mockResolvedValue({ username: "ana_lee" });
    actions.updateUsername.mockResolvedValue({ username: "ana_lee" });
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await openAndEdit(user, "ana_lee");
    await user.click(saveButton());

    const modal = await screen.findByRole("dialog", { name: "¿Cambiar tu nombre de usuario?" });
    expect(modal).toHaveTextContent("Tu nombre de usuario pasará de ana_23 a ana_lee.");
    expect(modal).toHaveTextContent("ya no podrán encontrar tu perfil desde el buscador");
    expect(actions.updateUsername).not.toHaveBeenCalled();

    await user.click(within(modal).getByRole("button", { name: "Sí, cambiarlo" }));
    expect(actions.updateUsername).toHaveBeenCalledWith("ana_lee");
    expect(await screen.findByText("Tu nombre de usuario se actualizó.")).toBeInTheDocument();
    expect(usernameInput()).toHaveValue("ana_lee");
    expect(usernameInput()).toBeDisabled();
    expect(screen.queryByRole("dialog", { name: "¿Cambiar tu nombre de usuario?" })).not.toBeInTheDocument();
  });

  test("cancelar el modal no guarda nada", async () => {
    actions.checkUsername.mockResolvedValue({ username: "ana_lee" });
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await openAndEdit(user, "ana_lee");
    await user.click(saveButton());

    const modal = await screen.findByRole("dialog", { name: "¿Cambiar tu nombre de usuario?" });
    await user.click(within(modal).getByRole("button", { name: "Cancelar" }));
    expect(actions.updateUsername).not.toHaveBeenCalled();
    expect(usernameInput()).toHaveValue("ana_lee");
  });

  test("cerrar el menú descarta la edición", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await openAndEdit(user, "otro");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Mi perfil" })).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();

    await user.click(trigger());
    expect(usernameInput()).toHaveValue("ana_23");
    expect(usernameInput()).toBeDisabled();
  });

  test("el botón Eliminar perfil está visible y por ahora no hace nada", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Eliminar perfil" }));
    expect(screen.getByRole("dialog", { name: "Mi perfil" })).toBeInTheDocument();
    expect(actions.checkUsername).not.toHaveBeenCalled();
    expect(actions.updateUsername).not.toHaveBeenCalled();
  });
});
