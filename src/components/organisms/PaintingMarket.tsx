"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import type { FrameShape } from "@/components/atoms/PaintingFrame";
import { PaintingMarketSkeleton } from "@/components/organisms/PaintingMarketSkeleton";
import { choosePainting, listPaintingCatalog, type MarketCatalog } from "@/lib/painting-actions";
import { PAINTING_FRAMES, type PaintingImages } from "@/lib/paintings";

// Miniaturas con la forma del área de imagen de cada marco (misma proporción que en docs/cuadros.md).
export const THUMB_SHAPE: Record<FrameShape, string> = {
  oval: "aspect-[77/107] rounded-[50%]",
  portrait: "aspect-[76/116] rounded-sm",
  round: "aspect-square rounded-full",
  landscape: "aspect-[110/70] rounded-sm",
};

type PaintingMarketProps = {
  // Cuadro desde el que se abrió (se muestra su sección primero); null = cerrado.
  frame: FrameShape | null;
  // URL de la imagen actual de cada cuadro, para marcarla como elegida.
  current: PaintingImages;
  onClose: () => void;
};

// Mercado de imágenes: un modal con todas las imágenes de los 4 buckets, en una sección por cuadro.
// Las imágenes cargan de forma diferida (loading="lazy"): solo se descargan las que están en pantalla.
export function PaintingMarket({ frame, current, onClose }: PaintingMarketProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [catalog, setCatalog] = useState<MarketCatalog>();
  const [loadError, setLoadError] = useState<string>();
  const [saveError, setSaveError] = useState<string>();
  const [saving, startSaving] = useTransition();

  // Abre el modal al elegir un cuadro y carga el catálogo la primera vez.
  useEffect(() => {
    if (!frame) return;
    const dialog = dialogRef.current!;
    if (!dialog.open) dialog.showModal();
    if (catalog) return;
    let active = true;
    listPaintingCatalog().then((result) => {
      if (!active) return;
      if (result.catalog) setCatalog(result.catalog);
      else setLoadError(result.error);
    });
    return () => {
      active = false;
    };
  }, [frame, catalog]);

  // Lleva la sección del cuadro elegido al inicio del modal.
  useEffect(() => {
    if (frame && catalog) document.getElementById(`market-${frame}`)?.scrollIntoView({ block: "start" });
  }, [frame, catalog]);

  function choose(shape: FrameShape, path: string) {
    setSaveError(undefined);
    startSaving(async () => {
      const result = await choosePainting(shape, path);
      if (result.error) setSaveError(result.error);
      else dialogRef.current?.close();
    });
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="market-title"
      onClose={() => {
        setSaveError(undefined);
        onClose();
      }}
      onCancel={(event) => saving && event.preventDefault()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-4xl flex-col overflow-hidden rounded-2xl bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40 backdrop:backdrop-blur-sm open:flex"
    >
      <header className="flex items-start justify-between gap-4 border-b border-foreground/10 px-5 py-4 sm:px-6">
        <div>
          <h2 id="market-title" className="text-xl font-semibold">
            Mercado de imágenes
          </h2>
          <p className="mt-1 text-foreground/80">Elige una imagen para cada cuadro de tu pared.</p>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          onClick={() => dialogRef.current?.close()}
          disabled={saving}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full transition hover:bg-foreground/10 disabled:opacity-50"
        >
          <X aria-hidden="true" className="size-6" />
        </button>
      </header>

      <div className="overflow-y-auto px-5 py-5 sm:px-6">
        {saveError && (
          <p role="alert" className="mb-4 text-danger">
            {saveError}
          </p>
        )}
        {loadError ? (
          <p role="alert" className="text-danger">
            {loadError}
          </p>
        ) : !catalog ? (
          <PaintingMarketSkeleton />
        ) : (
          <div className="flex flex-col gap-8">
            {PAINTING_FRAMES.map(({ shape, name, place }) => (
              <section key={shape} id={`market-${shape}`} aria-labelledby={`market-${shape}-title`} className="scroll-mt-2">
                <h3 id={`market-${shape}-title`} className="text-lg font-semibold">
                  {name}
                </h3>
                <p className="text-sm text-foreground/70">{place}</p>
                {catalog[shape].length === 0 ? (
                  <p className="mt-3 text-foreground/80">Todavía no hay imágenes para este cuadro.</p>
                ) : (
                  <ul className="mt-3 grid grid-cols-2 gap-4 min-[30rem]:grid-cols-3 lg:grid-cols-4">
                    {catalog[shape].map(({ path, url }) => {
                      const selected = current[shape] === url;
                      return (
                        <li key={path}>
                          <button
                            type="button"
                            aria-pressed={selected}
                            aria-label={`Usar ${path.replace(/\.webp$/i, "")} en el ${name.toLowerCase()}`}
                            onClick={() => choose(shape, path)}
                            disabled={saving}
                            className="group relative flex w-full items-center justify-center rounded-lg p-2 transition hover:bg-foreground/5 disabled:opacity-60"
                          >
                            <span
                              className={`block w-full overflow-hidden bg-foreground/10 ring-2 ${selected ? "ring-primary ring-offset-2 ring-offset-card" : "ring-foreground/15"} ${THUMB_SHAPE[shape]}`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element -- imágenes públicas de Supabase, ya optimizadas en WebP. */}
                              <img src={url} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
                            </span>
                            {selected && (
                              <span className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                                <Check aria-hidden="true" className="size-4" />
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
