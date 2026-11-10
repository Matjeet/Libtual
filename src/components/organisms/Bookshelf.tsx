// shortcut: cantidad fija de pisos vacíos; cuando haya libros, los pisos saldrán de los libros del usuario.
const SHELVES = 6;

// Estantería sin fondo: el marco (lados y tablón de arriba) queda fijo y los pisos hacen scroll por dentro.
// Cada piso es un hueco transparente (deja ver el fondo de la página) sobre un tablón con su canto más oscuro.
export function Bookshelf() {
  return (
    <section
      aria-labelledby="bookshelf-title"
      // Con teclado se puede enfocar para hacer scroll con las flechas; el contorno va hacia adentro porque toca el borde de abajo.
      tabIndex={0}
      className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-t-xl border-x-[14px] border-t-[14px] border-wood -outline-offset-4 [scrollbar-color:var(--color-wood-edge)_transparent] [scrollbar-width:thin]"
    >
      <h1 id="bookshelf-title" className="sr-only">
        Tu estantería
      </h1>
      {Array.from({ length: SHELVES }, (_, i) => (
        <div key={i} data-testid="shelf" className="shrink-0">
          <div className="h-40" />
          <div className="h-3.5 border-b-4 border-wood-edge bg-wood" />
        </div>
      ))}
    </section>
  );
}
