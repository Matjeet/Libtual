"use client";

import { useEffect, useState } from "react";

type RotatingTextProps = {
  phrases: readonly string[];
  // Tiempo que se muestra cada frase.
  intervalMs?: number;
};

// Muestra una frase a la vez y la cambia cada `intervalMs`: la actual sale hacia arriba y la nueva entra desde abajo.
// Todas las frases ocupan la misma celda del grid, así el alto reservado es el de la más larga y nada salta al cambiar.
export function RotatingText({ phrases, intervalMs = 30_000 }: RotatingTextProps) {
  // previous es null en la primera frase: se muestra sin animación de entrada.
  const [{ index, previous }, setRotation] = useState<{ index: number; previous: number | null }>({ index: 0, previous: null });

  useEffect(() => {
    const timer = setInterval(() => {
      setRotation((current) => ({ index: (current.index + 1) % phrases.length, previous: current.index }));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [phrases.length, intervalMs]);

  return (
    <span className="grid overflow-hidden">
      {phrases.map((phrase, i) => {
        const state = i === index ? (previous === null ? "shown" : "entering") : i === previous ? "leaving" : "hidden";
        return (
          <span
            key={phrase}
            data-state={state}
            aria-hidden={i !== index}
            className={`col-start-1 row-start-1 ${
              state === "entering"
                ? "animate-[phrase-in_600ms_ease-out_both] motion-reduce:animate-none"
                : state === "leaving"
                  ? "animate-[phrase-out_600ms_ease-in_both] motion-reduce:invisible motion-reduce:animate-none"
                  : state === "hidden"
                    ? "invisible"
                    : ""
            }`}
          >
            {phrase}
          </span>
        );
      })}
    </span>
  );
}
