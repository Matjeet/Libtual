"use server";

import { refresh } from "next/cache";
import type { FrameShape } from "@/components/atoms/PaintingFrame";
import { PAINTING_BUCKETS } from "@/lib/paintings";
import { createClient } from "@/lib/supabase/server";

export type MarketImage = { path: string; url: string };
export type MarketCatalog = Record<FrameShape, MarketImage[]>;
export type CatalogResult = { catalog?: MarketCatalog; error?: string };
export type ChooseResult = { error?: string };

const FRAMES = Object.keys(PAINTING_BUCKETS) as FrameShape[];
// Solo archivos .webp en la raíz del bucket: es lo que aceptan los buckets y la tabla.
const IMAGE_NAME = /^[^/]{1,250}\.webp$/i;
const GENERIC_ERROR = "No pudimos guardar tu elección. Intenta de nuevo.";

// Todas las imágenes de los 4 buckets, agrupadas por cuadro, con su URL pública.
// shortcut: lista hasta 1000 imágenes por bucket en una sola llamada; paginar si un bucket crece más.
export async function listPaintingCatalog(): Promise<CatalogResult> {
  const supabase = await createClient();
  try {
    const entries = await Promise.all(
      FRAMES.map(async (frame) => {
        const bucket = supabase.storage.from(PAINTING_BUCKETS[frame]);
        const { data, error } = await bucket.list("", { limit: 1000, sortBy: { column: "name", order: "asc" } });
        if (error) throw error;
        const images = (data ?? [])
          .filter((file) => IMAGE_NAME.test(file.name))
          .map((file) => ({ path: file.name, url: bucket.getPublicUrl(file.name).data.publicUrl }));
        return [frame, images] as const;
      }),
    );
    return { catalog: Object.fromEntries(entries) as MarketCatalog };
  } catch {
    return { error: "No pudimos cargar las imágenes. Intenta de nuevo." };
  }
}

// Guarda la imagen elegida para un cuadro (una por cuadro: si ya había otra, la reemplaza) y refresca la página.
export async function choosePainting(frame: FrameShape, path: string): Promise<ChooseResult> {
  // Vienen del cliente: se validan antes de tocar la base de datos.
  if (!FRAMES.includes(frame) || typeof path !== "string" || !IMAGE_NAME.test(path)) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return { error: "Tu sesión terminó. Vuelve a ingresar." };

  // La imagen tiene que existir en el bucket de ese cuadro.
  const { data: found, error: listError } = await supabase.storage.from(PAINTING_BUCKETS[frame]).list("", { search: path });
  if (listError || !found?.some((file) => file.name === path)) return { error: "Esa imagen ya no está disponible." };

  const { error } = await supabase
    .from("user_paintings")
    .upsert({ user_id: userId, frame, image_path: path, updated_at: new Date().toISOString() });
  if (error) return { error: GENERIC_ERROR };

  refresh();
  return {};
}
