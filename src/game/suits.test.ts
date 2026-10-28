import { describe, expect, it } from 'vitest';
import type { Look } from './types';
import { SUITS, SUIT_IDS, dressLook, hexToRgb, mixHex, suitDef } from './suits';

const look: Look = { species: 'Elfo', skin: '#e0b08c', hair: '#5a3a22', eyes: '#3a6a9a', cloak: '#7a3b3b', hairStyle: 1, beard: true };
const HEX = /^#[0-9a-f]{6}$/i;

describe('catálogo de trajes', () => {
  it('ids únicos, o original é grátis e todas as cores são hexadecimais', () => {
    expect(new Set(SUIT_IDS).size).toBe(SUITS.length);
    expect(suitDef('original').cost).toBe(0);
    for (const s of SUITS) {
      expect(s.halo).toMatch(HEX);
      for (const c of [...s.cloaks, ...s.hair, ...s.eyes]) expect(c).toMatch(HEX);
      if (s.id !== 'original') {
        expect(s.cost).toBeGreaterThan(0);
        expect(s.cloaks.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('dressLook', () => {
  it('o traje original devolve o próprio viajante', () => {
    expect(dressLook(look, suitDef('original'))).toBe(look);
  });

  it('só troca cores: espécie, cabelo e barba ficam como estão', () => {
    for (const suit of SUITS) {
      const d = dressLook(look, suit);
      expect(d.species).toBe(look.species);
      expect(d.hairStyle).toBe(look.hairStyle);
      expect(d.beard).toBe(look.beard);
      for (const c of [d.skin, d.hair, d.eyes, d.cloak]) expect(c).toMatch(HEX);
    }
  });

  it('é determinístico e usa as cores do traje', () => {
    const suit = suitDef('gala');
    expect(dressLook(look, suit)).toEqual(dressLook({ ...look }, suit));
    expect(suit.cloaks).toContain(dressLook(look, suit).cloak);
    expect(suit.hair).toContain(dressLook(look, suit).hair);
  });

  it('viajantes diferentes variam entre as cores do traje', () => {
    const suit = suitDef('carnaval');
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) seen.add(dressLook({ ...look, cloak: `#${(i * 99991 + 4096).toString(16).padStart(6, '0').slice(-6)}` }, suit).cloak);
    expect(seen.size).toBeGreaterThan(2);
  });

  it('o traje de tinta tira a cor da pele', () => {
    const d = dressLook(look, suitDef('tinta'));
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(d.skin.slice(i, i + 2), 16));
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThan(40);
  });
});

describe('cores', () => {
  it('mixHex e hexToRgb', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#102030', '#102030', 0.7)).toBe('#102030');
    expect(hexToRgb('#7da0ff')).toBe('125,160,255');
  });
});
