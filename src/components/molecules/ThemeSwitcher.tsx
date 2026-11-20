"use client";

import { ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useId, useState } from "react";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";

const OPTIONS = [
  { value: "system", label: "Predeterminado", icon: Monitor },
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
] as const;

// Elegir el modo de color: el título "Tema" despliega debajo las tres opciones, cada una con su radio y su icono.
// Se monta solo en el navegador (dentro del menú abierto), así que puede leer el modo actual al crearse.
export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const [open, setOpen] = useState(false);
  const listId = useId();
  return (
    <div className="border-b border-foreground/20 pb-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center justify-between rounded-lg px-2 text-left text-lg transition hover:bg-foreground/10"
      >
        Tema
        <ChevronDown aria-hidden="true" className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <fieldset id={listId} className="flex flex-col">
          <legend className="sr-only">Tema</legend>
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <label key={value} className="-mx-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 transition hover:bg-foreground/10">
              <input
                type="radio"
                name="theme"
                value={value}
                checked={theme === value}
                onChange={() => {
                  setTheme(value);
                  applyTheme(value);
                }}
                className="size-5 shrink-0 cursor-pointer accent-primary"
              />
              {label}
              <Icon aria-hidden="true" className="size-5 shrink-0" />
            </label>
          ))}
        </fieldset>
      )}
    </div>
  );
}
