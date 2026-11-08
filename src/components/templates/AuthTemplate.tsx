import type { ReactNode } from "react";
import { BrandPanel } from "@/components/organisms/BrandPanel";
import { MainTemplate } from "@/components/templates/MainTemplate";

type AuthTemplateProps = {
  title: string;
  // Texto o contenido (por ejemplo, frases rotativas) bajo el nombre en el panel de marca.
  brandDescription: ReactNode;
  // Lado del formulario desde lg; el panel de marca ocupa el otro.
  formSide: "left" | "right";
  // Muestra el botón "Ingresar" en el header (oculto por defecto).
  showSignIn?: boolean;
  children: ReactNode;
};

// Páginas de autenticación (registro, login): un bloque sólido con el formulario y, desde lg, el panel de marca al lado.
export function AuthTemplate({ title, brandDescription, formSide, showSignIn = false, children }: AuthTemplateProps) {
  return (
    <MainTemplate showSignIn={showSignIn}>
      {/* Mobile-first: una columna; desde lg dos columnas con el panel de marca. my-auto centra el conjunto en el body. */}
      <section className="my-auto flex flex-col items-center gap-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16">
        <BrandPanel
          className={`hidden lg:flex ${formSide === "left" ? "lg:order-last" : ""}`}
          title="Libtual"
          description={brandDescription}
        />
        {/* Bloque sólido sobre el fondo animado. En celular va de borde a borde (así el calendario conserva el ancho
            para días de 44 px); desde sm es una tarjeta. */}
        <div className="-mx-4 flex flex-col items-center gap-6 self-stretch bg-card px-4 py-8 shadow-sm sm:mx-0 sm:w-full sm:max-w-md sm:self-center sm:rounded-2xl sm:p-8 sm:shadow-lg sm:ring-1 sm:ring-foreground/10 lg:justify-self-center">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {children}
        </div>
      </section>
    </MainTemplate>
  );
}
