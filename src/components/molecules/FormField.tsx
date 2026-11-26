import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  // El control debe usar el mismo id y aria-describedby={`${id}-error`}.
  children: ReactNode;
};

export function FormField({ id, label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      <p id={`${id}-error`} className="min-h-5 text-sm text-danger" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
