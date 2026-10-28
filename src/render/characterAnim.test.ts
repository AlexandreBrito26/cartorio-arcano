import { describe, expect, it } from 'vitest';
import {
  BLINK_PERIOD_MS,
  CHARACTER_LAYER_COUNT,
  HAND_APPROVE_L_Y,
  HAND_APPROVE_R_X,
  HAND_APPROVE_R_Y,
  HAND_DENY_SPREAD_X,
  HAND_DENY_Y,
  HAND_REACTION_MS,
  HAND_TAP_Y,
  OUTLINE_LAYER_INDEX,
  frameIndex,
  handOffsets,
  isBlinking,
  NOD_Y,
  SHAKE_X,
} from './characterAnim';
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

describe('mãos', () => {
  it('as sequências começam e terminam na posição neutra e têm o mesmo tamanho', () => {
    const seqs = [HAND_TAP_Y, HAND_APPROVE_R_Y, HAND_APPROVE_R_X, HAND_APPROVE_L_Y, HAND_DENY_Y, HAND_DENY_SPREAD_X];
    for (const s of seqs) {
      expect(s[0]).toBe(0);
      expect(s[s.length - 1]).toBe(0);
    }
    for (const s of [HAND_APPROVE_R_Y, HAND_APPROVE_R_X, HAND_APPROVE_L_Y, HAND_DENY_Y, HAND_DENY_SPREAD_X]) {
      expect(s).toHaveLength(HAND_DENY_Y.length);
    }
    expect(HAND_DENY_Y.length * 100).toBe(HAND_REACTION_MS);
  });

  it('parada: sem reação e fora da batida, as mãos ficam no lugar', () => {
    expect(handOffsets('L', 1000, undefined, -1)).toEqual({ dx: 0, dy: 0 });
    expect(handOffsets('R', 3000, undefined, -1)).toEqual({ dx: 0, dy: 0 });
  });

  it('batida: a direita bate a cada 7 s e a esquerda a cada 11 s', () => {
    expect(handOffsets('R', 7000 + 150, undefined, -1).dy).toBe(HAND_TAP_Y[1]);
    expect(handOffsets('R', 7000 + 150, undefined, -1).dy).toBeLessThan(0);
    expect(handOffsets('L', 11000 + 150, undefined, -1).dy).toBeLessThan(0);
    expect(handOffsets('L', 7000 + 150, undefined, -1).dy).toBe(0);
  });

  it('aprovar: só a direita acena (sobe mais) e a esquerda mal se mexe', () => {
    const r = handOffsets('R', 0, 'approve', 200);
    const l = handOffsets('L', 0, 'approve', 200);
    expect(r.dy).toBe(HAND_APPROVE_R_Y[2]);
    expect(r.dy).toBeLessThan(l.dy);
    expect(l.dx).toBe(0);
  });

  it('negar: as duas sobem e se afastam do centro, em sentidos opostos', () => {
    const l = handOffsets('L', 0, 'deny', 300);
    const r = handOffsets('R', 0, 'deny', 300);
    expect(l.dy).toBe(r.dy);
    expect(l.dy).toBeLessThan(0);
    expect(l.dx).toBe(-r.dx);
    expect(r.dx).toBeGreaterThan(0);
  });

  it('depois do fim da reação, volta ao ocioso', () => {
    expect(handOffsets('R', 100, 'deny', HAND_REACTION_MS + 1)).toEqual(handOffsets('R', 100, undefined, -1));
  });
});

describe('folha de personagem', () => {
  it('a ordem das camadas bate com o que o Portrait de reserva assume', () => {
    expect(OUTLINE_LAYER_INDEX).toBe(10);
    expect(CHARACTER_LAYER_COUNT).toBe(19);
  });
});
