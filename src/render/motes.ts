/** Simulação das partículas do Ambience (brasas, névoa, chuva), independente de renderizador. */
export type Mood = 'embers' | 'mist' | 'rain';

const PALETTE: Record<Mood, string[]> = {
  embers: ['#e0b44c', '#ffd36b', '#f1e4c3'],
  mist: ['#a79fc9', '#7a66e0', '#f1e4c3'],
  rain: ['#9fb8e8', '#c9d8ff', '#7f9bd6'],
};

export interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  /** Opacidade de base; a atual é `alpha`. */
  base: number;
  alpha: number;
  /** Raio (brasa/névoa). */
  r: number;
  /** Comprimento e espessura (chuva). */
  len: number;
  width: number;
  color: string;
}

export function createMotes(mood: Mood, count: number, w: number, h: number, random: () => number = Math.random): Mote[] {
  const rand = (a: number, b: number) => a + random() * (b - a);
  const colors = PALETTE[mood];
  return Array.from({ length: count }, (_, i) => {
    const base = mood === 'rain' ? rand(0.18, 0.5) : mood === 'mist' ? 0.05 : rand(0.35, 0.9);
    return {
      x: rand(0, w),
      y: rand(0, h),
      vx: mood === 'rain' ? -rand(1.2, 2.2) : mood === 'mist' ? rand(0.05, 0.2) : rand(-0.15, 0.15),
      vy: mood === 'rain' ? rand(11, 19) : mood === 'mist' ? rand(-0.03, 0.03) : -rand(0.1, 0.45),
      phase: rand(0, Math.PI * 2),
      base,
      alpha: base,
      r: mood === 'mist' ? rand(14, 38) : rand(1, 2.6),
      len: mood === 'rain' ? rand(8, 22) : 0,
      width: mood === 'rain' ? rand(0.6, 1.3) : 0,
      color: colors[i % colors.length],
    };
  });
}

/** Avança `dt` quadros de 60 fps (1 = um quadro). */
export function stepMotes(motes: Mote[], mood: Mood, dt: number, w: number, h: number) {
  for (const m of motes) {
    m.phase += 0.02 * dt;
    m.x += (m.vx + (mood === 'rain' ? 0 : Math.sin(m.phase) * 0.15)) * dt;
    m.y += m.vy * dt;
    if (mood === 'embers') m.alpha = m.base * (0.6 + 0.4 * Math.sin(m.phase * 2));
    if (m.y < -10) m.y = h + 10;
    if (m.y > h + 40) m.y = -10;
    if (m.x > w + 40) m.x = -40;
    if (m.x < -40) m.x = w + 40;
  }
}
