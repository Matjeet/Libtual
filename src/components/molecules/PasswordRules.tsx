import { PASSWORD_RULES } from "@/lib/registration";

export function PasswordRules({ id, password }: { id: string; password: string }) {
  return (
    <ul id={id} aria-label="Requisitos de la contraseña" className="mt-1 flex flex-col gap-1 text-sm">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li key={rule.id} className={`flex items-center gap-2 transition-colors ${met ? "text-success" : "text-foreground/70"}`}>
            <span aria-hidden="true" className="w-4 text-center font-bold">
              {met ? "✓" : "•"}
            </span>
            {rule.label}
            <span className="sr-only">{met ? ", cumplido" : ", pendiente"}</span>
          </li>
        );
      })}
    </ul>
  );
}
