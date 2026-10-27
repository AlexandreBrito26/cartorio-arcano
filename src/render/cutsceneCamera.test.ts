import { describe, expect, it } from 'vitest';
import { CAM_EASE, cameraDurationMs, cubicBezier, layerTransform, rootTransform } from './cutsceneCamera';

describe('curva da câmera', () => {
  it('começa em 0, termina em 1 e é igual à cubic-bezier do CSS', () => {
    expect(CAM_EASE(0)).toBe(0);
    expect(CAM_EASE(1)).toBe(1);
    // Valor de referência calculado à parte para cubic-bezier(0.22, 0.61, 0.36, 1) em x=0.5.
    expect(CAM_EASE(0.5)).toBeCloseTo(0.8729, 3);
    const linear = cubicBezier(0, 0, 1, 1);
    expect(linear(0.3)).toBeCloseTo(0.3, 3);
  });
});

describe('durações', () => {
  it('mantém os tempos dos keyframes CSS (16 s, dolly-in 19 s)', () => {
    expect(cameraDurationMs('dolly-in')).toBe(19000);
    for (const c of ['pan-left', 'pan-right', 'push-in', 'pull-back', 'tilt-up', 'tilt-down'] as const) {
      expect(cameraDurationMs(c)).toBe(16000);
    }
    expect(cameraDurationMs('still')).toBe(0);
  });
});

describe('keyframes da câmera', () => {
  it('dolly-in vai de 1.02 a 1.38', () => {
    expect(rootTransform('dolly-in', 0).s).toBeCloseTo(1.02);
    expect(rootTransform('dolly-in', 1).s).toBeCloseTo(1.38);
  });

  it('pan-left desliza de +5% a −5% da largura (16 a −16 unidades)', () => {
    expect(rootTransform('pan-left', 0).tx).toBeCloseTo(16);
    expect(rootTransform('pan-left', 1).tx).toBeCloseTo(-16);
  });

  it('pull-back começa em 1.34 e assenta em 1.02', () => {
    expect(rootTransform('pull-back', 0).s).toBeCloseTo(1.34);
    expect(rootTransform('pull-back', 1).s).toBeCloseTo(1.02);
  });

  it('parallax: a camada distante anda menos que a próxima', () => {
    const far = layerTransform('pan-left', 'far', 1).tx;
    const near = layerTransform('pan-left', 'near', 1).tx;
    expect(Math.abs(far)).toBeLessThan(Math.abs(near) + 1e-9);
    expect(Math.abs(layerTransform('pan-left', 'mid', 1).tx)).toBe(0);
  });

  it('pull-back nas camadas começa em pz e assenta em 1 (reverse do CSS)', () => {
    expect(layerTransform('pull-back', 'near', 0).s).toBeCloseTo(1.08);
    expect(layerTransform('pull-back', 'near', 1).s).toBeCloseTo(1);
  });
});
