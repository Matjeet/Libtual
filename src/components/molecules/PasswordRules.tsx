import { PASSWORD_RULES } from "@/lib/registration";

type PasswordRulesProps = {
  id: string;
  password: string;
  // Al salir del campo, los requisitos pendientes se marcan como error.
  showErrors?: boolean;
};

export function PasswordRules({ id, password, showErrors = false }: PasswordRulesProps) {
  return (
    <ul id={id} aria-label="Requisitos de la contraseña" className="mt-1 flex flex-col gap-1 text-sm">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        const color = met ? "text-success" : showErrors ? "text-danger" : "text-foreground/70";
        return (
          <li key={rule.id} className={`flex items-center gap-2 transition-colors ${color}`}>
            <span aria-hidden="true" className="w-4 text-center font-bold">
              {met ? "✓" : showErrors ? "✕" : "•"}
            </span>
            {rule.label}
            <span className="sr-only">{met ? ", cumplido" : ", pendiente"}</span>
          </li>
        );
      })}
    </ul>
  );
}
