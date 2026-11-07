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
  assert.deepEqual(validateAll(valid, { country: colombia, today: TODAY }), {});
});

test("todos los campos son obligatorios", () => {
  const empty = { email: "", password: "", username: "", country: "", birthDate: "" };
  assert.deepEqual(Object.keys(validateAll(empty, { today: TODAY })).sort(), ["birthDate", "country", "email", "password", "username"]);
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
    validateField("password", { ...valid, password: "clave2026" }, { country: colombia, today: TODAY }),
    "A la contraseña le falta: al menos una letra mayúscula, al menos un carácter especial (por ejemplo ! @ # $ . -).",
  );
});

test("nombre de usuario", () => {
  assert.match(validateField("username", { ...valid, username: "ab" }, { country: colombia, today: TODAY })!, /entre 3 y 20/);
  assert.match(validateField("username", { ...valid, username: "josé" }, { country: colombia, today: TODAY })!, /sin tildes/);
});

test("fecha de nacimiento", () => {
  assert.match(validateField("birthDate", { ...valid, birthDate: "2023-02-30" }, { country: colombia, today: TODAY })!, /no es válida/);
  assert.match(validateField("birthDate", { ...valid, birthDate: "2027-01-01" }, { country: colombia, today: TODAY })!, /futuro/);
  assert.equal(validateField("birthDate", { ...valid, birthDate: "2008-11-07" }, { country: colombia, today: TODAY }), undefined);
  assert.match(validateField("birthDate", { ...valid, birthDate: "2008-11-08" }, { country: colombia, today: TODAY })!, /18 años/);
  assert.match(validateField("birthDate", { ...valid, birthDate: "2006-01-01" }, { country: honduras, today: TODAY })!, /21 años.*Honduras/);
});

test("sin país, exige la edad mínima de los países habilitados", () => {
  const options = { minAdultAge: 18, today: TODAY };
  const noCountry = { ...valid, country: "" };
  assert.equal(
    validateField("birthDate", { ...noCountry, birthDate: "2010-01-01" }, options),
    "Debes tener al menos 18 años para registrarte.",
  );
  assert.equal(validateField("birthDate", { ...noCountry, birthDate: "2008-11-07" }, options), undefined);
  // Con país elegido manda la mayoría de edad de ese país.
  assert.match(validateField("birthDate", { ...valid, birthDate: "2006-01-01" }, { ...options, country: honduras })!, /21 años.*Honduras/);
});

test("país fuera de la lista", () => {
  assert.equal(validateField("country", { ...valid, country: "ES" }, { today: TODAY }), "Selecciona un país de la lista.");
});
