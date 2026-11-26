// @vitest-environment node
import { describe, expect, test } from "vitest";
import { HOME_TITLE, pageMetadata } from "./seo";

describe("pageMetadata", () => {
  test("una página con título: canonical propia, y Open Graph y X con su título completo, descripción e imagen", () => {
    const metadata = pageMetadata({ title: "Ingresar", description: "Ingresa a tu cuenta.", path: "/ingresar" });
    expect(metadata.title).toBe("Ingresar");
    expect(metadata.alternates).toEqual({ canonical: "/ingresar" });
    expect(metadata.openGraph).toMatchObject({
      title: "Ingresar | Libtual",
      description: "Ingresa a tu cuenta.",
      url: "/ingresar",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", title: "Ingresar | Libtual", images: [{ url: "/opengraph-image" }] });
  });

  test("la portada no define título (usa el del layout) y se comparte con el de la portada", () => {
    const metadata = pageMetadata({ description: "Tu librería.", path: "/" });
    expect(metadata).not.toHaveProperty("title");
    expect(metadata.openGraph).toMatchObject({ title: HOME_TITLE, url: "/" });
  });
});
