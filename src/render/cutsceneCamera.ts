import type { SceneCamera } from '../game/cutscene';

/**
 * Câmera da abertura, reproduzida em JavaScript a partir dos keyframes que estavam no CSS
 * (`.cam-*` e `.px-*` em styles.scss). Mesma curva, mesma duração e mesmos deslocamentos,
 * para o movimento não mudar ao migrar do SVG para o PixiJS (os estilos antigos foram removidos na Fase 8).
 *
 * Coordenadas: unidades da arte (320×180). Um keyframe CSS `scale(s) translateX(T)` com
 * origem O vira: posição = O·(1−s) + s·T, escala = s.
 */

export const ART_W = 320;
export const ART_H = 180;

export type LayerDepth = 'far' | 'mid' | 'near';

export interface Xf {
  s: number;
  tx: number;
  ty: number;
}

/** Curva cubic-bezier(0.22, 0.61, 0.36, 1), a mesma do CSS antigo (`$cam-ease`). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Bisseção: x(t) é monótona nesta curva, então converge sempre.
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 40; i++) {
      t = (lo + hi) / 2;
      if (sampleX(t) < x) lo = t;
      else hi = t;
    }
    return sampleY(t);
  };
}

export const CAM_EASE = cubicBezier(0.22, 0.61, 0.36, 1);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Duração (ms) de cada movimento. `still` não anima. */
export function cameraDurationMs(camera: SceneCamera): number {
  if (camera === 'still') return 0;
  return camera === 'dolly-in' ? 19000 : 16000;
}

/** Movimento da câmera inteira (`.scene-camera`), com `e` já suavizado pela curva. */
export function rootTransform(camera: SceneCamera, e: number): Xf {
  switch (camera) {
    case 'zoom-in':
      return { s: lerp(1, 1.14, e), tx: 0, ty: 0 };
    case 'zoom-out':
      return { s: lerp(1.14, 1, e), tx: 0, ty: 0 };
    case 'pan-left':
      return { s: 1.18, tx: lerp(0.05, -0.05, e) * ART_W, ty: 0 };
    case 'pan-right':
      return { s: 1.18, tx: lerp(-0.05, 0.05, e) * ART_W, ty: 0 };
    case 'dolly-in':
      return { s: lerp(1.02, 1.38, e), tx: 0, ty: 0 };
    case 'push-in':
      return { s: lerp(1.04, 1.3, e), tx: 0, ty: lerp(0, -0.015, e) * ART_H };
    case 'pull-back':
      return { s: lerp(1.34, 1.02, e), tx: 0, ty: 0 };
    case 'tilt-up':
      return { s: 1.15, tx: 0, ty: lerp(-0.04, 0.04, e) * ART_H };
    case 'tilt-down':
      return { s: 1.15, tx: 0, ty: lerp(0.04, -0.04, e) * ART_H };
    case 'still':
    default:
      return { s: 1.02, tx: 0, ty: 0 };
  }
}

/** Profundidade de cada camada (`--pd`) e escala final (`--pz`) do CSS. */
const PD: Record<LayerDepth, number> = { far: 6, mid: 0, near: -6 };
const PZ: Record<LayerDepth, number> = { far: 0.9, mid: 1, near: 1.08 };

/** Movimento de uma camada de profundidade. Camadas distantes deslizam menos (parallax). */
export function layerTransform(camera: SceneCamera, depth: LayerDepth, e: number): Xf {
  const pd = PD[depth];
  const pz = PZ[depth];
  switch (camera) {
    case 'pan-left':
    case 'pan-right': {
      const pdir = camera === 'pan-left' ? 1 : -1;
      return { s: 1, tx: lerp(-pdir * pd, pdir * pd, e), ty: 0 };
    }
    case 'tilt-up':
    case 'tilt-down': {
      const pdir = camera === 'tilt-up' ? 1 : -1;
      return { s: 1, tx: 0, ty: lerp(-0.7 * pdir * pd, 0.7 * pdir * pd, e) };
    }
    case 'dolly-in':
    case 'push-in':
      return { s: lerp(1, pz, e), tx: 0, ty: 0 };
    case 'pull-back':
      // No CSS isto é `reverse`: começa em `pz` e assenta em 1.
      return { s: lerp(pz, 1, e), tx: 0, ty: 0 };
    default:
      return { s: 1, tx: 0, ty: 0 };
  }
}

/** Aplica um Xf a um container do Pixi, com origem O (em unidades da arte). */
export function applyXf(target: { scale: { set: (s: number) => void }; position: { set: (x: number, y: number) => void } }, origin: { x: number; y: number }, xf: Xf) {
  target.scale.set(xf.s);
  target.position.set(origin.x * (1 - xf.s) + xf.s * xf.tx, origin.y * (1 - xf.s) + xf.s * xf.ty);
}
