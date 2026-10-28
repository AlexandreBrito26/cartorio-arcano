import { describe, expect, it } from 'vitest';
import {
  WEATHERS,
  createFlakes,
  shootingProgress,
  shootingStart,
  stepFlakes,
  weatherForDay,
  type FlakeKind,
} from './weather';

const seeded = () => {
  let s = 11;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
};

describe('clima por dia', () => {
  it('o dia 1 é a chuva de sempre e dias seguidos nunca repetem o clima', () => {
    expect(weatherForDay(1).id).toBe('chuva');
    for (let d = 1; d <= 40; d++) expect(weatherForDay(d).id).not.toBe(weatherForDay(d + 1).id);
  });

  it('o ciclo se repete e aguenta dias fora do intervalo', () => {
    expect(weatherForDay(1 + WEATHERS.length)).toBe(weatherForDay(1));
    expect(weatherForDay(0)).toBe(weatherForDay(1));
    expect(weatherForDay(-5)).toBe(weatherForDay(1));
  });

  it('todo clima tem id único, legenda e cinco faixas de céu', () => {
    expect(new Set(WEATHERS.map((w) => w.id)).size).toBe(WEATHERS.length);
    for (const w of WEATHERS) {
      expect(w.label.length).toBeGreaterThan(0);
      expect(w.sky).toHaveLength(5);
      expect(w.mist).toBeGreaterThan(0);
    }
  });
});

describe('partículas', () => {
  const kinds: FlakeKind[] = ['snow', 'ash', 'leaves', 'fireflies'];

  it.each(kinds)('%s nasce dentro do quadro e continua dentro dele depois de muitos passos', (kind) => {
    const w = 400;
    const h = 100;
    const flakes = createFlakes(kind, 40, w, h, seeded());
    expect(flakes).toHaveLength(40);
    for (let i = 0; i < 2000; i++) stepFlakes(flakes, kind, 1, w, h);
    for (const f of flakes) {
      expect(f.x).toBeGreaterThanOrEqual(-4.5);
      expect(f.x).toBeLessThanOrEqual(w + 4.5);
      expect(f.y).toBeGreaterThanOrEqual(-4.5);
      expect(f.y).toBeLessThanOrEqual(h + 4.5);
    }
  });

  it('a neve cai e as folhas vão para a direita', () => {
    const snow = createFlakes('snow', 10, 400, 100, seeded());
    expect(snow.every((f) => f.vy > 0)).toBe(true);
    const leaves = createFlakes('leaves', 10, 400, 100, seeded());
    expect(leaves.every((f) => f.vx > 0)).toBe(true);
  });

  it('vaga-lumes piscam', () => {
    const flies = createFlakes('fireflies', 10, 400, 100, seeded());
    const before = flies.map((f) => f.alpha);
    stepFlakes(flies, 'fireflies', 10, 400, 100);
    expect(flies.map((f) => f.alpha)).not.toEqual(before);
  });
});

describe('meteoros', () => {
  it('só riscam o céu depois de 1,5 s e por menos de 1 s a cada ciclo', () => {
    expect(shootingProgress(1)).toBeNull();
    expect(shootingProgress(1.6)?.progress).toBeGreaterThan(0);
    expect(shootingProgress(3)).toBeNull();
    expect(shootingProgress(5.2)?.index).toBe(1);
  });

  it('começam sempre dentro do céu', () => {
    for (let i = 0; i < 50; i++) {
      const { x, y } = shootingStart(i);
      expect(x).toBeGreaterThanOrEqual(40);
      expect(x).toBeLessThanOrEqual(260);
      expect(y).toBeGreaterThanOrEqual(2);
      expect(y).toBeLessThanOrEqual(12);
    }
  });
});
