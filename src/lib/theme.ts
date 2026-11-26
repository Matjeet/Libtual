// Modo de color elegido por el usuario. "system" (por defecto) sigue al sistema operativo; claro y oscuro lo fijan.
// Se guarda en este navegador (localStorage) y se aplica como data-theme en <html>; globals.css lo lee.
export type Theme = "system" | "light" | "dark";

const KEY = "theme";

// Corre en <head> antes de pintar (ver RootLayout): sin esto, al recargar se vería un instante el modo del sistema.
export const THEME_SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export function currentTheme(): Theme {
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  // Sin acceso al almacenamiento (modo privado estricto), el cambio vale hasta recargar.
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {}
}
