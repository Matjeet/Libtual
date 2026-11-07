import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-10 w-full rounded-lg border border-foreground/30 bg-background px-3 text-foreground outline-none transition focus:border-foreground aria-invalid:border-danger ${className}`}
      {...props}
    />
  );
}
