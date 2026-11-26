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
const signOut = vi.hoisted(() => vi.fn(async () => {}));
vi.mock("@/lib/auth", () => ({ signOut }));
// El flujo de eliminación se prueba en DeleteAccount.test.tsx.
vi.mock("@/components/organisms/DeleteAccount", () => ({ DeleteAccount: () => <button type="button">Eliminar cuenta</button> }));

const PROFILE: Profile = { email: "ana@correo.com", username: "ana_23", countryCode: "CO", countryName: "Colombia" };

const trigger = () => screen.getByRole("button", { name: "Mi perfil" });
const usernameInput = () => screen.getByLabelText("Nombre de usuario");
const pencil = () => screen.getByRole("button", { name: "Editar nombre de usuario" });
const saveButton = () => screen.getByRole("button", { name: "Guardar" });
const menu = () => screen.getByRole("dialog", { name: "Mi perfil" });
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
  signOut.mockClear();
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
    expect(within(menu).getByText("ana_23")).toBeInTheDocument();
    expect(within(menu).getByText("Colombia")).toBeInTheDocument();
  });

  test("el lápiz convierte el nombre en un campo editable y muestra Guardar, activo solo cuando cambia", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await user.click(trigger());
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();

    await user.click(pencil());
    expect(usernameInput()).toHaveValue("ana_23");
    expect(usernameInput()).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Editar nombre de usuario" })).not.toBeInTheDocument();
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

    await user.click(within(modal).getByRole("button", { name: "Sí, cámbialo" }));
    expect(actions.updateUsername).toHaveBeenCalledWith("ana_lee");
    expect(await screen.findByText("Tu nombre de usuario se actualizó.")).toBeInTheDocument();
    expect(within(menu()).getByText("ana_lee")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar" })).not.toBeInTheDocument();
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
    expect(within(menu()).getByText("ana_23")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  test("muestra el botón Eliminar cuenta al final del menú", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await user.click(trigger());
    expect(within(menu()).getByRole("button", { name: "Eliminar cuenta" })).toBeInTheDocument();
  });

  test("Cerrar sesión va arriba de los datos del perfil y llama a la acción", async () => {
    const user = userEvent.setup();
    render(<ProfileMenu profile={PROFILE} />);
    await user.click(trigger());
    const logout = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(logout.compareDocumentPosition(screen.getByText("Correo")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(logout);
    expect(signOut).toHaveBeenCalled();
  });
});
