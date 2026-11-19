// @vitest-environment node
import { describe, expect, test } from "vitest";
import { bookCategory, bookmarkColor, getUserBooks } from "./books";

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
    const query = { table: "", user: "", order: "" };
    const supabase = {
      from: (table: string) => {
        query.table = table;
        return {
          select: () => ({
            eq: (_column: string, user: string) => {
              query.user = user;
              return { order: async (column: string) => ((query.order = column), result) };
            },
          }),
        };
      },
    };
    return { supabase: supabase as never, query };
  };

  test("trae los libros del usuario en el orden en que los agregó", async () => {
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
      },
    ]);
    expect(query).toEqual({ table: "user_books", user: "user-1", order: "created_at" });
  });

  test("si la lectura falla, devuelve una estantería vacía", async () => {
    expect(await getUserBooks(client({ data: null, error: { message: "boom" } }).supabase, "user-1")).toEqual([]);
  });
});
