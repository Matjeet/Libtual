import { Caveat, Cinzel, Lora, Playfair_Display, Special_Elite } from "next/font/google";

// Fuentes que se pueden elegir para el título y la descripción de un libro.
// preload: false: el navegador solo descarga las que se usan en pantalla.
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false });
const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false });
const specialElite = Special_Elite({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const cinzel = Cinzel({ subsets: ["latin"], display: "swap", preload: false });

// value es lo que se guarda en la base de datos (title_font y description_font).
export const BOOK_FONTS = [
  { value: "lora", label: "Clásica", family: lora.style.fontFamily },
  { value: "playfair", label: "Elegante", family: playfair.style.fontFamily },
  { value: "caveat", label: "Manuscrita", family: caveat.style.fontFamily },
  { value: "special-elite", label: "Máquina de escribir", family: specialElite.style.fontFamily },
  { value: "cinzel", label: "Antigua", family: cinzel.style.fontFamily },
  { value: "geist", label: "Moderna", family: "var(--font-geist-sans)" },
] as const;

export type BookFont = (typeof BOOK_FONTS)[number]["value"];

export const fontFamily = (font: BookFont) => BOOK_FONTS.find(({ value }) => value === font)!.family;
