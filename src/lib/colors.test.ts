import { describe, expect, test } from "vitest";
import { hexToHsl, hslColor, hslToHex } from "./colors";

describe("colors", () => {
  test("hexToHsl convierte cada caso del tono y los grises", () => {
    expect(hexToHsl("#2f7a96")).toEqual({ h: 196, s: 52, l: 39 });
    expect(hexToHsl("#ff0000")).toEqual({ h: 0, s: 100, l: 50 });
    expect(hexToHsl("#00ff00")).toEqual({ h: 120, s: 100, l: 50 });
    expect(hexToHsl("#a23b4c")).toEqual({ h: 350, s: 47, l: 43 });
    expect(hexToHsl("#808080")).toEqual({ h: 0, s: 0, l: 50 });
  });

  test("hslColor arma el color CSS", () => {
    expect(hslColor({ h: 196, s: 52, l: 39 })).toBe("hsl(196 52% 39%)");
  });

  test("hslToHex convierte a #rrggbb y vuelve al mismo HSL", () => {
    expect(hslToHex({ h: 0, s: 100, l: 50 })).toBe("#ff0000");
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe("#00ff00");
    expect(hslToHex({ h: 0, s: 0, l: 50 })).toBe("#808080");
    expect(hslToHex({ h: 45, s: 80, l: 90 })).toBe("#faf0d1");
    expect(hexToHsl(hslToHex({ h: 196, s: 52, l: 39 }))).toEqual({ h: 196, s: 52, l: 39 });
  });
});
