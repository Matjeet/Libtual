import { useEffect, type RefObject } from "react";

// Para carruseles que pasan de panel con un deslizamiento horizontal manejado con pointer events (con touch-action: pan-y).
// Chrome (Android y el modo responsive) toma igual ese deslizamiento como el inicio de un desplazamiento con inercia que nunca
// ocurre, y usa el toque siguiente solo para "detenerlo": ese toque no genera clic y el usuario tiene que tocar dos veces.
// Cancelar los touchmove de un gesto horizontal evita que el navegador lo empiece; los pointer events siguen llegando.
// Los gestos verticales (scroll) y los que empiezan en un campo o una barra de color no se tocan.
// React registra onTouchMove como pasivo (no se puede cancelar), por eso se escucha directo en el elemento.
export function useHorizontalSwipe(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let start: { x: number; y: number } | null = null;
    let horizontal: boolean | null = null;

    const onStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      const inField = event.target instanceof Element && event.target.closest("input, textarea, select");
      start = event.touches.length === 1 && !inField ? { x: touch.clientX, y: touch.clientY } : null;
      horizontal = null;
    };
    const onMove = (event: TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      // La dirección se decide con el primer movimiento y vale para todo el gesto.
      if (horizontal === null && (dx || dy)) horizontal = Math.abs(dx) > Math.abs(dy);
      if (horizontal && event.cancelable) event.preventDefault();
    };

    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: false });
    return () => {
      element.removeEventListener("touchstart", onStart);
      element.removeEventListener("touchmove", onMove);
    };
  }, [ref]);
}
