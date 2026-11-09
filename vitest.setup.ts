import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

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
