// Alto estándar de cada piso (hueco + tablón). La estantería mide un número entero de pisos más el tablón de arriba
// (1.25rem = 20px, con su canto incluido): se ven solo pisos completos y el espacio que sobra queda arriba, sobre la estantería.
// round(down, …) calcula cuántos caben en el alto disponible; max() asegura al menos un piso en pantallas muy bajas.
const FRAME_HEIGHT = "h-[calc(max(10.5rem,round(down,100%-1.25rem,10.5rem))+1.25rem)]";

// shortcut: pisos vacíos de sobra (más de los que caben en 2560×1440) y sin scroll porque aún no hay libros.
// Cuando los haya, se agregará un piso cada vez que el último se llene y el scroll se habilitará solo entonces.
const SHELVES = 10;

export function Bookshelf() {
  return (
    // El hueco libre de arriba lo deja justify-end: la estantería queda apoyada en el borde de abajo.
    <div className="flex min-h-0 flex-1 flex-col justify-end">
      <div className={`flex shrink-0 flex-col ${FRAME_HEIGHT}`}>
        <div className="wood-grain-x h-5 shrink-0 rounded-t-lg border-b-[5px] border-wood-edge" />
        <div className="flex min-h-0 flex-1">
          {/* El canto interior más oscuro da profundidad al hueco. */}
          <div className="wood-grain-y w-5 shrink-0 shadow-[inset_-4px_0_0_var(--color-wood-edge)]" />
          <section aria-labelledby="bookshelf-title" className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
          </section>
          <div className="wood-grain-y w-5 shrink-0 shadow-[inset_4px_0_0_var(--color-wood-edge)]" />
        </div>
      </div>
    </div>
  );
}
