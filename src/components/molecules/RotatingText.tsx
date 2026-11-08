"use client";

import { useEffect, useState, type CSSProperties } from "react";

type RotatingTextProps = {
  phrases: readonly string[];
  // Tiempo que se muestra cada frase.
  intervalMs?: number;
  // Duración de la animación de entrada y salida.
  animationMs?: number;
  // Para usarlo dentro de una línea de texto (por ejemplo, una sola letra de un título).
  inline?: boolean;
};

// Muestra una frase a la vez y la cambia cada `intervalMs`: la actual sale hacia arriba y la nueva entra desde abajo.
// Todas las frases ocupan la misma celda del grid, así el alto reservado es el de la más larga y nada salta al cambiar.
export function RotatingText({ phrases, intervalMs = 30_000, animationMs = 600, inline = false }: RotatingTextProps) {
  // previous es null en la primera frase: se muestra sin animación de entrada.
  const [{ index, previous }, setRotation] = useState<{ index: number; previous: number | null }>({ index: 0, previous: null });

  useEffect(() => {
    const timer = setInterval(() => {
      setRotation((current) => ({ index: (current.index + 1) % phrases.length, previous: current.index }));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [phrases.length, intervalMs]);

  return (
    <span
      className={`${inline ? "inline-grid" : "grid"} overflow-hidden`}
      style={{ "--rotate-ms": `${animationMs}ms` } as CSSProperties}
    >
      {phrases.map((phrase, i) => {
        const state = i === index ? (previous === null ? "shown" : "entering") : i === previous ? "leaving" : "hidden";
        return (
          <span
            key={phrase}
            data-state={state}
            aria-hidden={i !== index}
            className={`col-start-1 row-start-1 ${
              state === "entering"
                ? "animate-[phrase-in_var(--rotate-ms)_ease-out_both] motion-reduce:animate-none"
                : state === "leaving"
                  ? "animate-[phrase-out_var(--rotate-ms)_ease-in_both] motion-reduce:invisible motion-reduce:animate-none"
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
