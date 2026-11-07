import Link from "next/link";
import { buttonClasses } from "@/components/atoms/Button";
import { MainTemplate } from "@/components/templates/MainTemplate";

export default function Home() {
  return (
    <MainTemplate>
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Bienvenido a Libtual</h1>
        <p className="max-w-md text-lg text-foreground/80">Maqueta inicial del proyecto.</p>
        <Link href="/registro" className={buttonClasses()}>
          Comenzar
        </Link>
      </section>
    </MainTemplate>
  );
}
