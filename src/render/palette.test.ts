import { describe, expect, it } from 'vitest';
import { PALETTE, paletteInt } from './palette';

describe('paleta do jogo', () => {
  it('tem entre 32 e 48 cores, sem ids repetidos e em hex válido', () => {
    expect(PALETTE.length).toBeGreaterThanOrEqual(32);
    expect(PALETTE.length).toBeLessThanOrEqual(48);
    expect(new Set(PALETTE.map((c) => c.id)).size).toBe(PALETTE.length);
    for (const c of PALETTE) expect(c.hex).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('converte id em número do Pixi', () => {
    expect(paletteInt('ouro-2')).toBe(0xe0b44c);
    expect(() => paletteInt('cor-inexistente')).toThrow();
  });
});
