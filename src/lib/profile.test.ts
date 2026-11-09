// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { checkUsername, deleteAccount, updateUsername } from "./profile";

// Supabase simulado: sesión, perfil actual, RPC de disponibilidad y resultado del update.
const db = vi.hoisted(() => ({
  userId: "user-1" as string | undefined,
  current: "ana_23",
  rpc: vi.fn(),
  update: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getClaims: async () => ({ data: db.userId ? { claims: { sub: db.userId } } : null }),
      signOut: db.signOut,
    },
    rpc: db.rpc,
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { username: db.current } }) }) }),
      update: (values: unknown) => ({ eq: () => ({ select: () => ({ maybeSingle: () => db.update(values) }) }) }),
    }),
  }),
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ refresh }));

beforeEach(() => {
  db.userId = "user-1";
  db.current = "ana_23";
  db.rpc.mockReset().mockResolvedValue({ data: true, error: null });
  db.update.mockReset().mockImplementation(async ({ username }: { username: string }) => ({ data: { username }, error: null }));
  refresh.mockReset();
  db.signOut.mockReset().mockResolvedValue({ error: null });
});

describe("checkUsername", () => {
  test("aplica las reglas del registro antes de consultar la base de datos", async () => {
    expect(await checkUsername("ab")).toEqual({ error: "El nombre de usuario debe tener entre 3 y 20 caracteres." });
    expect(await checkUsername("ana maría")).toEqual({ error: "Usa solo letras sin tildes, números y guion bajo (_), sin espacios." });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  test("rechaza un nombre que ya existe", async () => {
    db.rpc.mockResolvedValue({ data: false, error: null });
    expect(await checkUsername(" pedro ")).toEqual({ error: "Ese nombre de usuario ya está en uso. Prueba con otro." });
    expect(db.rpc).toHaveBeenCalledWith("is_username_available", { p_username: "pedro" });
  });

  test("acepta un nombre libre y no escribe nada", async () => {
    expect(await checkUsername("ana_lee")).toEqual({ username: "ana_lee" });
    expect(db.update).not.toHaveBeenCalled();
  });

  test("cambiar solo mayúsculas del propio nombre no choca consigo mismo", async () => {
    expect(await checkUsername("Ana_23")).toEqual({ username: "Ana_23" });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  test("el mismo nombre o sin sesión no se aceptan", async () => {
    expect(await checkUsername("ana_23")).toEqual({ error: "Ese ya es tu nombre de usuario." });
    db.userId = undefined;
    expect(await checkUsername("ana_lee")).toEqual({ error: "Tu sesión terminó. Vuelve a ingresar." });
  });
});

describe("updateUsername", () => {
  test("vuelve a validar, guarda y refresca la página", async () => {
    expect(await updateUsername(" ana_lee ")).toEqual({ username: "ana_lee" });
    expect(db.update).toHaveBeenCalledWith({ username: "ana_lee" });
    expect(refresh).toHaveBeenCalled();
  });

  test("si otra persona tomó el nombre justo antes, lo informa", async () => {
    db.update.mockResolvedValue({ data: null, error: { code: "23505" } });
    expect(await updateUsername("ana_lee")).toEqual({ error: "Ese nombre de usuario ya está en uso. Prueba con otro." });
    expect(refresh).not.toHaveBeenCalled();
  });

  test("sin permiso de escritura o ante otro error, da un mensaje genérico", async () => {
    db.update.mockResolvedValue({ data: null, error: null });
    expect(await updateUsername("ana_lee")).toEqual({ error: "No pudimos actualizar tu nombre de usuario. Intenta de nuevo." });
  });
});

describe("deleteAccount", () => {
  test("sin contraseña o sin sesión no llama a la base de datos", async () => {
    expect(await deleteAccount("")).toEqual({ error: "Escribe tu contraseña." });
    db.userId = undefined;
    expect(await deleteAccount("Clave#2026")).toEqual({ error: "Tu sesión terminó. Vuelve a ingresar." });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  test("con la contraseña incorrecta no elimina nada ni cierra la sesión", async () => {
    db.rpc.mockResolvedValue({ data: false, error: null });
    expect(await deleteAccount("otra")).toEqual({ error: "La contraseña no es correcta." });
    expect(db.rpc).toHaveBeenCalledWith("delete_own_account", { p_password: "otra" });
    expect(db.signOut).not.toHaveBeenCalled();
  });

  test("si la base de datos falla da un mensaje genérico", async () => {
    db.rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await deleteAccount("Clave#2026")).toEqual({ error: "No pudimos eliminar tu cuenta. Intenta de nuevo." });
  });

  test("con la contraseña correcta elimina la cuenta y borra la sesión local", async () => {
    db.rpc.mockResolvedValue({ data: true, error: null });
    expect(await deleteAccount(" Clave#2026 ")).toEqual({ deleted: true });
    // La contraseña se envía tal cual: los espacios pueden ser parte de ella.
    expect(db.rpc).toHaveBeenCalledWith("delete_own_account", { p_password: " Clave#2026 " });
    expect(db.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
