import assert from "node:assert/strict";
import { test } from "vitest";
import { PASSWORD_RULES, validateAll, validateField, type Country, type RegisterValues } from "./registration.ts";

const TODAY = "2026-11-07";
const colombia: Country = { code: "CO", name: "Colombia", adultAge: 18 };
const honduras: Country = { code: "HN", name: "Honduras", adultAge: 21 };
const valid: RegisterValues = {
  email: "ana@correo.com",
  password: "Clave#2026",
  username: "ana_23",
  country: "CO",
  birthDate: "2000-01-15",
};

const passed = (password: string) => PASSWORD_RULES.filter((r) => r.test(password)).map((r) => r.id);

test("valores válidos no tienen errores", () => {
  assert.deepEqual(validateAll(valid, colombia, TODAY), {});
});

test("todos los campos son obligatorios", () => {
  const empty = { email: "", password: "", username: "", country: "", birthDate: "" };
  assert.deepEqual(Object.keys(validateAll(empty, undefined, TODAY)).sort(), ["birthDate", "country", "email", "password", "username"]);
});

test("reglas de contraseña", () => {
  assert.deepEqual(passed("Clave#2026"), ["length", "number", "upper", "lower", "special"]);
  assert.deepEqual(passed("Ab1#"), ["number", "upper", "lower", "special"]);
  assert.ok(!passed("Abcdefgh1#abcdefghijk").includes("length"), "21 caracteres excede el máximo");
  assert.ok(passed("Ñandú#2026x").includes("upper"), "la Ñ cuenta como mayúscula");
  assert.ok(!passed("Clave2026").includes("special"));
});

test("el error de contraseña dice exactamente qué falta", () => {
  assert.equal(
    validateField("password", { ...valid, password: "clave2026" }, colombia, TODAY),
    "A la contraseña le falta: al menos una letra mayúscula, al menos un carácter especial (por ejemplo ! @ # $ . -).",
  );
});

test("nombre de usuario", () => {
  assert.match(validateField("username", { ...valid, username: "ab" }, colombia, TODAY)!, /entre 3 y 20/);
  assert.match(validateField("username", { ...valid, username: "josé" }, colombia, TODAY)!, /sin tildes/);
});

test("fecha de nacimiento", () => {
  assert.match(validateField("birthDate", { ...valid, birthDate: "2023-02-30" }, colombia, TODAY)!, /no es válida/);
  assert.match(validateField("birthDate", { ...valid, birthDate: "2027-01-01" }, colombia, TODAY)!, /futuro/);
  assert.equal(validateField("birthDate", { ...valid, birthDate: "2008-11-07" }, colombia, TODAY), undefined);
  assert.match(validateField("birthDate", { ...valid, birthDate: "2008-11-08" }, colombia, TODAY)!, /18 años/);
  assert.match(validateField("birthDate", { ...valid, birthDate: "2006-01-01" }, honduras, TODAY)!, /21 años.*Honduras/);
});

test("país fuera de la lista", () => {
  assert.equal(validateField("country", { ...valid, country: "ES" }, undefined, TODAY), "Selecciona un país de la lista.");
});
