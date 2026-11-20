import { afterEach, describe, expect, test } from "vitest";
import { applyTheme, currentTheme, THEME_SCRIPT } from "./theme";

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("theme", () => {
  test("claro y oscuro se guardan y quedan en <html>; predeterminado vuelve al del sistema", () => {
    expect(currentTheme()).toBe("system");
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(currentTheme()).toBe("dark");
    applyTheme("system");
    expect(document.documentElement).not.toHaveAttribute("data-theme");
    expect(localStorage.getItem("theme")).toBeNull();
    expect(currentTheme()).toBe("system");
  });

  test("el script de <head> aplica el modo guardado e ignora valores desconocidos", () => {
    localStorage.setItem("theme", "light");
    new Function(THEME_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("light");
    delete document.documentElement.dataset.theme;
    localStorage.setItem("theme", "rosado");
    new Function(THEME_SCRIPT)();
    expect(document.documentElement).not.toHaveAttribute("data-theme");
  });
});
