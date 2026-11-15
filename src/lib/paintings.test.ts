// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { getPaintingImages } from "./paintings";

// Supabase simulado: la consulta devuelve las filas dadas y la URL pública se arma con el bucket y el archivo.
function supabaseWith(result: { data: unknown; error: unknown }) {
  const eq = vi.fn(async () => result);
  const client = {
    from: vi.fn(() => ({ select: () => ({ eq }) })),
    storage: {
      from: (bucket: string) => ({
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://cdn.test/${bucket}/${path}` } }),
      }),
    },
  };
  return { client: client as never, eq, from: client.from };
}

describe("getPaintingImages", () => {
  test("arma la URL pública de cada imagen desde el bucket de su cuadro", async () => {
    const { client, eq, from } = supabaseWith({
      data: [
        { frame: "oval", image_path: "bosque.webp" },
        { frame: "landscape", image_path: "mar.webp" },
      ],
      error: null,
    });
    expect(await getPaintingImages(client, "user-1")).toEqual({
      oval: "https://cdn.test/painting-oval/bosque.webp",
      landscape: "https://cdn.test/painting-landscape/mar.webp",
    });
    expect(from).toHaveBeenCalledWith("user_paintings");
    expect(eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  test("ignora cuadros desconocidos", async () => {
    const { client } = supabaseWith({ data: [{ frame: "hexagon", image_path: "x.webp" }], error: null });
    expect(await getPaintingImages(client, "user-1")).toEqual({});
  });

  test("si la consulta falla, no rompe: los cuadros quedan sin imagen", async () => {
    const { client } = supabaseWith({ data: null, error: { message: "boom" } });
    expect(await getPaintingImages(client, "user-1")).toEqual({});
  });
});
