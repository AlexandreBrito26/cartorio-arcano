import { describe, expect, it } from 'vitest';
import { BLINK_PERIOD_MS, frameIndex, isBlinking, NOD_Y, SHAKE_X } from './characterAnim';
import { SPECIES_SLUG } from './characterAnim';
import { SPECIES } from '../game/constants';

describe('frameIndex', () => {
  it('faz loop e para no último quadro quando não é loop', () => {
    expect(frameIndex(0, 4, 4, true)).toBe(0);
    expect(frameIndex(250, 4, 4, true)).toBe(1);
    expect(frameIndex(1250, 4, 4, true)).toBe(1); // 5 quadros → 5 mod 4 = 1
    expect(frameIndex(10_000, 10, 5, false)).toBe(4);
  });
});

describe('sequências de reação', () => {
  it('começam e terminam na posição neutra', () => {
    expect(NOD_Y[0]).toBe(0);
    expect(NOD_Y[NOD_Y.length - 1]).toBe(0);
    expect(SHAKE_X[0]).toBe(0);
    expect(SHAKE_X[SHAKE_X.length - 1]).toBe(0);
  });
});

describe('piscada', () => {
  it('pisca no início de cada período e fica aberta no resto', () => {
    expect(isBlinking(0)).toBe(true);
    expect(isBlinking(1000)).toBe(false);
    expect(isBlinking(BLINK_PERIOD_MS)).toBe(true);
  });
});

describe('espécies', () => {
  it('todas as 9 espécies têm pasta de sprite', () => {
    expect(SPECIES.length).toBe(9);
    for (const s of SPECIES) expect(SPECIES_SLUG[s]).toMatch(/^[a-z]+$/);
  });
});

import { SMOKE_FRAMES, SPLASH_FRAMES } from './characterAnim';

describe('efeitos de Draconato e Tritão', () => {
  it('fumaça e respingo têm 4 quadros dentro da área do retrato (64×72)', () => {
    for (const frames of [SMOKE_FRAMES, SPLASH_FRAMES]) {
      expect(frames.length).toBe(4);
      for (const f of frames) {
        for (const [x, y] of f) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(64);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThan(72);
        }
      }
    }
  });
});
