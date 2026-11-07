"use client";

import { DayPicker } from "@daypicker/react";
import { es } from "@daypicker/react/locale";
import "@daypicker/react/style.css";
import { useId, useRef, useState, type ComponentProps } from "react";
import { Input } from "@/components/atoms/Input";

type DateFieldProps = Omit<ComponentProps<"input">, "type" | "value" | "defaultValue" | "onChange" | "onBlur" | "ref"> & {
  id: string;
  // YYYY-MM-DD, igual que el valor del input nativo.
  value: string;
  onChange: (value: string) => void;
  // Se llama cuando el usuario termina con el campo: al salir de él (input, botón y calendario)
  // o al elegir un día en el calendario, aunque el foco siga dentro (vuelve al botón).
  onBlur: () => void;
  calendarLabel: string;
};

// Fechas locales a medianoche: toISOString() las correría un día según la zona horaria.
const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const fromIso = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
};

// Input de fecha nativo (formato según el idioma del navegador) con el calendario de DayPicker en lugar del nativo.
export function DateField({ id, value, onChange, onBlur, calendarLabel, className = "", ...inputProps }: DateFieldProps) {
  const dialogId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const selected = fromIso(value);
  const today = new Date();

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function select(date: Date | undefined) {
    if (!date) return;
    const iso = toIso(date);
    // El input no es controlado: se escribe en el DOM y se avisa al formulario.
    inputRef.current!.value = iso;
    onChange(iso);
    close();
    // Elegir en el calendario completa el campo: el formulario puede mostrar su error de inmediato.
    onBlur();
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        setOpen(false);
        onBlur();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          close();
        }
      }}
    >
      <Input
        ref={inputRef}
        id={id}
        type="date"
        onChange={(event) => onChange(event.target.value)}
        // Oculta el ícono del calendario nativo (Chrome, Edge, Safari); Firefox no permite ocultarlo.
        className={`pr-12 [&::-webkit-calendar-picker-indicator]:hidden ${className}`}
        {...inputProps}
      />
      <button
        ref={buttonRef}
        type="button"
        aria-label={calendarLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen((current) => !current)}
        className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg text-foreground/70 transition hover:bg-foreground/5 hover:text-foreground"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
        </svg>
      </button>

      {open && (
        <div
          id={dialogId}
          role="dialog"
          aria-label={calendarLabel}
          className="calendar absolute -inset-x-4 z-20 mt-1 rounded-lg border border-foreground/20 bg-background p-1 text-foreground shadow-lg sm:left-auto sm:right-0 sm:p-3"
        >
          <DayPicker
            mode="single"
            locale={es}
            captionLayout="dropdown"
            startMonth={new Date(1900, 0)}
            endMonth={today}
            defaultMonth={selected ?? today}
            selected={selected}
            onSelect={select}
            disabled={{ after: today }}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
