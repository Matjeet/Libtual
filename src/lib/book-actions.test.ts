// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { saveBook, type NewBook } from "./book-actions";

// Supabase simulado: sesión y resultado del insert.
const db = vi.hoisted(() => ({
  userId: "user-1" as string | undefined,
  insert: vi.fn(),
  result: { data: { id: "book-1" } as unknown, error: null as unknown },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.userId ? { claims: { sub: db.userId } } : null }) },
    from: () => ({
      insert: (row: unknown) => {
        db.insert(row);
        return { select: () => ({ single: async () => db.result }) };
      },
    }),
  }),
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ refresh }));

const BOOK: NewBook = {
  title: "  Cien años de soledad ",
  author: "Gabriel García Márquez",
  genre: " Realismo mágico ",
  year: 1967,
  pages: 471,
  coverColor: "#2f7a96",
  fontColor: "#faf0d1",
  titleFont: "playfair",
  commentFont: "lora",
  status: "finished",
  comment: "Macondo.",
  quote: " Muchos años después, frente al pelotón de fusilamiento… ",
};

beforeEach(() => {
  db.userId = "user-1";
  db.result = { data: { id: "book-1" }, error: null };
  db.insert.mockReset();
  refresh.mockReset();
});

describe("saveBook", () => {
  test("guarda el libro del usuario con la categoría según las páginas y refresca la página", async () => {
    expect(await saveBook(BOOK)).toEqual({ id: "book-1" });
    expect(db.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      title: "Cien años de soledad",
      author: "Gabriel García Márquez",
      genre: "Realismo mágico",
      year: 1967,
      pages: 471,
      category: "large",
      cover_color: "#2f7a96",
      font_color: "#faf0d1",
      title_font: "playfair",
      comment_font: "lora",
      status: "finished",
      comment: "Macondo.",
      quote: "Muchos años después, frente al pelotón de fusilamiento…",
    });
    expect(refresh).toHaveBeenCalled();
  });

  test("rechaza datos inválidos sin tocar la base de datos", async () => {
    const invalid: Partial<NewBook>[] = [
      { title: "   " },
      { author: "a".repeat(201) },
      { genre: "  " },
      { genre: "a".repeat(101) },
      { year: 2101 },
      { pages: 0 },
      { pages: 12.5 },
      { coverColor: "red" },
      { fontColor: "#12345" },
      { titleFont: "comic-sans" },
      // Fuente que solo sirve para títulos.
      { commentFont: "creepster" },
      { status: "lost" },
      { comment: "a".repeat(2001) },
      { quote: "a".repeat(301) },
    ];
    for (const change of invalid) expect(await saveBook({ ...BOOK, ...change })).toEqual({ error: "Revisa los datos del libro." });
    expect(db.insert).not.toHaveBeenCalled();
  });

  test("sin sesión o si falla el insert, devuelve un mensaje y no refresca", async () => {
    db.userId = undefined;
    expect(await saveBook(BOOK)).toEqual({ error: "Tu sesión terminó. Vuelve a ingresar." });
    db.userId = "user-1";
    db.result = { data: null, error: { message: "boom" } };
    expect(await saveBook(BOOK)).toEqual({ error: "No pudimos guardar tu libro. Intenta de nuevo." });
    expect(refresh).not.toHaveBeenCalled();
  });
});
