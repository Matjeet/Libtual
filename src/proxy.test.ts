// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { proxy } from "./proxy";

// Supabase simulado: solo importa si hay sesión.
const session = vi.hoisted(() => ({ active: false }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims: async () => ({ data: session.active ? { claims: { sub: "user-1" } } : null }) },
  }),
}));

const visit = (path: string) => proxy(new NextRequest(`http://localhost:3000${path}`));
const redirectedTo = (response: Response) => response.headers.get("location");

beforeEach(() => {
  session.active = false;
});

describe("proxy", () => {
  test("con sesión, abrir la raíz lleva a /inicio", async () => {
    session.active = true;
    expect(redirectedTo(await visit("/"))).toBe("http://localhost:3000/inicio");
  });

  test("con sesión, el registro y el login también llevan a /inicio", async () => {
    session.active = true;
    expect(redirectedTo(await visit("/registro"))).toBe("http://localhost:3000/inicio");
    expect(redirectedTo(await visit("/ingresar"))).toBe("http://localhost:3000/inicio");
  });

  test("sin sesión, la raíz se queda en la raíz y /inicio lleva al login", async () => {
    expect(redirectedTo(await visit("/"))).toBeNull();
    expect(redirectedTo(await visit("/inicio"))).toBe("http://localhost:3000/ingresar");
  });
});
