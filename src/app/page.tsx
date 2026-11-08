import Link from "next/link";
import { buttonClasses } from "@/components/atoms/Button";
import { RotatingText } from "@/components/molecules/RotatingText";
import { BrandPanel } from "@/components/organisms/BrandPanel";
import { MainTemplate } from "@/components/templates/MainTemplate";

export default function Home() {
  return (
    <MainTemplate showSignIn>
      {/* Mobile-first: hero centrado; desde lg, texto a la izquierda y panel de marca a la derecha. */}
      <section className="flex flex-1 flex-col items-center justify-center gap-6 text-center lg:grid lg:grid-cols-2 lg:gap-16 lg:text-left">
        <div className="flex flex-col items-center gap-6 lg:items-start">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
            {/* Los lectores de pantalla leen el título completo; la letra que alterna (o/a) es solo visual. */}
            <span className="sr-only">Bienvenido a Libtual</span>
            <span aria-hidden="true">
              <span className="whitespace-nowrap">
                Bienvenid
                <RotatingText phrases={["o", "a"]} intervalMs={5_000} animationMs={300} inline />
              </span>{" "}
              a Libtual
            </span>
          </h1>
          <p className="max-w-md text-lg text-foreground/80 lg:max-w-xl lg:text-xl">
            Libtual es tu librería virtual: guarda los libros que has leído, los que estás leyendo y los que quieres leer.
            Comparte tu opinión y descubre tu próximo favorito en las librerías de otros lectores.
          </p>
          <Link href="/registro" className={buttonClasses()}>
            Comenzar
          </Link>
        </div>
        <BrandPanel
          className="hidden lg:flex"
          decoration={
            // Animación hecha con HyperFrames (design/open-book): un GIF por tema con el color del panel de fondo.
            // Con movimiento reducido se muestra el primer cuadro fijo.
            <picture>
              <source media="(prefers-reduced-motion: reduce) and (prefers-color-scheme: dark)" srcSet="/animations/open-book-dark.png" />
              <source media="(prefers-reduced-motion: reduce)" srcSet="/animations/open-book-light.png" />
              <source media="(prefers-color-scheme: dark)" srcSet="/animations/open-book-dark.gif" />
              <img src="/animations/open-book-light.gif" alt="" width={192} height={112} loading="lazy" className="block h-28 w-48" />
            </picture>
          }
          title="¡Empieza a armar tu librería!"
          description="Crea tu cuenta y llena tus estantes con tus libros favoritos."
        />
      </section>
    </MainTemplate>
  );
}
