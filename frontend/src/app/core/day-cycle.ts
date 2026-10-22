import { DOCUMENT, Injectable, computed, inject, signal } from '@angular/core';

export type DayPhase = 'sunrise' | 'morning' | 'noon' | 'afternoon' | 'sunset' | 'night';

// Limite superior de progreso para cada fase, en orden.
const PHASE_LIMITS: [DayPhase, number][] = [
  ['sunrise', 0.15],
  ['morning', 0.35],
  ['noon', 0.55],
  ['afternoon', 0.75],
  ['sunset', 0.92],
];

/** Devuelve la fase del dia para un progreso de scroll entre 0 y 1. */
export function phaseFor(progress: number): DayPhase {
  const match = PHASE_LIMITS.find(([, limit]) => progress < limit);
  return match ? match[0] : 'night';
}

/**
 * Calcula cuanto ha avanzado un elemento respecto del centro de la pantalla.
 * Devuelve 0 si aun no llega al centro y 1 si ya lo paso completo.
 */
export function sectionProgress(top: number, height: number, viewportHeight: number): number {
  if (height <= 0) {
    return 0;
  }
  const progress = (viewportHeight / 2 - top) / height;
  return Math.min(1, Math.max(0, progress));
}

/** Ejecuta el callback como maximo una vez por cuadro al hacer scroll o cambiar el tamano. */
export function listenToScroll(win: Window, callback: () => void): () => void {
  let pending = false;
  const onChange = () => {
    if (pending) {
      return;
    }
    pending = true;
    win.requestAnimationFrame(() => {
      pending = false;
      callback();
    });
  };
  win.addEventListener('scroll', onChange, { passive: true });
  win.addEventListener('resize', onChange, { passive: true });
  callback();
  return () => {
    win.removeEventListener('scroll', onChange);
    win.removeEventListener('resize', onChange);
  };
}

/** Traduce el scroll de la pagina a una fase del dia y la expone como data-phase en <html>. */
@Injectable({ providedIn: 'root' })
export class DayCycle {
  private readonly document = inject(DOCUMENT);

  readonly progress = signal(0);
  readonly phase = computed(() => phaseFor(this.progress()));

  /** Debe llamarse solo en el navegador, por ejemplo desde afterNextRender. */
  start(): void {
    const win = this.document.defaultView;
    const root = this.document.documentElement;
    if (!win) {
      return;
    }
    listenToScroll(win, () => {
      const max = root.scrollHeight - win.innerHeight;
      this.progress.set(max > 0 ? win.scrollY / max : 0);
      root.dataset['phase'] = this.phase();
    });
  }
}
