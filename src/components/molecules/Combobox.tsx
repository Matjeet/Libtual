"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

export type ComboboxOption = { value: string; label: string; group?: string; style?: CSSProperties };

type ComboboxProps = {
  id: string;
  name: string;
  options: readonly ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  // Nombre de la lista en plural ("Fuentes"): para lectores de pantalla, el botón y el aviso sin coincidencias.
  listLabel: string;
  // Acepta un texto que no está en la lista: se guarda tal cual lo escribió el usuario.
  allowCustom?: boolean;
  required?: boolean;
  maxLength?: number;
  invalid?: boolean;
  // Id del mensaje de error; solo se usa mientras invalid.
  describedBy?: string;
  // Estilos del input (los de cada formulario) y su fuente.
  className?: string;
  style?: CSSProperties;
};

// Sin mayúsculas ni tildes: "fantasia" encuentra "Fantasía".
const normalize = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// Combobox editable con autocompletado de lista (patrón WAI-ARIA APG), construido como CountrySelect: escribir filtra
// las opciones que contienen el texto, el foco nunca sale del input y la opción activa se anuncia con aria-activedescendant.
// La lista usa los colores del papel del libro (tinta sobre papel, iguales en modo claro y oscuro).
// Sin allowCustom, lo escrito que no coincide con una opción se descarta y vuelve el valor anterior.
// Con allowCustom no se marca ninguna opción al escribir (Enter no reemplaza lo escrito): se eligen con las flechas o el mouse.
export function Combobox({
  id,
  name,
  options,
  value,
  onChange,
  listLabel,
  allowCustom = false,
  required,
  maxLength,
  invalid,
  describedBy,
  className = "",
  style,
}: ComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  // null = no está escribiendo: el input muestra el valor elegido y la lista sale completa.
  const [query, setQuery] = useState<string | null>(null);
  // -1 = ninguna opción activa.
  const [active, setActive] = useState(-1);

  const optionId = (option: ComboboxOption) => `${listId}-${options.indexOf(option)}`;
  const selected = options.find((option) => option.value === value);
  const filtered = query === null ? options : options.filter((option) => normalize(option.label).includes(normalize(query)));
  const activeIndex = Math.min(active, filtered.length - 1);
  const activeOption = open && activeIndex >= 0 ? filtered[activeIndex] : undefined;
  // Grupos en el orden en que aparecen; las opciones sin grupo van sueltas.
  const groups = [...new Set(filtered.map((option) => option.group))];

  // La lista abierta y la opción activa quedan a la vista (dentro de la página del libro, que tiene su propio scroll).
  useEffect(() => {
    if (open) listRef.current?.scrollIntoView({ block: "nearest" });
  }, [open]);
  const activeId = activeOption ? optionId(activeOption) : undefined;
  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function openList() {
    setActive(query === null ? options.indexOf(selected!) : allowCustom ? -1 : 0);
    setOpen(true);
  }

  function choose(option: ComboboxOption) {
    onChange(option.value);
    setQuery(null);
    setOpen(false);
  }

  function type(text: string) {
    setQuery(text);
    setActive(allowCustom ? -1 : 0);
    setOpen(true);
  }

  // Lo escrito se resuelve al salir (o con Enter sin opción activa): una opción identificada queda elegida;
  // si no, se guarda el texto (allowCustom) o vuelve el valor anterior.
  function commit() {
    if (query !== null) {
      const text = normalize(query);
      const match = options.find((option) => normalize(option.label) === text) ?? (!allowCustom && text && filtered.length === 1 ? filtered[0] : undefined);
      if (match) onChange(match.value);
      else if (allowCustom) onChange(query.trim());
    }
    setQuery(null);
    setOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) return openList();
      setActive(Math.min(activeIndex + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp" && open) {
      event.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (event.key === "Enter" && open) {
      // Elige la opción (o confirma lo escrito) en vez de enviar el formulario.
      event.preventDefault();
      if (activeOption) choose(activeOption);
      else commit();
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery(null);
      setOpen(false);
    }
  }

  const renderOption = (option: ComboboxOption) => (
    <li
      key={option.value}
      id={optionId(option)}
      role="option"
      aria-selected={option.value === value}
      onClick={() => choose(option)}
      onMouseEnter={() => setActive(filtered.indexOf(option))}
      style={option.style}
      className={`flex min-h-11 cursor-pointer items-center px-3 ${option === activeOption ? "bg-(--ink)/10" : ""} ${option.value === value ? "font-semibold" : ""}`}
    >
      {option.label}
    </li>
  );

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeId}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? describedBy : undefined}
        maxLength={maxLength}
        value={query ?? selected?.label ?? (allowCustom ? value : "")}
        onChange={(event) => type(event.target.value)}
        onClick={() => !open && openList()}
        onKeyDown={onKeyDown}
        onBlur={commit}
        style={style}
        // pr-9! gana a los paddings del formulario (también los de container queries); el texto termina antes del chevron.
        className={`${className} text-ellipsis pr-9!`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={`Mostrar ${listLabel.toLowerCase()}`}
        // Mantiene el foco en el input al usar el botón.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => {
          inputRef.current?.focus();
          if (open) setOpen(false);
          else openList();
        }}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center"
      >
        <ChevronDown aria-hidden="true" className={`size-5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={1.75} />
      </button>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={listLabel}
        hidden={!open}
        // Evita que el clic en la lista (o su barra de scroll) quite el foco del input.
        onMouseDown={(event) => event.preventDefault()}
        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-(--ink)/30 bg-[#fdfaf5] py-1 font-normal shadow-lg [scrollbar-width:thin]"
      >
        {groups.map((group, index) =>
          group === undefined ? (
            filtered.filter((option) => option.group === undefined).map(renderOption)
          ) : (
            <li key={group} role="presentation">
              <div id={`${listId}-group-${index}`} className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide opacity-70">
                {group}
              </div>
              <ul role="group" aria-labelledby={`${listId}-group-${index}`}>
                {filtered.filter((option) => option.group === group).map(renderOption)}
              </ul>
            </li>
          ),
        )}
        {filtered.length === 0 && (
          <li role="presentation" className="px-3 py-2 opacity-70">
            {allowCustom ? `Se guardará “${query?.trim()}”.` : `No hay ${listLabel.toLowerCase()} que coincidan con “${query?.trim()}”.`}
          </li>
        )}
      </ul>
    </div>
  );
}
