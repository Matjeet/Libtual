import {
  Abril_Fatface,
  Caveat,
  Cinzel,
  Cormorant_Garamond,
  Courier_Prime,
  Creepster,
  Crimson_Pro,
  Dancing_Script,
  EB_Garamond,
  Great_Vibes,
  IM_Fell_English,
  Indie_Flower,
  Josefin_Sans,
  Libre_Baskerville,
  Lobster,
  Lora,
  Merriweather,
  Montserrat,
  Nunito,
  Orbitron,
  Pacifico,
  Playfair_Display,
  Quicksand,
  Raleway,
  Satisfy,
  Spectral,
  Special_Elite,
  Uncial_Antiqua,
  UnifrakturMaguntia,
} from "next/font/google";

// Fuentes que se pueden elegir para el título y la descripción de un libro.
// next/font exige las opciones escritas en cada llamada. preload: false: el navegador solo descarga las que se usan en pantalla.
const lora = Lora({ subsets: ["latin"], display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false });
const merriweather = Merriweather({ subsets: ["latin"], display: "swap", preload: false });
const ebGaramond = EB_Garamond({ subsets: ["latin"], display: "swap", preload: false });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], display: "swap", preload: false });
const crimsonPro = Crimson_Pro({ subsets: ["latin"], display: "swap", preload: false });
const spectral = Spectral({ weight: ["400", "700"], subsets: ["latin"], display: "swap", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false });
const raleway = Raleway({ subsets: ["latin"], display: "swap", preload: false });
const nunito = Nunito({ subsets: ["latin"], display: "swap", preload: false });
const josefinSans = Josefin_Sans({ subsets: ["latin"], display: "swap", preload: false });
const quicksand = Quicksand({ subsets: ["latin"], display: "swap", preload: false });
const caveat = Caveat({ subsets: ["latin"], display: "swap", preload: false });
const dancingScript = Dancing_Script({ subsets: ["latin"], display: "swap", preload: false });
const greatVibes = Great_Vibes({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const pacifico = Pacifico({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const satisfy = Satisfy({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const indieFlower = Indie_Flower({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const specialElite = Special_Elite({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], display: "swap", preload: false });
const cinzel = Cinzel({ subsets: ["latin"], display: "swap", preload: false });
const imFellEnglish = IM_Fell_English({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const uncialAntiqua = Uncial_Antiqua({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const unifraktur = UnifrakturMaguntia({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const abrilFatface = Abril_Fatface({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const lobster = Lobster({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const creepster = Creepster({ weight: "400", subsets: ["latin"], display: "swap", preload: false });
const orbitron = Orbitron({ subsets: ["latin"], display: "swap", preload: false });

// Grupos de las listas desplegables, en este orden.
export const FONT_GROUPS = ["Clásicas", "Modernas", "Manuscritas", "Máquina de escribir", "Antiguas", "Decorativas"] as const;

type FontGroup = (typeof FONT_GROUPS)[number];
type BookFontOption = { value: string; label: string; group: FontGroup; family: string; titleOnly?: boolean };

// value es lo que se guarda en la base de datos (title_font y description_font).
// titleOnly: se ve bien en un título pero cuesta leerla en un texto largo; no se ofrece para la descripción.
export const BOOK_FONTS = [
  { value: "lora", label: "Lora", group: "Clásicas", family: lora.style.fontFamily },
  { value: "playfair", label: "Playfair Display", group: "Clásicas", family: playfair.style.fontFamily },
  { value: "merriweather", label: "Merriweather", group: "Clásicas", family: merriweather.style.fontFamily },
  { value: "eb-garamond", label: "EB Garamond", group: "Clásicas", family: ebGaramond.style.fontFamily },
  { value: "libre-baskerville", label: "Libre Baskerville", group: "Clásicas", family: libreBaskerville.style.fontFamily },
  { value: "cormorant-garamond", label: "Cormorant Garamond", group: "Clásicas", family: cormorant.style.fontFamily },
  { value: "crimson-pro", label: "Crimson Pro", group: "Clásicas", family: crimsonPro.style.fontFamily },
  { value: "spectral", label: "Spectral", group: "Clásicas", family: spectral.style.fontFamily },
  { value: "geist", label: "Geist", group: "Modernas", family: "var(--font-geist-sans)" },
  { value: "montserrat", label: "Montserrat", group: "Modernas", family: montserrat.style.fontFamily },
  { value: "raleway", label: "Raleway", group: "Modernas", family: raleway.style.fontFamily },
  { value: "nunito", label: "Nunito", group: "Modernas", family: nunito.style.fontFamily },
  { value: "josefin-sans", label: "Josefin Sans", group: "Modernas", family: josefinSans.style.fontFamily },
  { value: "quicksand", label: "Quicksand", group: "Modernas", family: quicksand.style.fontFamily },
  { value: "caveat", label: "Caveat", group: "Manuscritas", family: caveat.style.fontFamily },
  { value: "dancing-script", label: "Dancing Script", group: "Manuscritas", family: dancingScript.style.fontFamily },
  { value: "great-vibes", label: "Great Vibes", group: "Manuscritas", family: greatVibes.style.fontFamily, titleOnly: true },
  { value: "pacifico", label: "Pacifico", group: "Manuscritas", family: pacifico.style.fontFamily },
  { value: "satisfy", label: "Satisfy", group: "Manuscritas", family: satisfy.style.fontFamily },
  { value: "indie-flower", label: "Indie Flower", group: "Manuscritas", family: indieFlower.style.fontFamily },
  { value: "special-elite", label: "Special Elite", group: "Máquina de escribir", family: specialElite.style.fontFamily },
  { value: "courier-prime", label: "Courier Prime", group: "Máquina de escribir", family: courierPrime.style.fontFamily },
  { value: "cinzel", label: "Cinzel", group: "Antiguas", family: cinzel.style.fontFamily },
  { value: "im-fell-english", label: "IM Fell English", group: "Antiguas", family: imFellEnglish.style.fontFamily },
  { value: "uncial-antiqua", label: "Uncial Antiqua", group: "Antiguas", family: uncialAntiqua.style.fontFamily, titleOnly: true },
  { value: "unifraktur-maguntia", label: "UnifrakturMaguntia", group: "Antiguas", family: unifraktur.style.fontFamily, titleOnly: true },
  { value: "abril-fatface", label: "Abril Fatface", group: "Decorativas", family: abrilFatface.style.fontFamily },
  { value: "lobster", label: "Lobster", group: "Decorativas", family: lobster.style.fontFamily },
  { value: "creepster", label: "Creepster", group: "Decorativas", family: creepster.style.fontFamily, titleOnly: true },
  { value: "orbitron", label: "Orbitron", group: "Decorativas", family: orbitron.style.fontFamily, titleOnly: true },
] as const satisfies readonly BookFontOption[];

export type BookFont = (typeof BOOK_FONTS)[number]["value"];

export const fontFamily = (font: BookFont) => BOOK_FONTS.find(({ value }) => value === font)!.family;
