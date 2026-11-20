"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";

const OPTIONS = [
  { value: "system", label: "Predeterminado", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
] as const;

// Elegir el modo de color: tres opciones en una fila (radios con aspecto de botones segmentados).
// Se monta solo en el navegador (dentro del menú abierto), así que puede leer el modo actual al crearse.
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm text-foreground/70">Modo</legend>
      {/* Predeterminado es la palabra más larga: su columna es más ancha para que entre en celulares de 320 px. minmax(0, …): el ancho no cambia al ponerse en negrita. */}
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 rounded-xl bg-foreground/5 p-1">
        {OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex min-h-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-xs transition hover:bg-foreground/10 has-checked:bg-background has-checked:font-semibold has-checked:shadow-sm has-checked:ring-1 has-checked:ring-foreground/15 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground"
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => {
                setTheme(value);
                applyTheme(value);
              }}
              className="sr-only"
            />
            <Icon aria-hidden="true" className="size-5" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
