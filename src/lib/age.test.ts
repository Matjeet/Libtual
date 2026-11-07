import assert from "node:assert/strict";
import { test } from "vitest";
import { ageOn } from "./age.ts";

test("cumple años exactamente hoy", () => {
  assert.equal(ageOn("2008-11-07", "2026-11-07"), 18);
});

test("le falta un día para cumplir", () => {
  assert.equal(ageOn("2008-11-08", "2026-11-07"), 17);
});

test("cumpleaños en un mes posterior", () => {
  assert.equal(ageOn("2008-12-01", "2026-11-07"), 17);
});

test("nacido el 29 de febrero en año no bisiesto", () => {
  assert.equal(ageOn("2008-02-29", "2026-02-28"), 17);
  assert.equal(ageOn("2008-02-29", "2026-03-01"), 18);
});

test("fecha futura da edad negativa", () => {
  assert.ok(ageOn("2030-01-01", "2026-11-07") < 0);
});
