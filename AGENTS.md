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
