import Link from "next/link";
import { buttonClasses } from "@/components/atoms/Button";
import { BrandPanel } from "@/components/organisms/BrandPanel";
import { MainTemplate } from "@/components/templates/MainTemplate";

export default function Home() {
  return (
    <MainTemplate>
      {/* Mobile-first: hero centrado; desde lg, texto a la izquierda y panel de marca a la derecha. */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center lg:grid lg:grid-cols-2 lg:gap-16 lg:text-left">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">Bienvenido a Libtual</h1>
          <p className="max-w-md text-lg text-foreground/80 lg:max-w-xl lg:text-xl">Maqueta inicial del proyecto.</p>
          <Link href="/registro" className={buttonClasses()}>
            Comenzar
          </Link>
        </div>
        <BrandPanel className="hidden lg:flex" title="Libtual" description="Maqueta inicial del proyecto." />
      </section>
    </MainTemplate>
  );
}
