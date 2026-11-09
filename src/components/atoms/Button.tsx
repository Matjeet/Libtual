import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "destructive";

// ComponentProps incluye ref (React 19 lo pasa como prop normal).
type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  danger: "border border-danger bg-danger/10 text-danger hover:bg-danger/20",
  // Acción secundaria que no compite con la principal (por ejemplo, Cancelar).
  ghost: "bg-transparent text-foreground hover:bg-foreground/10",
  // Confirmación final de una acción irreversible.
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
};

// Exportado para dar estilo de botón a enlaces (<Link>) sin anidar elementos interactivos.
export function buttonClasses(variant: ButtonVariant = "primary", className = "") {
  return `inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`;
}

export function Button({ variant = "primary", type = "button", className = "", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />;
}
