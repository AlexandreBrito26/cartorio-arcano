/**
 * Escala inteira para pixel art: o maior fator inteiro (≥1) que cabe no espaço disponível.
 * Fator inteiro evita pixels de tamanhos desiguais; fração faria o pixel tremer.
 */
export function integerScale(viewW: number, viewH: number, baseW: number, baseH: number): number {
  if (viewW <= 0 || viewH <= 0 || baseW <= 0 || baseH <= 0) return 1;
  const fit = Math.min(viewW / baseW, viewH / baseH);
  return Math.max(1, Math.floor(fit));
}

/** Posição (em pixels de tela) que centraliza a cena base já escalada. */
export function centerOffset(viewW: number, viewH: number, baseW: number, baseH: number, scale: number) {
  return {
    x: Math.round((viewW - baseW * scale) / 2),
    y: Math.round((viewH - baseH * scale) / 2),
  };
}
