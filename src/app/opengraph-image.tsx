import { ImageResponse } from "next/og";

// Imagen al compartir el enlace (Open Graph y X), para todas las páginas: el nombre y la frase de Libtual sobre el color
// de la habitación, y un tablón de madera con lomos de libros de colores, como la estantería de la app.
export const alt = "Libtual: tu librería virtual de libros leídos y por leer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SPINES = [
  { color: "#2f7a96", width: 56, height: 230 },
  { color: "#a23b4c", width: 40, height: 250 },
  { color: "#3f7a3a", width: 70, height: 230 },
  { color: "#c9822e", width: 34, height: 190 },
  { color: "#5b3f8f", width: 56, height: 250 },
  { color: "#8a5a2b", width: 44, height: 230 },
  { color: "#2f7a96", width: 30, height: 190 },
  { color: "#a23b4c", width: 62, height: 250 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#8fc0a9", padding: "70px 80px 0" }}>
      <div style={{ display: "flex", fontSize: 110, fontWeight: 700, color: "#2b2b33" }}>Libtual</div>
      <div style={{ display: "flex", fontSize: 44, color: "#2b2b33", marginTop: 8 }}>Tu librería virtual de libros leídos y por leer</div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, paddingLeft: 40 }}>
          {SPINES.map((spine, i) => (
            <div
              key={i}
              style={{ display: "flex", width: spine.width, height: spine.height, background: spine.color, borderRadius: 8, border: "3px solid rgba(0,0,0,0.3)" }}
            />
          ))}
        </div>
        <div style={{ display: "flex", height: 40, background: "#5a3820", borderTop: "8px solid #3a2414" }} />
      </div>
    </div>,
    size,
  );
}
