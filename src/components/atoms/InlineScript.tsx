"use client";

// Script que el navegador corre mientras lee el HTML del servidor, antes de pintar. En el cliente queda como text/plain:
// React no lo ejecuta ni avisa por él (suppressHydrationWarning acepta el cambio de type).
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
