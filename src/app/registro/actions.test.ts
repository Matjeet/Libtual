// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { register } from "./actions";

type CountryRow = { code: string; name: string; adult_age: number } | null;

// Supabase simulado: cada test define qué devuelve la tabla de países, el RPC y Auth.
const db = vi.hoisted(() => ({
  country: null as CountryRow,
  rpc: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: db.country }) }) }) }),
    rpc: db.rpc,
    auth: { signUp: db.signUp },
  }),
}));

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));

function yearsAgo(years: number) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - years);
  return date.toISOString().slice(0, 10);
}

function form(overrides: Record<string, string> = {}) {
  const data = new FormData();
  const values = {
    email: "  Ana@Correo.com ",
    password: "Clave#2026",
    username: " ana_23 ",
    country: "CO",
    birthDate: yearsAgo(30),
    ...overrides,
  };
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

const session = { access_token: "token" };

beforeEach(() => {
  db.country = { code: "CO", name: "Colombia", adult_age: 18 };
  db.rpc.mockReset().mockResolvedValue({ data: true, error: null });
  db.signUp.mockReset().mockResolvedValue({ data: { session }, error: null });
  redirect.mockClear();
});

describe("register (server action)", () => {
  test("con datos válidos crea la cuenta y redirige a /inicio", async () => {
    await expect(register({}, form())).rejects.toThrow("NEXT_REDIRECT:/inicio");

    expect(db.rpc).toHaveBeenCalledWith("is_username_available", { p_username: "ana_23" });
    expect(db.signUp).toHaveBeenCalledWith({
      email: "ana@correo.com",
      password: "Clave#2026",
      options: { data: { username: "ana_23", country: "CO", birth_date: yearsAgo(30) } },
    });
    expect(redirect).toHaveBeenCalledWith("/inicio");
  });

  test("vuelve a validar en el servidor y no llama a Supabase si hay errores", async () => {
    const result = await register({}, form({ email: "no-es-correo", password: "corta", username: "a" }));

    expect(Object.keys(result.fieldErrors ?? {}).sort()).toEqual(["email", "password", "username"]);
    expect(db.rpc).not.toHaveBeenCalled();
    expect(db.signUp).not.toHaveBeenCalled();
  });

  test("rechaza un país que no está en la base de datos", async () => {
    db.country = null;
    const result = await register({}, form({ country: "ES" }));
    expect(result.fieldErrors?.country).toBe("Selecciona un país de la lista.");
    expect(db.signUp).not.toHaveBeenCalled();
  });

  test("usa la mayoría de edad de la base de datos, no la del cliente", async () => {
    db.country = { code: "HN", name: "Honduras", adult_age: 21 };
    const result = await register({}, form({ country: "HN", birthDate: yearsAgo(20) }));
    expect(result.fieldErrors?.birthDate).toBe("Debes tener al menos 21 años, la mayoría de edad en Honduras.");
    expect(db.signUp).not.toHaveBeenCalled();
  });

  test("avisa si el nombre de usuario ya está en uso", async () => {
    db.rpc.mockResolvedValue({ data: false, error: null });
    const result = await register({}, form());
    expect(result.fieldErrors?.username).toBe("Ese nombre de usuario ya está en uso. Prueba con otro.");
    expect(db.signUp).not.toHaveBeenCalled();
  });

  test("si falla la verificación del usuario devuelve un error general", async () => {
    db.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const result = await register({}, form());
    expect(result.error).toBe("No pudimos crear tu cuenta. Intenta de nuevo.");
    expect(db.signUp).not.toHaveBeenCalled();
  });

  test.each(["user_already_exists", "email_exists"])("correo ya registrado (%s)", async (code) => {
    db.signUp.mockResolvedValue({ data: { session: null }, error: { code, message: "exists" } });
    const result = await register({}, form());
    expect(result.fieldErrors?.email).toBe("Ya existe una cuenta con este correo.");
  });

  test("contraseña rechazada por Supabase", async () => {
    db.signUp.mockResolvedValue({ data: { session: null }, error: { code: "weak_password", message: "weak" } });
    const result = await register({}, form());
    expect(result.fieldErrors?.password).toBe("La contraseña es demasiado débil. Prueba con una diferente.");
  });

  test("cualquier otro error de Supabase devuelve un error general", async () => {
    db.signUp.mockResolvedValue({ data: { session: null }, error: { code: "unexpected_failure", message: "Database error" } });
    const result = await register({}, form());
    expect(result).toEqual({ error: "No pudimos crear tu cuenta. Intenta de nuevo." });
    expect(redirect).not.toHaveBeenCalled();
  });

  test("si Supabase exige confirmar el correo, avisa en vez de redirigir", async () => {
    db.signUp.mockResolvedValue({ data: { session: null }, error: null });
    const result = await register({}, form());
    expect(result).toEqual({ message: "Revisa tu correo para confirmar tu cuenta." });
    expect(redirect).not.toHaveBeenCalled();
  });
});
