import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`h-10 w-full rounded-lg border border-foreground/30 bg-background px-3 text-foreground outline-none transition focus:border-foreground aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger ${className}`}
      {...props}
    />
  );
}
