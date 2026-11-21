"use server";

import { generateKeyBetween } from "fractional-indexing";
import { refresh } from "next/cache";
import { BOOK_FONTS } from "@/lib/book-fonts";
import { BOOK_STATUSES, bookCategory } from "@/lib/books";
import { createClient } from "@/lib/supabase/server";

// Lo que llena el usuario en el libro abierto. Los colores van en "#rrggbb".
export type NewBook = {
  title: string;
  author: string;
  // Uno de BOOK_GENRES o el que escriba el usuario.
  genre: string;
  year: number;
  pages: number;
  coverColor: string;
  fontColor: string;
  titleFont: string;
  commentFont: string;
  status: string;
  comment: string;
  // Cita del libro, opcional.
  quote: string;
};
export type SaveBookResult = { id?: string; error?: string };
export type MoveBookResult = { error?: string };

const HEX = /^#[0-9a-f]{6}$/i;
// Mismos límites que la tabla user_books. Se cuentan caracteres (code points), como char_length en Postgres.
const length = (value: string) => [...value].length;
const isText = (value: unknown, max: number): value is string => typeof value === "string" && length(value.trim()) >= 1 && length(value.trim()) <= max;
const isInt = (value: unknown, min: number, max: number) => Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
const isColor = (value: unknown) => typeof value === "string" && HEX.test(value);
const isFont = (value: unknown, forComment: boolean) =>
  BOOK_FONTS.some((font) => font.value === value && !(forComment && "titleOnly" in font));

function isValid(book: NewBook) {
  return (
    isText(book.title, 200) &&
    isText(book.author, 200) &&
    isText(book.genre, 100) &&
    isInt(book.year, -3000, 2100) &&
    isInt(book.pages, 1, 100000) &&
    isColor(book.coverColor) &&
    isColor(book.fontColor) &&
    isFont(book.titleFont, false) &&
    isFont(book.commentFont, true) &&
    BOOK_STATUSES.some(({ value }) => value === book.status) &&
    typeof book.comment === "string" &&
    length(book.comment) <= 4000 &&
    typeof book.quote === "string" &&
    length(book.quote) <= 300
  );
}

// Guarda el libro en la estantería del usuario (la categoría sale de las páginas) y refresca la página para que aparezca.
// Queda último en la estantería: su índice fraccionado (shelf_order) va después del más alto.
export async function saveBook(book: NewBook): Promise<SaveBookResult> {
  // Viene del cliente: se valida antes de tocar la base de datos.
  if (!book || !isValid(book)) return { error: "Revisa los datos del libro." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Tu sesión terminó. Vuelve a ingresar." };

  // shortcut: dos libros guardados al mismo tiempo pueden quedar con el mismo índice (se desempata por created_at); si
  // llega a pasar seguido, calcularlo en la base de datos (una función o un trigger) en vez de aquí.
  const last = await supabase
    .from("user_books")
    .select("shelf_order")
    .eq("user_id", userId)
    .order("shelf_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last.error) return { error: "No pudimos guardar tu libro. Intenta de nuevo." };
  const shelfOrder = generateKeyBetween(last.data?.shelf_order ?? null, null);

  const { data, error } = await supabase
    .from("user_books")
    .insert({
      user_id: userId,
      title: book.title.trim(),
      author: book.author.trim(),
      genre: book.genre.trim(),
      year: book.year,
      pages: book.pages,
      category: bookCategory(book.pages),
      cover_color: book.coverColor,
      font_color: book.fontColor,
      title_font: book.titleFont,
      comment_font: book.commentFont,
      status: book.status,
      comment: book.comment,
      quote: book.quote.trim(),
      shelf_order: shelfOrder,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "No pudimos guardar tu libro. Intenta de nuevo." };

  refresh();
  return { id: data.id };
}

// Mueve un libro entre otros dos de la estantería: after es el que queda antes (null = al principio) y before el que
// queda después (null = al final). Solo cambia el índice del libro movido. Los índices de los vecinos se leen de la base
// de datos (no se confía en los del cliente) y solo de los libros del usuario.
export async function moveBook(bookId: string, after: string | null, before: string | null): Promise<MoveBookResult> {
  const neighbors = [after, before].filter((id): id is string => id !== null);
  const isId = (value: unknown) => typeof value === "string" && value.length > 0;
  if (!isId(bookId) || ![after, before].every((id) => id === null || isId(id)) || neighbors.includes(bookId)) {
    return { error: "No pudimos mover el libro." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Tu sesión terminó. Vuelve a ingresar." };

  let keys = new Map<string, string>();
  if (neighbors.length > 0) {
    const { data, error } = await supabase.from("user_books").select("id, shelf_order").eq("user_id", userId).in("id", neighbors);
    if (error || !data || data.length !== neighbors.length) return { error: "No pudimos mover el libro." };
    keys = new Map(data.map((row: { id: string; shelf_order: string }) => [row.id, row.shelf_order]));
  }

  let shelfOrder: string;
  try {
    // Falla si algún índice guardado no es válido.
    shelfOrder = generateKeyBetween(after ? keys.get(after) : null, before ? keys.get(before) : null);
  } catch {
    return { error: "No pudimos mover el libro." };
  }

  // select: confirma que se movió un libro del usuario (si no es suyo, no se actualiza ninguna fila).
  const { data: moved, error } = await supabase
    .from("user_books")
    .update({ shelf_order: shelfOrder })
    .eq("id", bookId)
    .eq("user_id", userId)
    .select("id");
  if (error || !moved?.length) return { error: "No pudimos mover el libro." };
  refresh();
  return {};
}
