import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { HeaderActions } from "./HeaderActions";

// Supabase simulado: cada test define la sesión y el perfil.
const db = vi.hoisted(() => ({ userId: undefined as string | undefined, profile: null as unknown }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.userId ? { claims: { sub: db.userId } } : null }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.profile }) }) }) }),
  }),
}));
vi.mock("@/lib/profile", () => ({ checkUsername: vi.fn(), updateUsername: vi.fn() }));

beforeEach(() => {
  db.userId = undefined;
  db.profile = null;
});

describe("HeaderActions", () => {
  test("sin sesión muestra Ingresar solo si la página lo pide", async () => {
    const { unmount } = render(await HeaderActions({ showSignIn: false }));
    expect(screen.queryByRole("link", { name: "Ingresar" })).not.toBeInTheDocument();
    unmount();

    render(await HeaderActions({ showSignIn: true }));
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/ingresar");
  });

  test("con sesión muestra el icono del perfil en lugar de Ingresar", async () => {
    db.userId = "user-1";
    db.profile = { email: "ana@correo.com", username: "ana_23", country_code: "CO", countries: { name: "Colombia" } };
    render(await HeaderActions({ showSignIn: true }));
    expect(screen.getByRole("button", { name: "Mi perfil" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ingresar" })).not.toBeInTheDocument();
  });
});
