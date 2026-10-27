import { describe, expect, it } from 'vitest';
import { emerge, fitCounter, fitCutscene, portraitFit, travelerBox } from './stageLayout';

describe('stageLayout', () => {
  it('a caixa do viajante segue o CSS do balcão', () => {
    const b = travelerBox(1000, 300);
    expect(b.h).toBeCloseTo(165);
    expect(b.anchorX).toBe(500);
    expect(b.anchorY).toBeCloseTo(231);
    expect(b.w / b.h).toBeCloseTo(64 / 72);
  });

  it('o retrato usa escala inteira e fica centrado na caixa', () => {
    const b = travelerBox(1000, 300);
    const f = portraitFit(b.w, b.h);
    expect(Number.isInteger(f.scale)).toBe(true);
    expect(f.scale).toBe(2);
    expect(f.x).toBeGreaterThanOrEqual(0);
    expect(f.y).toBeGreaterThanOrEqual(0);
  });

  it('emerge começa apagado e termina inteiro', () => {
    expect(emerge(0)).toMatchObject({ alpha: 0, dy: 18, done: false });
    const end = emerge(5000);
    expect(end).toMatchObject({ alpha: 1, dy: 0, scale: 1, done: true });
    expect(end.brightness).toBeCloseTo(0.82);
  });
});

describe('fitCounter (resolução interna fixa)', () => {
  it('desktop 1200×300: viajante 2x, cena 2x no canvas lógico = 4 px de tela por pixel de arte', () => {
    const f = fitCounter(1200, 300);
    expect(f).toMatchObject({ p: 2, m: 2, lw: 600, lh: 150 });
  });

  it('celular 390×230: tudo em 1x no lógico, cena 3x', () => {
    expect(fitCounter(390, 230)).toMatchObject({ p: 1, m: 3, lw: 390, lh: 230 });
  });

  it('o canvas lógico, ampliado p vezes, sempre cobre o palco e a cena cobre o canvas', () => {
    for (const [w, h] of [[1920, 360], [1366, 340], [800, 230], [390, 230], [1200, 300], [2560, 360]]) {
      const f = fitCounter(w, h);
      expect(f.lw * f.p).toBeGreaterThanOrEqual(w);
      expect(f.lw * f.p - w).toBeLessThan(f.p);
      expect(f.lh * f.p - h).toBeLessThan(f.p);
      expect(320 * f.m).toBeGreaterThanOrEqual(f.lw);
      expect(80 * f.m).toBeGreaterThanOrEqual(f.lh);
      expect(Number.isInteger(f.p) && Number.isInteger(f.m)).toBe(true);
    }
  });

  it('tamanho inválido não quebra', () => {
    expect(fitCounter(0, 0)).toMatchObject({ p: 1, m: 1 });
  });
});

describe('fitCutscene', () => {
  it('1080p: arte 6x = 6 × 1, sem resto fracionário', () => {
    const f = fitCutscene(1920, 1080, 320, 180);
    expect(f.p).toBe(6);
    expect(f.artScale).toBeCloseTo(1);
    expect(f.lw).toBe(320);
  });

  it('quadro quebrado: p inteiro e o resto fica na escala da arte dentro do canvas lógico', () => {
    const f = fitCutscene(1366, 768, 320, 180);
    expect(f.p).toBe(4);
    expect(f.artScale * f.p).toBeCloseTo(1366 / 320);
    expect(f.lw * f.p).toBeGreaterThanOrEqual(1366);
  });
});
