import { BookSpine } from "@/components/atoms/BookSpine";
import type { ShelfBook } from "@/lib/books";

// Alto estándar de cada piso (hueco + tablón). La estantería mide un número entero de pisos más el tablón de arriba
// (1.25rem = 20px, con su canto incluido): se ven solo pisos completos y el espacio que sobra queda arriba, sobre la estantería.
// round(down, …) calcula cuántos caben en el alto disponible; max() asegura al menos un piso en pantallas muy bajas.
const FRAME_HEIGHT = "h-[calc(max(10.5rem,round(down,100%-1.25rem,10.5rem))+1.25rem)]";

// shortcut: pisos fijos de sobra (más de los que caben en 2560×1440) y sin scroll: los libros que no quepan en los pisos
// visibles quedan ocultos. Agregar un piso cuando el último se llene y habilitar el scroll solo entonces.
const SHELVES = 10;

// books: los libros del usuario, en el orden en que los agregó. Se acomodan de izquierda a derecha, piso por piso.
export function Bookshelf({ books = [] }: { books?: ShelfBook[] }) {
  return (
    // El hueco libre de arriba lo deja justify-end: la estantería queda apoyada en el borde de abajo.
    <div className="flex min-h-0 flex-1 flex-col justify-end">
      <div className={`flex shrink-0 flex-col ${FRAME_HEIGHT}`}>
        <div className="wood-grain-x h-5 shrink-0 rounded-t-lg border-b-[5px] border-wood-edge" />
        <div className="flex min-h-0 flex-1">
          {/* El canto interior más oscuro da profundidad al hueco. */}
          <div className="wood-grain-y w-5 shrink-0 shadow-[inset_-4px_0_0_var(--color-wood-edge)]" />
          <section aria-labelledby="bookshelf-title" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <h1 id="bookshelf-title" className="sr-only">
              Tu estantería
            </h1>
            {Array.from({ length: SHELVES }, (_, i) => (
              <div key={i} data-testid="shelf" className="flex h-[10.5rem] shrink-0 flex-col">
                {/* Fondo oscuro del hueco, con la sombra que deja el tablón de arriba. */}
                <div className="flex-1 bg-wood-back shadow-[inset_0_10px_12px_-8px_rgb(0_0_0/0.7)]" />
                <div className="wood-grain-x h-5 border-b-[5px] border-wood-edge shadow-[0_6px_8px_-6px_rgb(0_0_0/0.45)]" />
              </div>
            ))}
            {/* Cada libro ocupa el alto de un piso (pb-5 = el tablón): al llenarse un piso, el siguiente libro baja al de abajo
                y queda parado sobre su tablón. data-book-id: la creación de un libro busca ahí el lugar del libro nuevo. */}
            {books.length > 0 && (
              <ul aria-label="Libros" className="absolute inset-0 flex flex-wrap content-start gap-x-0.5 px-1.5">
                {books.map((book) => (
                  <li key={book.id} data-book-id={book.id} className="flex h-[10.5rem] items-end pb-5">
                    <BookSpine
                      title={book.title}
                      category={book.category}
                      coverColor={book.coverColor}
                      fontColor={book.fontColor}
                      titleFont={book.titleFont}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="wood-grain-y w-5 shrink-0 shadow-[inset_4px_0_0_var(--color-wood-edge)]" />
        </div>
      </div>
    </div>
  );
}
