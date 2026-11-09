import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { DeleteAccountResult } from "@/lib/profile";
import { DeleteAccount } from "./DeleteAccount";

// La server action y el router se reemplazan: aquí solo se prueba el flujo del modal.
const deleteAccount = vi.hoisted(() => vi.fn<(password: string) => Promise<DeleteAccountResult>>());
vi.mock("@/lib/profile", () => ({ deleteAccount }));
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const modal = () => screen.getByRole("dialog");
const button = (name: string) => within(modal()).getByRole("button", { name });

async function goToPassword(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
  await user.click(button("Continuar"));
}

beforeEach(() => {
  deleteAccount.mockReset();
  router.replace.mockReset();
  router.refresh.mockReset();
});

describe("DeleteAccount", () => {
  test("primero advierte que la acción es irreversible, con Cancelar como opción principal", async () => {
    const user = userEvent.setup();
    render(<DeleteAccount />);
    await user.click(screen.getByRole("button", { name: "Eliminar cuenta" }));

    expect(modal()).toHaveAccessibleName("¿Eliminar tu cuenta?");
    expect(modal()).toHaveTextContent("Esta acción es irreversible");
    expect(modal()).toHaveTextContent("todos sus datos se perderán definitivamente");
    expect(button("Cancelar")).toHaveFocus();
    expect(button("Cancelar").className).toContain("bg-primary");
    expect(button("Continuar").className).toContain("bg-transparent");
  });

  test("Cancelar cierra sin pedir la contraseña", async () => {
    const user = userEvent.setup();
    render(<DeleteAccount />);
    await user.click(screen.getByRole("button", { name: "Eliminar cuenta" }));
    await user.click(button("Cancelar"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(deleteAccount).not.toHaveBeenCalled();
  });

  test("Continuar pide la contraseña y el botón rojo se habilita al escribir algo", async () => {
    const user = userEvent.setup();
    render(<DeleteAccount />);
    await goToPassword(user);

    expect(modal()).toHaveAccessibleName("Confirma con tu contraseña");
    const password = within(modal()).getByLabelText("Contraseña");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveFocus();
    expect(button("Eliminar cuenta")).toBeDisabled();
    expect(button("Eliminar cuenta").className).toContain("bg-destructive");

    await user.type(password, "x");
    expect(button("Eliminar cuenta")).toBeEnabled();
  });

  test("con la contraseña incorrecta muestra el error y no elimina", async () => {
    deleteAccount.mockResolvedValue({ error: "La contraseña no es correcta." });
    const user = userEvent.setup();
    render(<DeleteAccount />);
    await goToPassword(user);
    await user.type(within(modal()).getByLabelText("Contraseña"), "otra");
    await user.click(button("Eliminar cuenta"));

    expect(deleteAccount).toHaveBeenCalledWith("otra");
    expect(await within(modal()).findByText("La contraseña no es correcta.")).toBeInTheDocument();
    expect(modal()).toHaveAccessibleName("Confirma con tu contraseña");
  });

  test("con la contraseña correcta se despide y luego lleva a la página inicial", async () => {
    deleteAccount.mockResolvedValue({ deleted: true });
    const user = userEvent.setup();
    render(<DeleteAccount />);
    await goToPassword(user);
    await user.type(within(modal()).getByLabelText("Contraseña"), "Clave#2026");
    await user.click(button("Eliminar cuenta"));

    expect(await screen.findByRole("heading", { name: "Lamentamos que te vayas" })).toBeInTheDocument();
    expect(modal()).toHaveTextContent("Esperamos que pronto vuelvas a Libtual.");
    expect(router.replace).not.toHaveBeenCalled();

    await user.click(button("Ir al inicio"));
    expect(router.replace).toHaveBeenCalledWith("/");
    expect(router.refresh).toHaveBeenCalled();
  });
});
