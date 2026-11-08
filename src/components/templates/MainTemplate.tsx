import type { ReactNode } from "react";
import { BooksBackground } from "@/components/organisms/BooksBackground";
import { Header } from "@/components/organisms/Header";

export function MainTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {/* El fondo animado cubre solo el body; el header queda sólido encima. */}
      <div className="relative flex flex-1 flex-col">
        <BooksBackground />
        <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12">{children}</main>
      </div>
    </>
  );
}
