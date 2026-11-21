// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest";
import { moveBook, saveBook, type NewBook } from "./book-actions";

type Op = [string, ...unknown[]];

// Supabase simulado: cada consulta guarda sus pasos (from, select, eq, …) y responde según su tipo.
const db = vi.hoisted(() => ({
  userId: "user-1" as string | undefined,
  queries: [] as { table: string; ops: Op[] }[],
  // El libro con el índice más alto del usuario (al guardar).
  last: { data: { shelf_order: "a4" } as unknown, error: null as unknown },
  // Los vecinos (al mover).
  neighbors: { data: [] as unknown, error: null as unknown },
  inserted: { data: { id: "book-1" } as unknown, error: null as unknown },
  updated: { data: [{ id: "book-1" }] as unknown, error: null as unknown },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getClaims: async () => ({ data: db.userId ? { claims: { sub: db.userId } } : null }) },
    from: (table: string) => {
      const query = { table, ops: [] as Op[] };
      db.queries.push(query);
      const has = (name: string) => query.ops.some(([op]) => op === name);
      const result = () => (has("insert") ? db.inserted : has("update") ? db.updated : has("maybeSingle") ? db.last : db.neighbors);
      const builder: object = new Proxy(
        {},
        {
          get: (_, prop: string) =>
            prop === "then"
              ? (resolve: (value: unknown) => void) => resolve(result())
              : (...args: unknown[]) => (query.ops.push([prop, ...args]), builder),
        },
      );
      return builder;
    },
  }),
}));
const refresh = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ refresh }));

const op = (name: string) => db.queries.flatMap(({ ops }) => ops).find(([step]) => step === name);

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
  db.queries = [];
  db.last = { data: { shelf_order: "a4" }, error: null };
  db.neighbors = { data: [], error: null };
  db.inserted = { data: { id: "book-1" }, error: null };
  db.updated = { data: [{ id: "book-1" }], error: null };
  refresh.mockReset();
});

describe("saveBook", () => {
  test("guarda el libro del usuario con la categoría según las páginas, último en la estantería, y refresca la página", async () => {
    expect(await saveBook(BOOK)).toEqual({ id: "book-1" });
    expect(op("insert")).toEqual([
      "insert",
      {
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
        // Índice fraccionado después del más alto ("a4").
        shelf_order: "a5",
      },
    ]);
    // El índice más alto de los libros de este usuario.
    expect(db.queries[0].ops).toEqual([
      ["select", "shelf_order"],
      ["eq", "user_id", "user-1"],
      ["order", "shelf_order", { ascending: false }],
      ["limit", 1],
      ["maybeSingle"],
    ]);
    expect(refresh).toHaveBeenCalled();
  });

  test("el primer libro de la estantería recibe el primer índice", async () => {
    db.last = { data: null, error: null };
    await saveBook(BOOK);
    expect(op("insert")?.[1]).toMatchObject({ shelf_order: "a0" });
  });

  test("si no puede leer el orden, no guarda el libro", async () => {
    db.last = { data: null, error: { message: "boom" } };
    expect(await saveBook(BOOK)).toEqual({ error: "No pudimos guardar tu libro. Intenta de nuevo." });
    expect(op("insert")).toBeUndefined();
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
    expect(db.queries).toEqual([]);
  });

  test("sin sesión o si falla el insert, devuelve un mensaje y no refresca", async () => {
    db.userId = undefined;
    expect(await saveBook(BOOK)).toEqual({ error: "Tu sesión terminó. Vuelve a ingresar." });
    db.userId = "user-1";
    db.inserted = { data: null, error: { message: "boom" } };
    expect(await saveBook(BOOK)).toEqual({ error: "No pudimos guardar tu libro. Intenta de nuevo." });
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("moveBook", () => {
  test("entre dos libros: el índice queda entre los de ellos, leídos de la base de datos, y solo cambia el libro movido", async () => {
    db.neighbors = {
      data: [
        { id: "b2", shelf_order: "a2" },
        { id: "b1", shelf_order: "a1" },
      ],
      error: null,
    };
    expect(await moveBook("b9", "b1", "b2")).toEqual({});
    expect(db.queries[0].ops).toEqual([
      ["select", "id, shelf_order"],
      ["eq", "user_id", "user-1"],
      ["in", "id", ["b1", "b2"]],
    ]);
    expect(db.queries[1].ops).toEqual([
      ["update", { shelf_order: "a1V" }],
      ["eq", "id", "b9"],
      ["eq", "user_id", "user-1"],
      ["select", "id"],
    ]);
    expect(refresh).toHaveBeenCalled();
  });

  test("al principio o al final de la estantería", async () => {
    db.neighbors = { data: [{ id: "b1", shelf_order: "a0" }], error: null };
    await moveBook("b9", null, "b1");
    expect(op("update")).toEqual(["update", { shelf_order: "Zz" }]);
    db.queries = [];
    db.neighbors = { data: [{ id: "b3", shelf_order: "a3" }], error: null };
    await moveBook("b9", "b3", null);
    expect(op("update")).toEqual(["update", { shelf_order: "a4" }]);
  });

  test("rechaza vecinos que no son del usuario, datos inválidos o un libro ajeno", async () => {
    // Uno de los vecinos no está entre los libros del usuario.
    db.neighbors = { data: [{ id: "b1", shelf_order: "a1" }], error: null };
    expect(await moveBook("b9", "b1", "b2")).toEqual({ error: "No pudimos mover el libro." });
    expect(op("update")).toBeUndefined();

    // El libro no puede ser su propio vecino; los ids deben ser texto.
    expect(await moveBook("b1", "b1", null)).toEqual({ error: "No pudimos mover el libro." });
    expect(await moveBook("", null, null)).toEqual({ error: "No pudimos mover el libro." });

    // El libro no es del usuario: no se actualiza ninguna fila.
    db.neighbors = { data: [{ id: "b1", shelf_order: "a1" }], error: null };
    db.updated = { data: [], error: null };
    expect(await moveBook("ajeno", "b1", null)).toEqual({ error: "No pudimos mover el libro." });
    expect(refresh).not.toHaveBeenCalled();
  });

  test("sin sesión no mueve nada", async () => {
    db.userId = undefined;
    expect(await moveBook("b9", null, null)).toEqual({ error: "Tu sesión terminó. Vuelve a ingresar." });
    expect(db.queries).toEqual([]);
  });
});
