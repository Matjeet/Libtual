import { describe, expect, test } from "vitest";
import { validateLogin, validateLoginField } from "./login.ts";

describe("validación del login", () => {
  test("valores válidos no tienen errores", () => {
    expect(validateLogin({ email: "ana@correo.com", password: "x" })).toEqual({});
  });

  test("ambos campos son obligatorios", () => {
    expect(validateLogin({ email: "", password: "" })).toEqual({
      email: "El correo es obligatorio.",
      password: "La contraseña es obligatoria.",
    });
  });

  test("el correo debe tener un formato válido y se ignoran espacios", () => {
    expect(validateLoginField("email", { email: "ana@correo", password: "x" })).toMatch(/no es válido/);
    expect(validateLoginField("email", { email: "  ana@correo.com  ", password: "x" })).toBeUndefined();
  });

  test("la contraseña no se valida contra los requisitos de creación", () => {
    expect(validateLoginField("password", { email: "ana@correo.com", password: "corta" })).toBeUndefined();
  });
});
