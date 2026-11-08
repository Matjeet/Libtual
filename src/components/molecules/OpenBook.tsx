import { Dancing_Script } from "next/font/google";

const script = Dancing_Script({ subsets: ["latin"], weight: "700" });

// Libro abierto decorativo con "Libtual" en letra cursiva. Cada 10 s una hoja gira desde el lomo (de derecha a
// izquierda); el texto queda por encima de la hoja, así que siempre se lee "Libtual".
export function OpenBook({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative h-28 w-48 [perspective:800px] ${className}`}>
      {/* Grosor de las hojas bajo el libro. */}
      <div className="absolute inset-x-1 -bottom-1.5 h-3 rounded-b-md bg-foreground/15" />
      <div className="absolute inset-0 flex overflow-hidden rounded-md shadow-md ring-1 ring-foreground/15">
        <div className="flex-1 bg-background" />
        <div className="w-px bg-foreground/20" />
        <div className="flex-1 bg-background" />
      </div>
      <div
        data-testid="page"
        className="absolute inset-y-0 left-1/2 w-1/2 origin-left rounded-r-md bg-card opacity-0 ring-1 ring-foreground/10 animate-[page-turn_10s_ease-in-out_infinite] motion-reduce:animate-none"
      />
      <span className={`${script.className} absolute inset-0 flex items-center justify-center text-4xl text-foreground`}>
        Libtual
      </span>
    </div>
  );
}
