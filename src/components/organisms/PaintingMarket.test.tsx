import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { CatalogResult, ChooseResult } from "@/lib/painting-actions";
import { PaintingMarket } from "./PaintingMarket";

const actions = vi.hoisted(() => ({
  listPaintingCatalog: vi.fn<() => Promise<CatalogResult>>(),
  choosePainting: vi.fn<(frame: string, path: string) => Promise<ChooseResult>>(),
}));
vi.mock("@/lib/painting-actions", () => actions);

const CATALOG: CatalogResult = {
  catalog: {
    oval: [{ path: "oval-puntos.webp", url: "https://cdn.test/oval/oval-puntos.webp" }],
    portrait: [{ path: "portrait-rayas.webp", url: "https://cdn.test/portrait/portrait-rayas.webp" }],
    round: [],
    landscape: [{ path: "landscape-cuadros.webp", url: "https://cdn.test/landscape/landscape-cuadros.webp" }],
  },
};

beforeEach(() => {
  actions.listPaintingCatalog.mockReset().mockResolvedValue(CATALOG);
  actions.choosePainting.mockReset().mockResolvedValue({});
});

describe("PaintingMarket", () => {
  test("al abrirse muestra un skeleton y luego una sección por cuadro, con imágenes diferidas", async () => {
    render(<PaintingMarket frame="round" current={{}} onClose={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando las imágenes del mercado");

    const market = await screen.findByRole("dialog", { name: "Mercado de arte" });
    await screen.findByRole("heading", { name: "Cuadro ovalado" });
    for (const name of ["Cuadro ovalado", "Cuadro vertical", "Cuadro redondo", "Cuadro horizontal"]) {
      expect(within(market).getByRole("heading", { name })).toBeInTheDocument();
    }
    expect(within(market).getByText("Todavía no hay imágenes para este cuadro.")).toBeInTheDocument();
    for (const image of market.querySelectorAll("img")) expect(image).toHaveAttribute("loading", "lazy");
  });

  test("marca la imagen que el usuario ya tiene en ese cuadro", async () => {
    render(<PaintingMarket frame="oval" current={{ oval: "https://cdn.test/oval/oval-puntos.webp" }} onClose={() => {}} />);
    expect(await screen.findByRole("button", { name: "Usar oval-puntos en el cuadro ovalado" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Usar portrait-rayas en el cuadro vertical" })).toHaveAttribute("aria-pressed", "false");
  });

  test("elegir una imagen la guarda para su cuadro y cierra el mercado", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PaintingMarket frame="oval" current={{}} onClose={onClose} />);
    await user.click(await screen.findByRole("button", { name: "Usar landscape-cuadros en el cuadro horizontal" }));

    expect(actions.choosePainting).toHaveBeenCalledWith("landscape", "landscape-cuadros.webp");
    expect(onClose).toHaveBeenCalled();
  });

  test("al cerrar espera a que termine la animación de salida", async () => {
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => (finish = resolve));
    const getAnimations = vi.fn(() => [{ finished }] as unknown as Animation[]);
    HTMLElement.prototype.getAnimations = getAnimations;
    try {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<PaintingMarket frame="oval" current={{}} onClose={onClose} />);
      const market = await screen.findByRole("dialog", { name: "Mercado de arte" });
      await user.click(screen.getByRole("button", { name: "Cerrar" }));

      expect(market).toHaveAttribute("data-closing");
      expect(onClose).not.toHaveBeenCalled();
      finish();
      await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
      expect(market).not.toHaveAttribute("data-closing");
    } finally {
      delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
    }
  });

  test("hacer clic en el fondo cierra el mercado; un clic dentro no", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PaintingMarket frame="oval" current={{}} onClose={onClose} />);
    const market = await screen.findByRole("dialog", { name: "Mercado de arte" });

    await user.click(screen.getByRole("heading", { name: "Mercado de arte" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(market);
    expect(onClose).toHaveBeenCalled();
  });

  test("si no se puede guardar, muestra el error y sigue abierto", async () => {
    actions.choosePainting.mockResolvedValue({ error: "Esa imagen ya no está disponible." });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<PaintingMarket frame="oval" current={{}} onClose={onClose} />);
    await user.click(await screen.findByRole("button", { name: "Usar oval-puntos en el cuadro ovalado" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Esa imagen ya no está disponible.");
    expect(onClose).not.toHaveBeenCalled();
  });
});
