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

// jsdom no implementa ResizeObserver (lo usa la estantería para contar sus pisos al cambiar de tamaño).
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// next/font solo funciona dentro de Next: en los tests cada fuente devuelve su nombre como familia.
vi.mock("next/font/google", () => {
  // El nombre de cada función es el de la fuente con "_" en lugar de espacios (Playfair_Display → "Playfair Display").
  const names = [
    "Abril_Fatface", "Cabin_Sketch", "Caveat", "Cinzel", "Cormorant_Garamond", "Courier_Prime", "Creepster", "Crimson_Pro", "Dancing_Script",
    "EB_Garamond", "Great_Vibes", "IM_Fell_English", "Indie_Flower", "Josefin_Sans", "Libre_Baskerville", "Lobster", "Lora",
    "Merriweather", "Montserrat", "Nunito", "Orbitron", "Pacifico", "Playfair_Display", "Quicksand", "Raleway", "Satisfy",
    "Schoolbell", "Spectral", "Special_Elite", "Uncial_Antiqua", "UnifrakturMaguntia",
  ];
  return Object.fromEntries(names.map((name) => [name, () => ({ className: "", variable: "", style: { fontFamily: name.replaceAll("_", " ") } })]));
});
