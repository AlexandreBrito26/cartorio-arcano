/**
 * Bases de arte do balcão (Fase 10). A escolha é feita pela janela, não pelo palco,
 * porque a própria altura do palco depende da base (ver ART.md, seção 10).
 */
export type BaseId = 'wide' | 'tall';

export interface SceneBase {
  id: BaseId;
  /** Largura e altura da arte, em pixels de arte (não de tela). */
  width: number;
  height: number;
}

export const BASES: Record<BaseId, SceneBase> = {
  /** Faixa larga: desktop, tablet e celular deitado. É o balcão original. */
  wide: { id: 'wide', width: 320, height: 80 },
  /** Retrato: celular em pé, com o viajante em destaque. Valor de partida, a ajustar no 10.3. */
  tall: { id: 'tall', width: 180, height: 240 },
};

/** Janela estreita: até esta largura (mesmo corte do layout de celular no CSS)... */
export const NARROW_MAX_WIDTH = 720;
/** ...e mais alta que larga por pelo menos esta razão (altura ÷ largura). */
export const NARROW_MIN_RATIO = 1.1;

/** Base em retrato só para telas estreitas e em pé; todo o resto usa a faixa larga. */
export function pickBase(viewW: number, viewH: number): SceneBase {
  if (viewW <= 0 || viewH <= 0) return BASES.wide;
  const narrow = viewW <= NARROW_MAX_WIDTH && viewH / viewW >= NARROW_MIN_RATIO;
  return narrow ? BASES.tall : BASES.wide;
}
