<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas del proyecto Libtual

## Estados de carga: skeleton por defecto

- Toda página que cargue contenido debe mostrar un **skeleton** con la forma de ese contenido mientras carga: el fallback de cada `<Suspense>` y cualquier `loading.tsx`.
- No uses spinners, textos tipo "Cargando..." ni `fallback={null}` como estado de carga de una página. Los indicadores de "loading" (spinner o texto) solo se usan en los casos que se especifiquen explícitamente.
- El skeleton se construye con el átomo `src/components/atoms/Skeleton.tsx` y replica las medidas del contenido real para que el layout no salte al terminar de cargar.
- Si el skeleton es de un organismo, va en `src/components/organisms/<Nombre>Skeleton.tsx` (ver `RegisterFormSkeleton`).
- Accesibilidad: el contenedor del skeleton lleva `role="status"`, `aria-busy="true"` y un texto `sr-only` que describa qué se está cargando.

## Responsive: mobile-first

- Los estilos se escriben **mobile-first**: las clases sin prefijo son para el celular más pequeño (320 px de ancho) y los prefijos de Tailwind (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`) agregan o ajustan estilos a medida que la pantalla crece. No se escriben estilos pensados para escritorio que luego se "arreglan" para celular con `max-*:`.
- Rango que debe funcionar: desde 320 px hasta pantallas de 1920 px o más.
  - Nada se superpone ni se sale de la pantalla, y no aparece scroll horizontal.
  - Ningún botón ni control queda oculto, recortado o inalcanzable en pantallas pequeñas; las áreas táctiles miden al menos 44 × 44 px.
  - En pantallas grandes, los elementos que el diseño ubica **junto al borde de la pantalla** (el logo y las acciones del header, la navegación, barras o botones fijos a un lado) se mantienen cerca de ese borde. No se encierran en un contenedor con un `max-w-*` que los aleje: su contenedor de ancho completo usa un padding lateral que crece con la pantalla. Como guía, desde 1024 px no quedan a más del 8 % del ancho de la pantalla de su borde (unos 150 px en 1920).
  - El contenido de la página (títulos, textos, formularios, paneles) vive en un contenedor centrado con ancho máximo (`MainTemplate`, `max-w-6xl`) y puede quedar centrado con espacio a los lados en pantallas grandes. **No se agrega contenido solo para llenar espacio.**
- Los inputs usan al menos 16 px de tamaño de letra, para que iOS no haga zoom al enfocarlos.
- Los elementos flotantes (listas desplegables, calendarios, menús) deben caber en la pantalla en todos los anchos.

## Revisión de responsive con el agente `responsive-reviewer`

- Cada vez que se modifiquen estilos de una página o de un componente que use una página, **especialmente de posición o tamaño** (márgenes, paddings, anchos, altos, flex/grid, posicionamiento, tamaños de letra), se ejecuta el agente `.claude/agents/responsive-reviewer.md`.
- El agente solo revisa y reporta; no modifica archivos. Quien hizo el cambio corrige lo reportado y vuelve a pedir la revisión al mismo agente.
- El ciclo se repite hasta que el agente responda **APROBADO**. Sin esa aprobación, el cambio de estilos no se da por terminado.
