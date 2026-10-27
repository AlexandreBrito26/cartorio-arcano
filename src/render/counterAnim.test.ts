import { describe, expect, it } from 'vitest';
import { flameScale, lampAngle, lightningAlpha, stampFrame } from './counterAnim';

describe('lampião', () => {
  it('balança dentro de ±0,06 rad', () => {
    for (let s = 0; s < 20; s += 0.1) expect(Math.abs(lampAngle(s))).toBeLessThanOrEqual(0.06 + 1e-9);
  });
});

describe('chama', () => {
  it('fica entre 0,85 e 1,15', () => {
    for (let s = 0; s < 20; s += 0.05) {
      const k = flameScale(s);
      expect(k).toBeGreaterThanOrEqual(0.85 - 1e-9);
      expect(k).toBeLessThanOrEqual(1.15 + 1e-9);
    }
  });
});

describe('carimbo', () => {
  it('começa com impacto no instante da decisão e volta ao repouso', () => {
    expect(stampFrame(0)).toBe(2);
    expect(stampFrame(150)).toBe(3);
    expect(stampFrame(250)).toBe(1);
    expect(stampFrame(400)).toBe(0);
    expect(stampFrame(null)).toBe(0);
  });
});

describe('relâmpago', () => {
  it('não acontece antes dos 4 s e pisca a cada 11 s', () => {
    expect(lightningAlpha(3)).toBe(0);
    expect(lightningAlpha(4.05)).toBeGreaterThan(0);
    expect(lightningAlpha(15.05)).toBeGreaterThan(0);
    expect(lightningAlpha(8)).toBe(0);
  });
});
