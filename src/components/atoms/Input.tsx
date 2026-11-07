import type { ComponentProps } from "react";

// ComponentProps incluye ref (React 19 lo pasa como prop normal).
export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`h-10 w-full rounded-lg border border-foreground/30 bg-background px-3 text-foreground outline-none transition focus:border-foreground aria-invalid:border-danger aria-invalid:ring-1 aria-invalid:ring-danger ${className}`}
      {...props}
    />
  );
}
