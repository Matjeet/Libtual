// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { saveBook, type NewBook } from "./book-actions";

// Supabase simulado: sesión, el libro con el orden más alto del usuario y resultado del insert.
const db = vi.hoisted(() => ({
  userId: "user-1" as string | undefined,
  insert: vi.fn(),
  lastQuery: vi.fn(),
  last: { data: { shelf_order: 4 } as unknown, error: null as unknown },
  result: { data: { id: "book-1" } as unknown, error: null as unknown },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.userId ? { claims: { sub: db.userId } } : null }) },
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: string) => ({
          order: (by: string, options: unknown) => ({
            limit: (count: number) => ({
              maybeSingle: async () => {
                db.lastQuery({ table, columns, column, value, by, options, count });
                return db.last;
              },
            }),
          }),
        }),
      }),
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
  db.last = { data: { shelf_order: 4 }, error: null };
  db.result = { data: { id: "book-1" }, error: null };
  db.insert.mockReset();
  db.lastQuery.mockReset();
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
      shelf_order: 5,
    });
    // El orden más alto de los libros de este usuario.
    expect(db.lastQuery).toHaveBeenCalledWith({
      table: "user_books",
      columns: "shelf_order",
      column: "user_id",
      value: "user-1",
      by: "shelf_order",
      options: { ascending: false },
      count: 1,
    });
    expect(refresh).toHaveBeenCalled();
  });

  test("el primer libro de la estantería queda con el orden 1", async () => {
    db.last = { data: null, error: null };
    await saveBook(BOOK);
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ shelf_order: 1 }));
  });

  test("si no puede leer el orden, no guarda el libro", async () => {
    db.last = { data: null, error: { message: "boom" } };
    expect(await saveBook(BOOK)).toEqual({ error: "No pudimos guardar tu libro. Intenta de nuevo." });
    expect(db.insert).not.toHaveBeenCalled();
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
      { comment: "a".repeat(4001) },
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
