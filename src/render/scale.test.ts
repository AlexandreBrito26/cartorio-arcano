import { describe, expect, it } from 'vitest';
import { centerOffset, integerScale } from './scale';

describe('integerScale', () => {
  it('escolhe o maior fator inteiro que cabe', () => {
    expect(integerScale(1920, 1080, 320, 180)).toBe(6); // 1920/320 = 6, 1080/180 = 6
    expect(integerScale(2560, 1440, 320, 180)).toBe(8); // 2560/320 = 8, 1440/180 = 8
    expect(integerScale(390, 844, 320, 180)).toBe(1); // celular em retrato: cabe 1x
  });

  it('nunca retorna fração nem menos que 1', () => {
    expect(integerScale(1000, 700, 320, 180)).toBe(3); // 700/180 = 3.88 → 3
    expect(integerScale(100, 50, 320, 180)).toBe(1);
    expect(integerScale(0, 0, 320, 180)).toBe(1);
  });
});

describe('centerOffset', () => {
  it('centraliza a cena escalada', () => {
    expect(centerOffset(1920, 1080, 320, 180, 6)).toEqual({ x: 0, y: 0 });
    expect(centerOffset(1930, 1090, 320, 180, 6)).toEqual({ x: 5, y: 5 });
  });
});
