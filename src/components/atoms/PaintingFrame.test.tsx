import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PaintingFrame, type FrameShape } from "./PaintingFrame";

const SHAPES: FrameShape[] = ["oval", "portrait", "round", "landscape"];

describe("PaintingFrame", () => {
  test("sin imagen muestra el lienzo vacío", () => {
    const { container } = render(<PaintingFrame shape="oval" />);
    expect(container.querySelector("image")).toBeNull();
  });

  test.each(SHAPES)("el cuadro %s dibuja la imagen recortada a su forma, sin deformarla", (shape) => {
    const { container } = render(<PaintingFrame shape={shape} imageUrl="https://cdn.test/foto.webp" />);
    const image = container.querySelector("image")!;
    expect(image).toHaveAttribute("href", "https://cdn.test/foto.webp");
    // slice llena el área manteniendo la proporción (recorta lo que sobra en vez de estirar).
    expect(image).toHaveAttribute("preserveAspectRatio", "xMidYMid slice");
    const clipId = image.getAttribute("clip-path")!.match(/url\(#(.+)\)/)![1];
    expect(container.querySelector(`clipPath[id="${clipId}"]`)).not.toBeNull();
  });
});
