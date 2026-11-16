import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Categoría según la cantidad de páginas: define qué tan grueso (y, si es corto, qué tan bajo) se ve en la estantería.
export type BookCategory = "small" | "medium" | "large" | "extra_large";

// Corto: hasta 200 páginas; mediano: 201–400; largo: 401–600; extra largo: más de 600.
export function bookCategory(pages: number): BookCategory {
  if (pages <= 200) return "small";
  if (pages <= 400) return "medium";
  if (pages <= 600) return "large";
  return "extra_large";
}

// Estado de lectura: value es lo que se guarda en la base de datos.
export const BOOK_STATUSES = [
  { value: "pending", label: "Pendiente" },
  { value: "reading", label: "Leyendo" },
  { value: "finished", label: "Terminado" },
] as const;

// Lo que la estantería necesita para dibujar el lomo de cada libro.
export type ShelfBook = { id: string; title: string; category: BookCategory; coverColor: string; fontColor: string; titleFont: string };

type BookRow = { id: string; title: string; category: BookCategory; cover_color: string; font_color: string; title_font: string };

// Libros del usuario en el orden en que los agregó. Si la lectura falla, la estantería queda vacía en vez de romper la página.
export async function getUserBooks(supabase: Supabase, userId: string): Promise<ShelfBook[]> {
  const { data, error } = await supabase
    .from("user_books")
    .select("id, title, category, cover_color, font_color, title_font")
    .eq("user_id", userId)
    .order("created_at");
  if (error || !data) return [];
  return (data as BookRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    coverColor: row.cover_color,
    fontColor: row.font_color,
    titleFont: row.title_font,
  }));
}
