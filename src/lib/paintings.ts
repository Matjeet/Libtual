import type { FrameShape } from "@/components/atoms/PaintingFrame";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Cada cuadro tiene su bucket público con las imágenes que se pueden usar en él (resoluciones en docs/cuadros.md).
export const PAINTING_BUCKETS: Record<FrameShape, string> = {
  oval: "painting-oval",
  portrait: "painting-portrait",
  round: "painting-round",
  landscape: "painting-landscape",
};

// URL pública de la imagen de cada cuadro del usuario. Un cuadro sin imagen no aparece.
export type PaintingImages = Partial<Record<FrameShape, string>>;

// Lee qué imagen eligió el usuario para cada cuadro y arma su URL pública.
// Si la lectura falla, los cuadros quedan con el lienzo vacío en vez de romper la página.
export async function getPaintingImages(supabase: Supabase, userId: string): Promise<PaintingImages> {
  const { data, error } = await supabase.from("user_paintings").select("frame, image_path").eq("user_id", userId);
  if (error || !data) return {};

  const images: PaintingImages = {};
  for (const { frame, image_path } of data as { frame: string; image_path: string }[]) {
    if (!(frame in PAINTING_BUCKETS)) continue;
    const shape = frame as FrameShape;
    images[shape] = supabase.storage.from(PAINTING_BUCKETS[shape]).getPublicUrl(image_path).data.publicUrl;
  }
  return images;
}
