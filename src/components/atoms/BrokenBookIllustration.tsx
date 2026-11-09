// Libro abierto con la página derecha arrancada, al estilo de lucide-react: solo trazos, grosor único, extremos redondeados.
export function BrokenBookIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Página izquierda y lomo, como en el icono book-open. */}
      <path d="M12 7a4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3" />
      <path d="M12 7v14" />
      {/* Lo que queda de la página derecha, con el borde roto en zigzag. */}
      <path d="M12 7a4 4 0 0 1 4-4h2l-1.5 3 2 3-2 3 2 3-1.5 3h-2a3 3 0 0 0-3 3" />
      {/* El trozo arrancado: mismo zigzag, separado y girado. */}
      <path d="M18 3h3a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-4l1.5-3-2-3 2-3-2-3z" transform="translate(3.5 0.5) rotate(12 19.5 10.5)" />
      {/* Pedacitos de papel sueltos. */}
      <path d="M18.5 20.5l1 1.2" />
      <path d="M21.5 21.5l1.4.4" />
    </svg>
  );
}
