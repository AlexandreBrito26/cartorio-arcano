import { BASES, type SceneBase } from './bases';
import { centerOffset, integerScale } from './scale';

export const PORTRAIT_W = 64;
export const PORTRAIT_H = 72;

/** Caixa do viajante no palco: 55% da altura, base a 23% do fundo, centrada (era o CSS de .st-traveler). */
export function travelerBox(stageW: number, stageH: number) {
  const h = stageH * 0.55;
  const w = (h * PORTRAIT_W) / PORTRAIT_H;
  return { w, h, anchorX: stageW / 2, anchorY: stageH * (1 - 0.23) };
}

/** Escala inteira e deslocamento do retrato dentro da caixa. */
export function portraitFit(boxW: number, boxH: number) {
  const scale = integerScale(boxW, boxH, PORTRAIT_W, PORTRAIT_H);
  return { scale, ...centerOffset(boxW, boxH, PORTRAIT_W, PORTRAIT_H, scale) };
}

/** Entrada do viajante (era a animação CSS `emerge`): 0 → 1 em 1,1 s com saída suave. */
export const EMERGE_MS = 1100;
export function emerge(ms: number) {
  const p = Math.min(1, Math.max(0, ms / EMERGE_MS));
  const e = 1 - Math.pow(1 - p, 3);
  return {
    alpha: e,
    dy: (1 - e) * 18,
    scale: 0.94 + 0.06 * e,
    brightness: 0.5 + 0.32 * e, // até o 0,82 do filtro base
    done: p >= 1,
  };
}

/**
 * Resolução interna fixa do balcão (Fase 10). O canvas tem `lw`×`lh` pixels lógicos e o CSS o
 * amplia `p` vezes (inteiro, `image-rendering: pixelated`). Um pixel lógico é um pixel do viajante;
 * a cena é desenhada nele com escala inteira `m`. Assim nada cai entre pixels, em nenhuma escala.
 *
 * `p` é a escala inteira que o viajante já tinha (caixa de 55% da altura ÷ 72); `m` é o menor
 * inteiro que cobre o palco, como era a escala da cena. Pixel da cena na tela: `p × m` px de CSS.
 */
export function fitCounter(cssW: number, cssH: number, base: SceneBase = BASES.wide) {
  if (cssW <= 0 || cssH <= 0) return { p: 1, m: 1, lw: 1, lh: 1 };
  const p = Math.max(1, Math.floor((cssH * 0.55) / PORTRAIT_H));
  const m = Math.max(1, Math.ceil(Math.max(cssW / (base.width * p), cssH / (base.height * p))));
  return { p, m, lw: Math.ceil(cssW / p), lh: Math.ceil(cssH / p) };
}

/**
 * Mesma ideia para a abertura: a arte (artW×artH) cabe inteira no quadro (como o `min()` de antes),
 * mas é desenhada num canvas lógico `p` vezes menor, com `p` inteiro. A escala da arte dentro
 * do canvas lógico (`artScale`) é o resto fracionário, que não depende mais da densidade da tela.
 */
export function fitCutscene(cssW: number, cssH: number, artW: number, artH: number) {
  if (cssW <= 0 || cssH <= 0) return { p: 1, lw: 1, lh: 1, artScale: 1 };
  const s = Math.min(cssW / artW, cssH / artH);
  const p = Math.max(1, Math.round(s));
  return { p, lw: Math.ceil(cssW / p), lh: Math.ceil(cssH / p), artScale: s / p };
}
