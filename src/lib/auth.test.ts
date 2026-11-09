// @vitest-environment node
import { describe, expect, test, vi } from "vitest";
import { signOut } from "./auth";

const supabaseSignOut = vi.hoisted(() => vi.fn(async () => ({ error: null })));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signOut: supabaseSignOut } }) }));

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));

describe("signOut", () => {
  test("cierra la sesión en Supabase y lleva a la página inicial", async () => {
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(supabaseSignOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
