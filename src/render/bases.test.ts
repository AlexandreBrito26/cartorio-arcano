import { describe, expect, it } from 'vitest';
import { BASES, pickBase } from './bases';

describe('pickBase', () => {
  it.each([
    [360, 640],
    [390, 844],
    [412, 915],
  ])('celular em pé %ix%i usa a base em retrato', (w, h) => {
    expect(pickBase(w, h)).toBe(BASES.tall);
  });

  it.each([
    [844, 390], // celular deitado
    [768, 1024], // tablet em pé: largo demais
    [1920, 1080],
    [1280, 720],
  ])('%ix%i usa a faixa larga', (w, h) => {
    expect(pickBase(w, h)).toBe(BASES.wide);
  });

  it('janela quase quadrada e tamanhos inválidos ficam na faixa larga', () => {
    expect(pickBase(600, 640)).toBe(BASES.wide);
    expect(pickBase(0, 0)).toBe(BASES.wide);
  });
});
