// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { login } from "./actions";

const signInWithPassword = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { signInWithPassword } }),
}));

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));

function form(email: string, password: string) {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);
  return data;
}

beforeEach(() => {
  signInWithPassword.mockReset().mockResolvedValue({ data: { session: {} }, error: null });
  redirect.mockClear();
});

describe("login (server action)", () => {
  test("con credenciales correctas inicia sesión y redirige a /inicio", async () => {
    await expect(login({}, form("  Ana@Correo.com ", "Clave#2026"))).rejects.toThrow("NEXT_REDIRECT:/inicio");
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "ana@correo.com", password: "Clave#2026" });
  });

  test("vuelve a validar en el servidor y no llama a Supabase si hay errores", async () => {
    const result = await login({}, form("no-es-correo", ""));
    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual(["email", "password"]);
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  test("credenciales incorrectas: mensaje que no revela cuál dato falló", async () => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { code: "invalid_credentials", message: "Invalid login credentials" } });
    const result = await login({}, form("ana@correo.com", "otra"));
    expect(result).toEqual({ error: "El correo o la contraseña no son correctos." });
    expect(redirect).not.toHaveBeenCalled();
  });

  test.each([
    ["email_not_confirmed", "Confirma tu correo antes de ingresar."],
    ["over_request_rate_limit", "Demasiados intentos. Espera un momento y vuelve a intentarlo."],
    ["unexpected_failure", "No pudimos iniciar sesión. Intenta de nuevo."],
  ])("error %s", async (code, message) => {
    signInWithPassword.mockResolvedValue({ data: {}, error: { code, message: code } });
    expect(await login({}, form("ana@correo.com", "x"))).toEqual({ error: message });
  });
});
