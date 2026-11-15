// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { choosePainting, listPaintingCatalog } from "./painting-actions";

// Supabase simulado: archivos de cada bucket, sesión y resultado del upsert.
const db = vi.hoisted(() => ({
  userId: "user-1" as string | undefined,
  files: {} as Record<string, { name: string }[]>,
  listError: null as unknown,
  upsert: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.userId ? { claims: { sub: db.userId } } : null }) },
    storage: {
      from: (bucket: string) => ({
        list: async (_prefix: string, options?: { search?: string }) => ({
          data: (db.files[bucket] ?? []).filter((file) => !options?.search || file.name.includes(options.search)),
          error: db.listError,
        }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${bucket}/${path}` } }),
      }),
    },
    from: () => ({ upsert: db.upsert }),
  }),
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ refresh }));

beforeEach(() => {
  db.userId = "user-1";
  db.listError = null;
  db.files = {
    "painting-oval": [{ name: "oval-puntos.webp" }, { name: ".emptyFolderPlaceholder" }],
    "painting-portrait": [{ name: "portrait-rayas.webp" }],
    "painting-round": [],
    "painting-landscape": [{ name: "landscape-cuadros.webp" }, { name: "foto.png" }],
  };
  db.upsert.mockReset().mockResolvedValue({ error: null });
  refresh.mockReset();
});

describe("listPaintingCatalog", () => {
  test("trae las imágenes WebP de los 4 buckets, agrupadas por cuadro y con su URL pública", async () => {
    expect(await listPaintingCatalog()).toEqual({
      catalog: {
        oval: [{ path: "oval-puntos.webp", url: "https://cdn.test/painting-oval/oval-puntos.webp" }],
        portrait: [{ path: "portrait-rayas.webp", url: "https://cdn.test/painting-portrait/portrait-rayas.webp" }],
        round: [],
        landscape: [{ path: "landscape-cuadros.webp", url: "https://cdn.test/painting-landscape/landscape-cuadros.webp" }],
      },
    });
  });

  test("si un bucket falla, devuelve un mensaje en vez de romper", async () => {
    db.listError = { message: "boom" };
    expect(await listPaintingCatalog()).toEqual({ error: "No pudimos cargar las imágenes. Intenta de nuevo." });
  });
});

describe("choosePainting", () => {
  test("guarda la imagen del cuadro para el usuario y refresca la página", async () => {
    expect(await choosePainting("oval", "oval-puntos.webp")).toEqual({});
    expect(db.upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "user-1", frame: "oval", image_path: "oval-puntos.webp" }));
    expect(refresh).toHaveBeenCalled();
  });

  test("rechaza cuadros o nombres de archivo inválidos sin tocar la base de datos", async () => {
    expect((await choosePainting("hexagon" as never, "x.webp")).error).toBeDefined();
    expect((await choosePainting("oval", "foto.png")).error).toBeDefined();
    expect((await choosePainting("oval", "../otro-bucket/x.webp")).error).toBeDefined();
    expect(db.upsert).not.toHaveBeenCalled();
  });

  test("la imagen tiene que existir en el bucket de ese cuadro", async () => {
    // portrait-rayas.webp existe, pero en el bucket del cuadro vertical, no en el del ovalado.
    expect(await choosePainting("oval", "portrait-rayas.webp")).toEqual({ error: "Esa imagen ya no está disponible." });
    expect(db.upsert).not.toHaveBeenCalled();
  });

  test("sin sesión o si falla el guardado, informa y no refresca", async () => {
    db.userId = undefined;
    expect(await choosePainting("oval", "oval-puntos.webp")).toEqual({ error: "Tu sesión terminó. Vuelve a ingresar." });
    db.userId = "user-1";
    db.upsert.mockResolvedValue({ error: { message: "boom" } });
    expect(await choosePainting("oval", "oval-puntos.webp")).toEqual({ error: "No pudimos guardar tu elección. Intenta de nuevo." });
    expect(refresh).not.toHaveBeenCalled();
  });
});
