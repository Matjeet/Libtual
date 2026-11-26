# Imágenes de los cuadros

En la página de inicio hay cuatro cuadros colgados en la pared, dos sobre la bolsa y dos sobre la mesa. Cada usuario puede tener una imagen en cada cuadro. Las imágenes disponibles para cada cuadro se guardan en su propio bucket de Supabase Storage.

## Resolución máxima de cada imagen

Cada cuadro tiene un área para la imagen con una proporción fija. La imagen se recorta al centro para llenar esa área, sin deformarse. Por eso conviene que la imagen ya tenga la proporción del cuadro. Si no la tiene, se pierden los bordes que sobran.

La resolución máxima es la que se ve nítida en la pantalla donde el cuadro se dibuja más grande. Para calcularla se usa la densidad de pantalla: 3× en celulares y 2× en tablets y computadores. Una imagen más grande no se ve mejor; solo pesa más.

| Cuadro | Dónde está | Bucket | Proporción (ancho:alto) | Resolución máxima |
|---|---|---|---|---|
| Ovalado | Arriba, sobre la bolsa | `painting-oval` | 77:107 (≈ 0,72) | **300 × 417 px** |
| Vertical dorado | Abajo, sobre la bolsa | `painting-portrait` | 19:29 (≈ 0,66) | **580 × 885 px** |
| Redondo | Arriba, sobre la mesa | `painting-round` | 1:1 | **650 × 650 px** |
| Horizontal de madera | Abajo, sobre la mesa | `painting-landscape` | 11:7 (≈ 1,57) | **330 × 210 px** |

El cuadro redondo y el ovalado recortan la imagen en círculo y en óvalo. Lo importante de la imagen debe quedar en el centro.

### De dónde salen estos números

Se midió el área de la imagen de cada cuadro en anchos de pantalla desde 360 hasta 3840 px. La resolución máxima es la mayor de las dos medidas que siguen:

| Cuadro | Celular (hasta 430 px de ancho, ×3) | Tablet o computador (×2) |
|---|---|---|
| Ovalado | 71 px → 214 px | 147 px (pantallas de 1920 px o más) → 294 px |
| Vertical dorado | 180 px → 539 px | 289 px (tablet de 1024 px en vertical) → 578 px |
| Redondo | 215 px → 645 px | 274 px (tablet de 820 px en vertical) → 547 px |
| Horizontal de madera | 110 px → 329 px | 165 px (tablet de 1024 px en vertical) → 330 px |

Si cambia el tamaño o la forma de los cuadros (`src/components/atoms/PaintingFrame.tsx` y `src/components/organisms/RoomScene.tsx`), hay que volver a medir y actualizar esta tabla.

## Formato de los archivos

- **Formato:** solo WebP. Los buckets rechazan cualquier otro tipo de archivo y la base de datos solo acepta nombres que terminen en `.webp`.
- **Peso:** hasta 2 MB por imagen, que es el límite de los buckets. Con las resoluciones de arriba, un WebP suele pesar menos de 200 KB.
- **Nombre:** cada imagen se guarda en el bucket de su cuadro. El nombre es libre, sin espacios ni tildes; por ejemplo `bosque-otono.webp`.

## Cómo se muestran

Los buckets son públicos. Al cargar la página de inicio, la aplicación lee qué imagen eligió el usuario para cada cuadro, arma su URL pública (`<proyecto>.supabase.co/storage/v1/object/public/<bucket>/<archivo>`) y la dibuja dentro del marco. Un cuadro sin imagen elegida muestra el lienzo vacío.
