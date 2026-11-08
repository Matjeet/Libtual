import type { ReactNode } from "react";
import { Header } from "@/components/organisms/Header";

export function MainTemplate({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-12">{children}</main>
    </>
  );
}
