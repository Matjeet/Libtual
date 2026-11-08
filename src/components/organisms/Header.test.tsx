import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  test("por defecto no muestra el botón Ingresar", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "Libtual" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Ingresar" })).not.toBeInTheDocument();
  });

  test("con showSignIn muestra Ingresar y lleva al login", () => {
    render(<Header showSignIn />);
    expect(screen.getByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/ingresar");
  });
});
