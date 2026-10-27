import { describe, expect, it } from 'vitest';
import { easeOutCubic, gateTargets, particleAt } from './formation';

describe('silhueta do portão', () => {
  const pts = gateTargets();
  it('fica dentro do selo (raio 118) e não repete pontos', () => {
    expect(pts.length).toBeGreaterThan(100);
    for (const p of pts) {
      expect(Math.hypot(p.x, p.y)).toBeLessThan(118);
    }
    expect(new Set(pts.map((p) => `${p.x},${p.y}`)).size).toBe(pts.length);
  });
});

describe('movimento das partículas', () => {
  it('a curva começa em 0 e chega em 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('antes do atraso fica no início e depois chega ao alvo', () => {
    const start = { x: 0, y: 0 };
    const target = { x: 100, y: 50 };
    expect(particleAt(start, target, 1, 2, 0.5)).toEqual(start);
    const end = particleAt(start, target, 1, 2, 10);
    expect(end.x).toBeCloseTo(100);
    expect(end.y).toBeCloseTo(50);
  });
});
