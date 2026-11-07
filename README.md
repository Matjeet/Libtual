# Libtual

Aplicación web construida con Next.js (App Router), React, TypeScript y Tailwind CSS.

## Requisitos

- Node.js 26 o superior

## Scripts

```bash
npm install     # instalar dependencias
npm run dev     # servidor de desarrollo en http://localhost:3000
npm run build   # build de producción
npm run start   # servir el build
npm run lint    # ESLint
```

## Estructura (Atomic Design)

```
src/
├── app/                 # rutas (pages) de Next.js
└── components/
    ├── atoms/           # elementos básicos: Button, Logo...
    ├── molecules/       # combinaciones de átomos
    ├── organisms/       # secciones completas: Header...
    └── templates/       # layouts de página
```

## Flujo de trabajo

- Ramas con **Gitflow**: `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`.
- Commits con **Conventional Commits**, un commit por componente completo.
