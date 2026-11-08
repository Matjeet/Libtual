"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Flag } from "@/components/atoms/Flag";
import { Input } from "@/components/atoms/Input";
import type { Country } from "@/lib/registration";

type CountrySelectProps = {
  id: string;
  name: string;
  countries: Country[];
  value: string;
  onChange: (code: string) => void;
  onBlur: () => void;
  invalid?: boolean;
  describedBy?: string;
  placeholder?: string;
};

// Sin mayúsculas ni tildes: "mex" encuentra "México".
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// Combobox editable con autocompletado de lista (patrón WAI-ARIA APG): escribir filtra los países que contienen el texto.
// El foco nunca sale del input; la opción activa se anuncia con aria-activedescendant.
export function CountrySelect({
  id,
  name,
  countries,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  placeholder = "Escribe o selecciona tu país",
}: CountrySelectProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  // null = no está escribiendo: el input muestra el país elegido y la lista sale completa.
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const selected = countries.find((country) => country.code === value);
  const filtered = query === null ? countries : countries.filter((country) => normalize(country.name).includes(normalize(query)));
  const activeIndex = Math.min(active, filtered.length - 1);
  const activeCountry = open ? filtered[activeIndex] : undefined;

  useEffect(() => {
    if (open && activeCountry) document.getElementById(`${listId}-${activeCountry.code}`)?.scrollIntoView({ block: "nearest" });
  }, [open, activeCountry, listId]);

  function openList() {
    setActive(query === null ? Math.max(0, countries.findIndex((country) => country.code === value)) : 0);
    setOpen(true);
  }

  function choose(country: Country) {
    onChange(country.code);
    setQuery(null);
    setOpen(false);
  }

  function type(text: string) {
    setQuery(text);
    setActive(0);
    setOpen(true);
  }

  // Lo escrito se resuelve al salir: un país identificado queda elegido; si no, el campo queda vacío.
  // Mientras se escribe se conserva el país anterior para que Escape pueda volver a él.
  function leave() {
    if (query !== null) {
      const text = normalize(query);
      const match =
        countries.find((country) => normalize(country.name) === text) ?? (text && filtered.length === 1 ? filtered[0] : undefined);
      onChange(match?.code ?? "");
    }
    setQuery(null);
    setOpen(false);
    onBlur();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return openList();
      setActive(Math.min(activeIndex + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp" && open) {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter" && activeCountry) {
      // Elige la opción en vez de enviar el formulario.
      event.preventDefault();
      choose(activeCountry);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery(null);
      setOpen(false);
    }
  }

  const showFlag = query === null && selected;

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      {showFlag && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Flag code={selected.code} />
        </span>
      )}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeCountry ? `${listId}-${activeCountry.code}` : undefined}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        placeholder={placeholder}
        value={query ?? selected?.name ?? ""}
        onChange={(event) => type(event.target.value)}
        onClick={() => !open && openList()}
        onKeyDown={onKeyDown}
        onBlur={leave}
        className={`pr-12 ${showFlag ? "pl-11" : ""}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Mostrar países"
        // Mantiene el foco en el input al usar el botón.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          inputRef.current?.focus();
          if (open) setOpen(false);
          else openList();
        }}
        className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-foreground"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className={`size-5 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label="Países"
        hidden={!open}
        // Evita que el clic en la lista (o su barra de scroll) quite el foco del input.
        onMouseDown={(event) => event.preventDefault()}
        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-foreground/20 bg-background py-1 shadow-lg"
      >
        {filtered.map((country, index) => (
          <li
            key={country.code}
            id={`${listId}-${country.code}`}
            role="option"
            aria-selected={country.code === value}
            onClick={() => choose(country)}
            onMouseEnter={() => setActive(index)}
            className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${index === activeIndex ? "bg-surface text-surface-foreground" : ""} ${country.code === value ? "font-semibold" : ""}`}
          >
            <Flag code={country.code} />
            {country.name}
          </li>
        ))}
        {filtered.length === 0 && (
          <li role="presentation" className="px-3 py-2 text-foreground/70">
            No hay países que coincidan con “{query?.trim()}”.
          </li>
        )}
      </ul>
    </div>
  );
}
