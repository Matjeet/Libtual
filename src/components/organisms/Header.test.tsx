import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Header } from "./Header";

// La parte con sesión (servidor) se prueba en HeaderActions.test.tsx.
vi.mock("@/components/organisms/HeaderActions", () => ({
  HeaderActions: ({ showSignIn }: { showSignIn: boolean }) => <span>acciones {String(showSignIn)}</span>,
  HeaderActionsSkeleton: () => null,
}));

describe("Header", () => {
  test("muestra el logo que lleva al inicio", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "Libtual" })).toHaveAttribute("href", "/");
  });

  test("pasa showSignIn a las acciones (falso por defecto)", () => {
    const { unmount } = render(<Header />);
    expect(screen.getByText("acciones false")).toBeInTheDocument();
    unmount();
    render(<Header showSignIn />);
    expect(screen.getByText("acciones true")).toBeInTheDocument();
  });
});
