import { describe, expect, it } from 'vitest';
import {
  SKINS,
  buySuit,
  canBuySuit,
  equipSuit,
  SKIN_IDS,
  buySkin,
  canBuySkin,
  equipSkin,
  grantSelos,
  initialSkins,
  sanitizeSkins,
  selosForDay,
  skinCssVars,
  skinDef,
  skinWeather,
  tintColor,
} from './skins';
import { WEATHERS } from './weather';

describe('catálogo', () => {
  it('ids únicos, a clássica é grátis e as outras custam Selos', () => {
    expect(new Set(SKIN_IDS).size).toBe(SKINS.length);
    expect(skinDef('classico').cost).toBe(0);
    for (const s of SKINS.filter((x) => x.id !== 'classico')) expect(s.cost).toBeGreaterThan(0);
  });

  it('toda skin define todas as variáveis de cor, em hexadecimal', () => {
    const keys = Object.keys(skinCssVars(SKINS[0]));
    for (const s of SKINS) {
      expect(Object.keys(skinCssVars(s))).toEqual(keys);
      for (const v of Object.values(skinCssVars(s))) expect(v).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('compra e uso', () => {
  it('começa só com a clássica e sem Selos', () => {
    expect(initialSkins()).toEqual({
      owned: ['classico'],
      equipped: 'classico',
      selos: 0,
      suits: ['original'],
      suit: 'original',
    });
  });

  it('só compra com Selos suficientes e já veste a skin', () => {
    const poor = grantSelos(initialSkins(), 5);
    expect(canBuySkin(poor, 'ambar')).toBe(false);
    expect(buySkin(poor, 'ambar')).toBeNull();
    const ok = buySkin(grantSelos(initialSkins(), 6), 'ambar')!;
    expect(ok).toEqual({ ...initialSkins(), owned: ['classico', 'ambar'], equipped: 'ambar', selos: 0 });
  });

  it('não compra duas vezes nem veste o que não tem', () => {
    const s = buySkin(grantSelos(initialSkins(), 30), 'mare')!;
    expect(buySkin(s, 'mare')).toBeNull();
    expect(equipSkin(s, 'neon')).toBe(s);
    expect(equipSkin(s, 'classico').equipped).toBe('classico');
  });

  it('Selos por dia: 1, e 3 a cada quinto dia', () => {
    expect(selosForDay(1)).toBe(1);
    expect(selosForDay(5)).toBe(3);
    expect(selosForDay(10)).toBe(3);
    expect(selosForDay(11)).toBe(1);
  });
});

describe('save', () => {
  it('descarta lixo e mantém a clássica', () => {
    expect(sanitizeSkins(null)).toEqual(initialSkins());
    expect(sanitizeSkins({ owned: ['neon', 'xyz', 3], equipped: 'xyz', selos: -4 })).toEqual({
      ...initialSkins(),
      owned: ['classico', 'neon'],
    });
  });

  it('não deixa vestir uma skin que não é sua', () => {
    expect(sanitizeSkins({ owned: ['ambar'], equipped: 'neon', selos: 7.9 })).toEqual({
      ...initialSkins(),
      owned: ['classico', 'ambar'],
      selos: 7,
    });
  });

  it('saves antigos (sem trajes) ganham o traje original; trajes inválidos são descartados', () => {
    expect(sanitizeSkins({ owned: ['classico'], equipped: 'classico', selos: 3 }).suits).toEqual(['original']);
    expect(sanitizeSkins({ suits: ['gala', 'xyz'], suit: 'gala' })).toMatchObject({ suits: ['original', 'gala'], suit: 'gala' });
    expect(sanitizeSkins({ suits: ['gala'], suit: 'neve' }).suit).toBe('original');
  });
});

describe('cores da cena', () => {
  it('tintColor mistura canal a canal', () => {
    expect(tintColor(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(tintColor(0x000000, 0xffffff, 1)).toBe(0xffffff);
    expect(tintColor(0x102030, 0x304050, 0.5)).toBe(0x203040);
  });

  it('a skin clássica não mexe no clima; as outras tingem o céu e mantêm o resto', () => {
    const w = WEATHERS[0];
    expect(skinWeather(w, skinDef('classico'))).toBe(w);
    const t = skinWeather(w, skinDef('rubi'));
    expect(t.sky).toHaveLength(5);
    expect(t.sky).not.toEqual(w.sky);
    expect(t.id).toBe(w.id);
    expect(t.particles).toBe(w.particles);
  });
});

describe('trajes dos viajantes', () => {
  it('compra com Selos, veste e não repete', () => {
    const rich = grantSelos(initialSkins(), 20);
    expect(canBuySuit(rich, 'neve')).toBe(true);
    const s = buySuit(rich, 'neve')!;
    expect(s).toMatchObject({ suits: ['original', 'neve'], suit: 'neve', selos: 14 });
    expect(buySuit(s, 'neve')).toBeNull();
    expect(buySuit(initialSkins(), 'gala')).toBeNull();
    expect(equipSuit(s, 'original').suit).toBe('original');
    expect(equipSuit(s, 'gala')).toBe(s);
  });

  it('comprar traje não mexe nas skins de cenário', () => {
    const s = buySuit(grantSelos(initialSkins(), 20), 'tinta')!;
    expect(s.owned).toEqual(['classico']);
    expect(s.equipped).toBe('classico');
  });
});
