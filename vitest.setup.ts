import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Sin globals de Vitest, Testing Library no limpia el DOM sola entre tests.
afterEach(cleanup);

// jsdom no implementa scrollIntoView (lo usa CountrySelect para mantener visible la opción activa).
// Los tests de servidor corren en entorno node, sin DOM.
if (typeof Element !== "undefined") Element.prototype.scrollIntoView = () => {};

// jsdom no implementa los métodos del <dialog> (lo usa el modal de confirmación del perfil).
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom no implementa matchMedia (lo usa RoomScene para volver a la estantería al bajar de xl).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// next/font solo funciona dentro de Next: en los tests cada fuente devuelve su nombre como familia.
vi.mock("next/font/google", () => {
  const font = (name: string) => () => ({ className: "", variable: "", style: { fontFamily: name } });
  return { Caveat: font("Caveat"), Cinzel: font("Cinzel"), Lora: font("Lora"), Playfair_Display: font("Playfair Display"), Special_Elite: font("Special Elite") };
});
