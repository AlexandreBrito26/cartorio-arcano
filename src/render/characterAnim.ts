import type { Species } from '../game/types';

/** Pasta dos sprites de personagem (gerados por tools/gen_characters.py). */
export const SPECIES_SLUG: Record<Species, string> = {
  Humano: 'humano',
  Elfo: 'elfo',
  Anão: 'anao',
  Goblin: 'goblin',
  Fada: 'fada',
  Draconato: 'draconato',
  Tritão: 'tritao',
  Golem: 'golem',
  Espectro: 'espectro',
};

/** Frame atual de uma sequência de offsets, a `fps` quadros por segundo. */
export function frameIndex(elapsedMs: number, fps: number, count: number, loop: boolean): number {
  const i = Math.floor((elapsedMs / 1000) * fps);
  if (loop) return ((i % count) + count) % count;
  return Math.min(i, count - 1);
}

/** Respiração das espécies com corpo: offsets verticais em pixels de arte (4 quadros, 4 fps). */
export const BREATHE_Y = [0, -1, -1, 0];

/** Espectro flutua: sobe e desce devagar (6 quadros, 5 fps). */
export const FLOAT_Y = [0, -1, -2, -1, 0, 1];
export const FLOAT_ALPHA = [0.72, 0.62, 0.55, 0.62, 0.72, 0.8];

/** Golem: brilho das rachaduras pulsa (6 quadros, 3 fps). */
export const GLOW_ALPHA = [1, 0.55, 1, 0.35, 0.8, 1];

/** Fada: asas batem (6 quadros, 12 fps). */
export const WING_SCALE_X = [1, 0.7, 0.4, 0.7, 1, 1];

/** Reação de aprovar: a cabeça assente (5 quadros, 10 fps, uma vez). */
export const NOD_Y = [0, 2, 3, 2, 0];

/** Reação de negar: tremor horizontal (6 quadros, 12 fps, uma vez). */
export const SHAKE_X = [0, -2, 2, -2, 1, 0];

/** Piscada: a cada 4,5 s, pálpebra fechada por 3 quadros a 10 fps. */
export const BLINK_PERIOD_MS = 4500;
export function isBlinking(elapsedMs: number): boolean {
  const t = elapsedMs % BLINK_PERIOD_MS;
  return t < 300;
}

/** Draconato: fumaça que sobe da boca, em 4 quadros (6 fps). Cada quadro é uma lista de [x, y, raio]. */
export const SMOKE_FRAMES: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
  [[31, 38, 1]],
  [[30, 35, 2], [33, 33, 1]],
  [[30, 30, 2], [34, 27, 1]],
  [[31, 24, 2], [35, 20, 1]],
];

/** Tritão: gotas de respingo ao redor dos ombros, em 4 quadros (6 fps). */
export const SPLASH_FRAMES: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
  [[6, 60, 1], [58, 58, 1]],
  [[4, 54, 1], [7, 62, 1], [60, 52, 1], [57, 62, 1]],
  [[3, 48, 1], [9, 56, 1], [61, 48, 1]],
  [[2, 44, 1], [11, 52, 1], [62, 46, 1]],
];

/** Quantas camadas tem a folha de cada espécie (ordem em tools/gen_characters.py; o contorno é a 11ª). */
export const CHARACTER_LAYER_COUNT = 19;
export const OUTLINE_LAYER_INDEX = 10;

/**
 * Mãos (Fase 12). Duas mãos pousadas no balcão, cada uma com a sua manga.
 * Ocioso: de tempos em tempos uma delas bate os dedos na madeira (lado direito a cada 7 s, esquerdo a cada 11 s).
 * Aprovar: a mão direita sobe e acena; Negar: as duas sobem e se abrem, palmas para fora.
 */
export const HAND_TAP_Y = [0, -2, 0, -2, 0, -2, 0];
export const HAND_TAP_PERIOD_MS: Record<'L' | 'R', number> = { L: 11000, R: 7000 };
export const HAND_REACTION_MS = 700;
export const HAND_APPROVE_R_Y = [0, -2, -4, -4, -4, -2, 0];
export const HAND_APPROVE_R_X = [0, 0, 1, -1, 1, 0, 0];
export const HAND_APPROVE_L_Y = [0, 0, -1, -1, -1, 0, 0];
export const HAND_DENY_Y = [0, -2, -3, -3, -3, -2, 0];
/** Quanto cada mão se afasta do centro (a esquerda vai para -x, a direita para +x). */
export const HAND_DENY_SPREAD_X = [0, 1, 2, 3, 3, 2, 0];

export type HandSide = 'L' | 'R';

/** Deslocamento da mão em pixels de arte. `sinceMs` é o tempo desde a decisão (negativo = nenhuma). */
export function handOffsets(
  side: HandSide,
  nowMs: number,
  reaction: 'approve' | 'deny' | undefined,
  sinceMs: number,
): { dx: number; dy: number } {
  if (reaction && sinceMs >= 0 && sinceMs < HAND_REACTION_MS) {
    const i = frameIndex(sinceMs, 10, HAND_DENY_Y.length, false);
    if (reaction === 'approve') {
      return side === 'R' ? { dx: HAND_APPROVE_R_X[i], dy: HAND_APPROVE_R_Y[i] } : { dx: 0, dy: HAND_APPROVE_L_Y[i] };
    }
    const out = HAND_DENY_SPREAD_X[i];
    return { dx: side === 'L' ? -out : out, dy: HAND_DENY_Y[i] };
  }
  const t = nowMs % HAND_TAP_PERIOD_MS[side];
  if (t >= 0 && t < HAND_TAP_Y.length * 100) return { dx: 0, dy: HAND_TAP_Y[Math.floor(t / 100)] };
  return { dx: 0, dy: 0 };
}
