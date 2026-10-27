import type { Application } from 'pixi.js';

/** Movimento reduzido: lido num único lugar, para todas as cenas e partículas. */
export const reduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Aparelho fraco: poucos núcleos ou pouca memória (quando o navegador informa). */
export function isLowEnd(nav: { hardwareConcurrency?: number; deviceMemory?: number } | undefined = typeof navigator === 'undefined' ? undefined : navigator) {
  if (!nav) return false;
  const cores = nav.hardwareConcurrency;
  const mem = nav.deviceMemory;
  return (cores !== undefined && cores <= 4) || (mem !== undefined && mem <= 2);
}

/** Limite de quadros por segundo: 30 em aparelho fraco, 60 nos demais. */
export const fpsCap = (lowEnd = isLowEnd()) => (lowEnd ? 30 : 60);

/**
 * Regras de ticker compartilhadas por todo Application do jogo:
 * limite de FPS e pausa quando a aba fica em segundo plano.
 * Devolve a função que desfaz o que foi ligado.
 */
export function bindTickerPolicy(app: Application): () => void {
  app.ticker.maxFPS = fpsCap();
  const onVisibility = () => {
    if (document.hidden) app.ticker.stop();
    else app.ticker.start();
  };
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();
  return () => document.removeEventListener('visibilitychange', onVisibility);
}
