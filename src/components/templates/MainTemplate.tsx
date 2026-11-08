import type { ReactNode } from "react";
import { Header } from "@/components/organisms/Header";

export function MainTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {/* Mismo padding lateral que el header: lo anclado a los bordes queda alineado y cerca de ellos en pantallas grandes. */}
      <main className="flex w-full flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8 xl:px-12">{children}</main>
    </>
  );
}
