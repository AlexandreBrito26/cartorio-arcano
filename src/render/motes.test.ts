import { describe, expect, it } from 'vitest';
import { createMotes, stepMotes } from './motes';

const seeded = () => {
  let s = 7;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
};

describe('motes', () => {
  it('cria a quantidade pedida dentro da área', () => {
    const m = createMotes('embers', 30, 200, 100, seeded());
    expect(m).toHaveLength(30);
    expect(m.every((p) => p.x >= 0 && p.x <= 200 && p.y >= 0 && p.y <= 100)).toBe(true);
  });

  it('a chuva cai e dá a volta ao passar do fundo', () => {
    const m = createMotes('rain', 40, 200, 100, seeded());
    for (let i = 0; i < 300; i++) stepMotes(m, 'rain', 1, 200, 100);
    expect(m.every((p) => p.y >= -10 && p.y <= 140 && p.x >= -40 && p.x <= 240)).toBe(true);
  });

  it('brasas sobem e a opacidade oscila sem passar da base', () => {
    const m = createMotes('embers', 10, 200, 100, seeded());
    const y0 = m.map((p) => p.y);
    stepMotes(m, 'embers', 1, 200, 100);
    expect(m.every((p, i) => p.y < y0[i] || p.y > 100)).toBe(true);
    expect(m.every((p) => p.alpha <= p.base + 1e-9)).toBe(true);
  });
});
