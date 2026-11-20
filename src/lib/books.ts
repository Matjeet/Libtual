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

// Estado de lectura: value es lo que se guarda en la base de datos; color, el del separador del libro.
export const BOOK_STATUSES = [
  { value: "pending", label: "Pendiente", color: "#f2c230" },
  { value: "reading", label: "Leyendo", color: "#2f6fd6" },
  { value: "finished", label: "Terminado", color: "#2e9d4f" },
] as const;

// Color del separador según el estado; uno desconocido se ve como pendiente.
export const bookmarkColor = (status: string) => (BOOK_STATUSES.find(({ value }) => value === status) ?? BOOK_STATUSES[0]).color;

// Géneros sugeridos en el formulario; el usuario también puede escribir uno que no esté en la lista.
export const BOOK_GENRES = [
  "Novela",
  "Cuento",
  "Poesía",
  "Teatro",
  "Fantasía",
  "Ciencia ficción",
  "Distopía",
  "Terror",
  "Misterio",
  "Policiaca",
  "Thriller",
  "Romance",
  "Novela histórica",
  "Aventura",
  "Realismo mágico",
  "Humor",
  "Clásico",
  "Infantil",
  "Juvenil",
  "Cómic y novela gráfica",
  "Manga",
  "Biografía",
  "Memorias",
  "Ensayo",
  "Historia",
  "Filosofía",
  "Psicología",
  "Divulgación científica",
  "Autoayuda",
  "Negocios",
  "Viajes",
  "Religión y espiritualidad",
] as const;

// Lo que la estantería necesita para dibujar el lomo de cada libro y mostrarlo abierto al elegirlo.
export type ShelfBook = {
  id: string;
  title: string;
  category: BookCategory;
  coverColor: string;
  fontColor: string;
  titleFont: string;
  author: string;
  year: number;
  genre: string;
  comment: string;
  commentFont: string;
  status: string;
  // Cita del libro; vacía si no la escribió.
  quote: string;
};

type BookRow = {
  id: string;
  title: string;
  category: BookCategory;
  cover_color: string;
  font_color: string;
  title_font: string;
  author: string;
  year: number;
  genre: string;
  comment: string;
  comment_font: string;
  status: string;
  quote: string;
};

// Libros del usuario en el orden de su estantería (shelf_order); a igual orden, el que se agregó primero. Si la lectura falla, la estantería queda vacía en vez de romper la página.
export async function getUserBooks(supabase: Supabase, userId: string): Promise<ShelfBook[]> {
  const { data, error } = await supabase
    .from("user_books")
    .select("id, title, category, cover_color, font_color, title_font, author, year, genre, comment, comment_font, status, quote")
    .eq("user_id", userId)
    .order("shelf_order")
    .order("created_at");
  if (error || !data) return [];
  return (data as BookRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    coverColor: row.cover_color,
    fontColor: row.font_color,
    titleFont: row.title_font,
    author: row.author,
    year: row.year,
    genre: row.genre,
    comment: row.comment,
    commentFont: row.comment_font,
    status: row.status,
    quote: row.quote,
  }));
}
