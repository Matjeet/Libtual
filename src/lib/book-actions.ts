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
export type DeleteBookResult = { error?: string };
export type UpdateBookResult = { error?: string };

const HEX = /^#[0-9a-f]{6}$/i;
// Mismos límites que la tabla user_books. Se cuentan caracteres (code points), como char_length en Postgres.
const length = (value: string) => [...value].length;
const isText = (value: unknown, max: number): value is string => typeof value === "string" && length(value.trim()) >= 1 && length(value.trim()) <= max;
const isInt = (value: unknown, min: number, max: number) => Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
const isColor = (value: unknown) => typeof value === "string" && HEX.test(value);
const isId = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isFont = (value: unknown, forComment: boolean) =>
  BOOK_FONTS.some((font) => font.value === value && !(forComment && "titleOnly" in font));

// Cada campo, su regla y su columna en user_books. Los textos con trim se guardan sin espacios a los lados.
const FIELDS: { [K in keyof NewBook]: { valid: (value: unknown) => boolean; column: string; trim?: true } } = {
  title: { valid: (value) => isText(value, 200), column: "title", trim: true },
  author: { valid: (value) => isText(value, 200), column: "author", trim: true },
  genre: { valid: (value) => isText(value, 100), column: "genre", trim: true },
  year: { valid: (value) => isInt(value, -3000, 2100), column: "year" },
  pages: { valid: (value) => isInt(value, 1, 100000), column: "pages" },
  coverColor: { valid: isColor, column: "cover_color" },
  fontColor: { valid: isColor, column: "font_color" },
  titleFont: { valid: (value) => isFont(value, false), column: "title_font" },
  commentFont: { valid: (value) => isFont(value, true), column: "comment_font" },
  status: { valid: (value) => BOOK_STATUSES.some((status) => status.value === value), column: "status" },
  comment: { valid: (value) => typeof value === "string" && length(value) <= 4000, column: "comment" },
  quote: { valid: (value) => typeof value === "string" && length(value) <= 300, column: "quote", trim: true },
};
const KEYS = Object.keys(FIELDS) as (keyof NewBook)[];

const isValid = (book: NewBook) => KEYS.every((key) => FIELDS[key].valid(book[key]));

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

// Saca un libro de la estantería del usuario: lo elimina para siempre. Solo puede borrar sus propios libros (la política
// de la tabla lo exige igual).
export async function deleteBook(bookId: string): Promise<DeleteBookResult> {
  if (!isId(bookId)) return { error: "No pudimos sacar el libro." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Tu sesión terminó. Vuelve a ingresar." };

  // select: confirma que se borró un libro del usuario (si no es suyo, no se borra ninguna fila).
  const { data, error } = await supabase.from("user_books").delete().eq("id", bookId).eq("user_id", userId).select("id");
  if (error || !data?.length) return { error: "No pudimos sacar el libro. Intenta de nuevo." };
  refresh();
  return {};
}

// Actualiza solo los campos que cambiaron (changes, comparados en el cliente con lo guardado). Se validan igual que al
// guardar; si cambian las páginas, cambia también la categoría. Solo puede actualizar sus propios libros.
export async function updateBook(bookId: string, changes: Partial<NewBook>): Promise<UpdateBookResult> {
  const keys = changes && typeof changes === "object" ? Object.keys(changes) : [];
  // Viene del cliente: solo campos conocidos y válidos, y al menos uno.
  if (!isId(bookId) || keys.length === 0 || !keys.every((key) => key in FIELDS && FIELDS[key as keyof NewBook].valid(changes[key as keyof NewBook]))) {
    return { error: "Revisa los datos del libro." };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Tu sesión terminó. Vuelve a ingresar." };

  const row: Record<string, unknown> = {};
  for (const key of keys as (keyof NewBook)[]) {
    const { column, trim } = FIELDS[key];
    const value = changes[key];
    row[column] = trim ? String(value).trim() : value;
  }
  if (changes.pages !== undefined) row.category = bookCategory(changes.pages);

  // select: confirma que se actualizó un libro del usuario (si no es suyo, no se actualiza ninguna fila).
  const { data, error } = await supabase.from("user_books").update(row).eq("id", bookId).eq("user_id", userId).select("id");
  if (error || !data?.length) return { error: "No pudimos actualizar tu libro. Intenta de nuevo." };
  refresh();
  return {};
}
