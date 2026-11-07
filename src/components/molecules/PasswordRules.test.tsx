import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PasswordRules } from "./PasswordRules";

const itemFor = (label: RegExp) => screen.getAllByRole("listitem").find((li) => label.test(li.textContent ?? ""))!;

describe("PasswordRules", () => {
  test("muestra los 5 requisitos", () => {
    render(<PasswordRules id="rules" password="" />);
    expect(screen.getByRole("list", { name: "Requisitos de la contraseña" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(5);
  });

  test("marca en verde los requisitos cumplidos y deja pendientes los demás", () => {
    render(<PasswordRules id="rules" password="clave20" />);
    expect(itemFor(/número/)).toHaveTextContent("cumplido");
    expect(itemFor(/número/)).toHaveClass("text-success");
    expect(itemFor(/minúscula/)).toHaveTextContent("cumplido");
    expect(itemFor(/mayúscula/)).toHaveTextContent("pendiente");
    expect(itemFor(/mayúscula/)).not.toHaveClass("text-danger");
  });

  test("con showErrors marca en rojo los pendientes", () => {
    render(<PasswordRules id="rules" password="clave20" showErrors />);
    expect(itemFor(/mayúscula/)).toHaveClass("text-danger");
    expect(itemFor(/mayúscula/)).toHaveTextContent("✕");
    expect(itemFor(/número/)).toHaveClass("text-success");
  });

  test("todos cumplidos con una contraseña válida", () => {
    render(<PasswordRules id="rules" password="Clave#2026" />);
    screen.getAllByRole("listitem").forEach((li) => expect(li).toHaveTextContent("cumplido"));
  });
});
