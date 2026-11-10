// shortcut: siempre 3 pisos vacíos; cuando haya libros, se agregará un piso nuevo cada vez que el último se llene.
const SHELVES = 3;

// Estantería: el tablón de arriba y los lados quedan fijos; los pisos hacen scroll por dentro.
// Cada piso ocupa un tercio del alto visible, así al inicio se ven exactamente 3 y solo hay scroll cuando hay más.
export function Bookshelf() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="wood-grain-x h-5 shrink-0 rounded-t-lg border-b-[5px] border-wood-edge" />
      <div className="flex min-h-0 flex-1">
        {/* El canto interior más oscuro da profundidad al hueco. */}
        <div className="wood-grain-y w-5 shrink-0 shadow-[inset_-4px_0_0_var(--color-wood-edge)]" />
        <section
          aria-labelledby="bookshelf-title"
          // Con teclado se puede enfocar para hacer scroll con las flechas; el contorno va hacia adentro porque toca el borde de abajo.
          tabIndex={0}
          // Scroll sin barra visible (pedido de diseño); sigue funcionando con rueda, toque y teclado.
          className="flex min-h-0 flex-1 flex-col overflow-y-auto -outline-offset-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <h1 id="bookshelf-title" className="sr-only">
            Tu estantería
          </h1>
          {Array.from({ length: SHELVES }, (_, i) => (
            // min-h-28: en pantallas muy bajas el piso no se aplasta (ahí sí habrá scroll).
            <div key={i} data-testid="shelf" className="flex min-h-28 shrink-0 basis-1/3 flex-col">
              {/* Fondo oscuro del hueco, con la sombra que deja el tablón de arriba. */}
              <div className="flex-1 bg-wood-back shadow-[inset_0_10px_12px_-8px_rgb(0_0_0/0.7)]" />
              <div className="wood-grain-x h-5 border-b-[5px] border-wood-edge shadow-[0_6px_8px_-6px_rgb(0_0_0/0.45)]" />
            </div>
          ))}
        </section>
        <div className="wood-grain-y w-5 shrink-0 shadow-[inset_4px_0_0_var(--color-wood-edge)]" />
      </div>
    </div>
  );
}
