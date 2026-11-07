import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-foreground text-background hover:opacity-90",
  secondary: "border border-foreground/20 hover:bg-foreground/5",
};

export function Button({ variant = "primary", type = "button", className = "", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
