"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Flag } from "@/components/atoms/Flag";
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

const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// Combobox de solo selección (patrón WAI-ARIA APG): el <select> nativo no admite banderas en todos los navegadores.
// El foco nunca sale del botón; la opción activa se anuncia con aria-activedescendant.
export function CountrySelect({
  id,
  name,
  countries,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
  placeholder = "Selecciona tu país",
}: CountrySelectProps) {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const selected = countries.find((country) => country.code === value);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    setActive(Math.max(0, countries.findIndex((country) => country.code === value)));
    setOpen(true);
  }

  function choose(index: number) {
    onChange(countries[index].code);
    setOpen(false);
  }

  function search(key: string) {
    const now = Date.now();
    const state = typeahead.current;
    state.text = now - state.time > 700 ? key : state.text + key;
    state.time = now;
    const match = countries.findIndex((country) => normalize(country.name).startsWith(normalize(state.text)));
    if (match < 0) return;
    if (open) setActive(match);
    else onChange(countries[match].code);
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = countries.length - 1;
    const searching = Date.now() - typeahead.current.time < 700;

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return openList();
      setActive((index) => (event.key === "ArrowDown" ? Math.min(index + 1, last) : Math.max(index - 1, 0)));
    } else if ((event.key === "Home" || event.key === "End") && open) {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : last);
    } else if (event.key === "Enter" || (event.key === " " && !searching)) {
      event.preventDefault();
      if (open) choose(active);
      else openList();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab" && open) {
      choose(active);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      search(event.key);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setOpen(false);
          onBlur();
        }}
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-foreground/30 bg-background pl-3 pr-10 text-left text-foreground outline-none transition focus:border-foreground aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger"
      >
        {selected ? (
          <>
            <Flag code={selected.code} />
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-foreground/60">{placeholder}</span>
        )}
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`pointer-events-none absolute right-3 size-5 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ul
        id={listId}
        ref={listRef}
        role="listbox"
        aria-label="Países"
        hidden={!open}
        // Evita que el clic en la lista (o su barra de scroll) quite el foco del botón.
        onMouseDown={(event) => event.preventDefault()}
        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-foreground/20 bg-background py-1 shadow-lg"
      >
        {countries.map((country, index) => (
          <li
            key={country.code}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={country.code === value}
            onClick={() => choose(index)}
            onMouseEnter={() => setActive(index)}
            className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${index === active ? "bg-surface text-surface-foreground" : ""} ${country.code === value ? "font-semibold" : ""}`}
          >
            <Flag code={country.code} />
            {country.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
