import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { RoomScene } from "./RoomScene";

describe("RoomScene", () => {
  test("pone la bolsa, la estantería y la mesa en tres paneles que avanzan de a uno al deslizar", () => {
    render(
      <RoomScene>
        <p>estantería</p>
      </RoomScene>,
    );
    const scene = screen.getByRole("region", { name: /Tu habitación/ });
    expect(scene.className).toContain("snap-mandatory");
    const panels = [...scene.children];
    expect(panels).toHaveLength(3);
    for (const panel of panels) expect(panel.className).toContain("snap-always");
    // La estantería va en el panel del medio.
    expect(panels[1]).toHaveTextContent("estantería");
  });
});
