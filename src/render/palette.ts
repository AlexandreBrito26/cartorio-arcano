import paletteData from './palette.json';

export interface PaletteColor {
  id: string;
  hex: string;
  role: string;
}

/** Paleta fixa do jogo (fonte: palette.json). Código e arte usam os mesmos valores. */
export const PALETTE: readonly PaletteColor[] = paletteData.colors;

/** Cor como número para o Pixi (ex.: 0xe0b44c). */
export function paletteInt(id: string): number {
  const c = PALETTE.find((p) => p.id === id);
  if (!c) throw new Error(`Cor "${id}" não existe em palette.json`);
  return parseInt(c.hex.slice(1), 16);
}
