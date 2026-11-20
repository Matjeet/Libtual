"use server";

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
// Queda último en el orden de la estantería: el siguiente número después del más alto (el primero es 1).
export async function saveBook(book: NewBook): Promise<SaveBookResult> {
  // Viene del cliente: se valida antes de tocar la base de datos.
  if (!book || !isValid(book)) return { error: "Revisa los datos del libro." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Tu sesión terminó. Vuelve a ingresar." };

  // shortcut: dos libros guardados al mismo tiempo pueden quedar con el mismo número; si llega a pasar, calcularlo en la
  // base de datos (una función o un trigger) en vez de aquí.
  const last = await supabase
    .from("user_books")
    .select("shelf_order")
    .eq("user_id", userId)
    .order("shelf_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (last.error) return { error: "No pudimos guardar tu libro. Intenta de nuevo." };
  const shelfOrder = (last.data?.shelf_order ?? 0) + 1;

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
