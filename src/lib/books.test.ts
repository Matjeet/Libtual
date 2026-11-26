// @vitest-environment node
import { describe, expect, test } from "vitest";
import { arrangeBooks, bookCategory, bookFields, bookGenres, bookmarkColor, changedFields, getUserBooks, type ShelfBook } from "./books";

describe("bookCategory", () => {
  test("clasifica por páginas: corto hasta 200, mediano hasta 400, largo hasta 600 y extra largo desde 601", () => {
    expect([1, 200].map(bookCategory)).toEqual(["small", "small"]);
    expect([201, 400].map(bookCategory)).toEqual(["medium", "medium"]);
    expect([401, 600].map(bookCategory)).toEqual(["large", "large"]);
    expect([601, 100000].map(bookCategory)).toEqual(["extra_large", "extra_large"]);
  });
});

describe("bookmarkColor", () => {
  test("amarillo pendiente, azul leyendo, verde terminado; un estado desconocido se ve como pendiente", () => {
    expect(["pending", "reading", "finished", "otro"].map(bookmarkColor)).toEqual(["#f2c230", "#2f6fd6", "#2e9d4f", "#f2c230"]);
  });
});

describe("getUserBooks", () => {
  // Cliente simulado: devuelve las filas (o el error) y guarda la consulta que se hizo.
  const client = (result: { data: unknown; error: unknown }) => {
    const query = { table: "", user: "", order: [] as string[] };
    const supabase = {
      from: (table: string) => {
        query.table = table;
        return {
          select: () => ({
            eq: (_column: string, user: string) => {
              query.user = user;
              // Dos .order() encadenados: el segundo devuelve el resultado.
              return {
                order: (first: string) => ({
                  order: async (second: string) => ((query.order = [first, second]), result),
                }),
              };
            },
          }),
        };
      },
    };
    return { supabase: supabase as never, query };
  };

  test("trae los libros del usuario en el orden de su estantería y, a igual orden, en el que los agregó", async () => {
    const row = {
      id: "b1",
      title: "Rayuela",
      category: "large",
      cover_color: "#2f7a96",
      font_color: "#faf0d1",
      title_font: "lora",
      author: "Julio Cortázar",
      year: 1963,
      genre: "Novela",
      comment: "Un juego.",
      comment_font: "caveat",
      status: "reading",
      quote: "Andábamos sin buscarnos.",
      pages: 600,
      created_at: "2026-11-15T10:00:00+00:00",
      updated_at: "2026-11-18T09:30:00+00:00",
    };
    const { supabase, query } = client({ data: [row], error: null });
    expect(await getUserBooks(supabase, "user-1")).toEqual([
      {
        id: "b1",
        title: "Rayuela",
        category: "large",
        coverColor: "#2f7a96",
        fontColor: "#faf0d1",
        titleFont: "lora",
        author: "Julio Cortázar",
        year: 1963,
        genre: "Novela",
        comment: "Un juego.",
        commentFont: "caveat",
        status: "reading",
        quote: "Andábamos sin buscarnos.",
        pages: 600,
        createdAt: "2026-11-15T10:00:00+00:00",
        updatedAt: "2026-11-18T09:30:00+00:00",
      },
    ]);
    expect(query).toEqual({ table: "user_books", user: "user-1", order: ["shelf_order", "created_at"] });
  });

  test("si la lectura falla, devuelve una estantería vacía", async () => {
    expect(await getUserBooks(client({ data: null, error: { message: "boom" } }).supabase, "user-1")).toEqual([]);
  });
});

describe("arrangeBooks", () => {
  // En orden personalizado: b1, b2, b3, b4.
  const book = (id: string, genre: string, createdAt: string, updatedAt: string) => ({ id, genre, createdAt, updatedAt }) as ShelfBook;
  const books = [
    book("b1", "Novela", "2026-11-03T00:00:00+00:00", "2026-11-05T00:00:00+00:00"),
    book("b2", "Poesía", "2026-11-01T00:00:00+00:00", "2026-11-09T00:00:00+00:00"),
    book("b3", "Novela", "2026-11-04T00:00:00+00:00", "2026-11-04T00:00:00+00:00"),
    book("b4", "Novela", "2026-11-02T00:00:00+00:00", "2026-11-07T00:00:00+00:00"),
  ];
  const ids = (list: ShelfBook[]) => list.map(({ id }) => id);

  test("ordena por el orden personalizado, la fecha de creación o la de actualización", () => {
    expect(ids(arrangeBooks(books, "custom", null))).toEqual(["b1", "b2", "b3", "b4"]);
    expect(ids(arrangeBooks(books, "oldest", null))).toEqual(["b2", "b4", "b1", "b3"]);
    expect(ids(arrangeBooks(books, "newest", null))).toEqual(["b3", "b1", "b4", "b2"]);
    expect(ids(arrangeBooks(books, "updated", null))).toEqual(["b2", "b4", "b1", "b3"]);
    // No cambia la lista original.
    expect(ids(books)).toEqual(["b1", "b2", "b3", "b4"]);
  });

  test("con un género, deja solo sus libros en el orden elegido", () => {
    expect(ids(arrangeBooks(books, "custom", "Novela"))).toEqual(["b1", "b3", "b4"]);
    expect(ids(arrangeBooks(books, "oldest", "Novela"))).toEqual(["b4", "b1", "b3"]);
    expect(arrangeBooks(books, "custom", "Terror")).toEqual([]);
  });

  test("a igual fecha mantiene el orden personalizado", () => {
    const same = [book("b1", "Novela", "2026-11-01T00:00:00+00:00", "x"), book("b2", "Novela", "2026-11-01T00:00:00+00:00", "x")];
    expect(ids(arrangeBooks(same, "newest", null))).toEqual(["b1", "b2"]);
  });
});

describe("bookGenres", () => {
  test("los géneros de los libros, sin repetir y en orden alfabético", () => {
    const books = ["Poesía", "Novela", "Ensayo", "Novela", "Ciencia ficción"].map((genre) => ({ genre }) as ShelfBook);
    expect(bookGenres(books)).toEqual(["Ciencia ficción", "Ensayo", "Novela", "Poesía"]);
  });
});

describe("changedFields", () => {
  const saved = bookFields({
    id: "b1",
    title: "Rayuela",
    category: "large",
    coverColor: "#2f7a96",
    fontColor: "#faf0d1",
    titleFont: "lora",
    author: "Julio Cortázar",
    year: 1963,
    genre: "Novela",
    comment: "Un juego.",
    commentFont: "caveat",
    status: "reading",
    quote: "",
    pages: 600,
    createdAt: "",
    updatedAt: "",
  });

  test("sin cambios no devuelve nada; espacios a los lados del título o mayúsculas en un color no cuentan", () => {
    expect(changedFields(saved, { ...saved })).toEqual({});
    expect(changedFields(saved, { ...saved, title: " Rayuela  ", coverColor: "#2F7A96" })).toEqual({});
  });

  test("devuelve solo lo que cambió, también mayúsculas del comentario", () => {
    expect(changedFields(saved, { ...saved, pages: 601, status: "finished", comment: "Un Juego." })).toEqual({
      pages: 601,
      status: "finished",
      comment: "Un Juego.",
    });
  });
});
