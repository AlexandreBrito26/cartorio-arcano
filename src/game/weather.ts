/**
 * Clima e cenário do balcão, um por dia. Dados e simulação puros (sem Pixi), testados.
 * O desenho fica em render/CounterPixelScene.tsx (céu) e render/WeatherLayer.tsx (partículas).
 */

export type ParticleKind = 'rain' | 'snow' | 'ash' | 'embers' | 'leaves' | 'fireflies';

export interface ParticleSpec {
  kind: ParticleKind;
  count: number;
  /** Multiplicador de velocidade (1 = normal). */
  speed?: number;
}

export interface Weather {
  id: string;
  /** Legenda do palco ("Fronteira das Brumas · …"). */
  label: string;
  /** Cinco faixas de céu de 8 px cada, do topo ao horizonte (0xRRGGBB). */
  sky: [number, number, number, number, number];
  particles: ParticleSpec[];
  stars?: boolean;
  /** Meteoros riscando o céu de tempos em tempos. */
  shootingStars?: boolean;
  moon?: { kind: 'full' | 'crescent'; color: number };
  /** Sol baixo atrás das montanhas. */
  sun?: { color: number; glow: number };
  /** Faixas de aurora (cores). */
  aurora?: number[];
  clouds: { count: number; color: number; alpha: number; speed: number };
  /** Período do relâmpago em ms; ausente = sem relâmpago. */
  lightningMs?: number;
  /** Multiplicador da névoa rente ao chão (1 = a de sempre). */
  mist: number;
}

export const WEATHERS: Weather[] = [
  {
    id: 'chuva',
    label: 'Chuva',
    sky: [0x0a1124, 0x0f0b1f, 0x1c1638, 0x2b2144, 0x9fb3d9],
    particles: [{ kind: 'rain', count: 90 }],
    clouds: { count: 4, color: 0x0f0b1f, alpha: 0.95, speed: 2 },
    lightningMs: 11000,
    mist: 1,
  },
  {
    id: 'noite-limpa',
    label: 'Noite limpa',
    sky: [0x050816, 0x0a1230, 0x13204a, 0x1f3366, 0x3c5a95],
    particles: [{ kind: 'fireflies', count: 14 }],
    stars: true,
    moon: { kind: 'full', color: 0xf1e4c3 },
    clouds: { count: 2, color: 0x1a2650, alpha: 0.55, speed: 1.2 },
    mist: 0.8,
  },
  {
    id: 'nevasca',
    label: 'Nevasca',
    sky: [0x2a3042, 0x3a4258, 0x4f5a74, 0x6d7a96, 0xa9b6cc],
    particles: [{ kind: 'snow', count: 120 }],
    clouds: { count: 5, color: 0x58627c, alpha: 0.9, speed: 3 },
    mist: 1.6,
  },
  {
    id: 'poente',
    label: 'Poente dourado',
    sky: [0x2b1a4a, 0x5a2a62, 0xa4455e, 0xe0814f, 0xffc27a],
    particles: [{ kind: 'leaves', count: 28 }],
    sun: { color: 0xffd98a, glow: 0xff9a4d },
    clouds: { count: 3, color: 0xc2566a, alpha: 0.75, speed: 2.5 },
    mist: 0.5,
  },
  {
    id: 'tempestade',
    label: 'Tempestade',
    sky: [0x06080f, 0x0b0f1a, 0x141a2b, 0x232b42, 0x56638a],
    particles: [{ kind: 'rain', count: 170, speed: 1.35 }],
    clouds: { count: 6, color: 0x070910, alpha: 0.98, speed: 5 },
    lightningMs: 5200,
    mist: 1.2,
  },
  {
    id: 'aurora',
    label: 'Aurora',
    sky: [0x040a1a, 0x07182e, 0x0b2a3f, 0x12404a, 0x2b6a68],
    particles: [{ kind: 'snow', count: 36, speed: 0.6 }],
    stars: true,
    aurora: [0x5cffb0, 0x8f6bff, 0x44d8ff],
    clouds: { count: 1, color: 0x0b2a3f, alpha: 0.4, speed: 1 },
    mist: 0.7,
  },
  {
    id: 'cinzas',
    label: 'Cinzas ao vento',
    sky: [0x120708, 0x2a0e0e, 0x4a1a14, 0x7a2e1c, 0xc2602e],
    particles: [
      { kind: 'ash', count: 60 },
      { kind: 'embers', count: 34 },
    ],
    moon: { kind: 'full', color: 0xff7a4a },
    clouds: { count: 4, color: 0x1e0c0c, alpha: 0.9, speed: 4 },
    mist: 1.1,
  },
  {
    id: 'nevoa',
    label: 'Névoa densa',
    sky: [0x3a3552, 0x4d4868, 0x645f82, 0x7f7a9c, 0xa9a5c2],
    particles: [],
    clouds: { count: 4, color: 0x8b86a8, alpha: 0.7, speed: 1.5 },
    mist: 3,
  },
  {
    id: 'meteoros',
    label: 'Chuva de estrelas',
    sky: [0x03050f, 0x080c24, 0x10163a, 0x1b2250, 0x34407a],
    particles: [],
    stars: true,
    shootingStars: true,
    moon: { kind: 'crescent', color: 0xf1e4c3 },
    clouds: { count: 1, color: 0x10163a, alpha: 0.4, speed: 1 },
    mist: 0.6,
  },
];

/** O clima de um dia: o dia 1 é a chuva de sempre e o ciclo se repete (a campanha tem 20 dias e há o modo infinito). */
export function weatherForDay(day: number): Weather {
  const i = Math.max(0, Math.floor(day) - 1);
  return WEATHERS[i % WEATHERS.length];
}

// ---------------------------------------------------------------------------
// Partículas (neve, cinzas, folhas, vaga-lumes). A chuva e as brasas usam render/motes.ts.
// Unidades: pixels lógicos do canvas do balcão e quadros de 60 fps.
// ---------------------------------------------------------------------------

export type FlakeKind = 'snow' | 'ash' | 'leaves' | 'fireflies';

export interface Flake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  /** Lado do quadradinho, em pixels lógicos. */
  size: number;
  base: number;
  alpha: number;
  color: number;
}

const COLORS: Record<FlakeKind, number[]> = {
  snow: [0xffffff, 0xe4eeff, 0xc9d8ff],
  ash: [0x8a8480, 0x6b6560, 0xa39c96],
  leaves: [0xe0a23c, 0xc2562e, 0x8a5a2a, 0xf0c46a],
  fireflies: [0xd8ff7a, 0xfff2a0],
};

export function createFlakes(kind: FlakeKind, count: number, w: number, h: number, random: () => number = Math.random): Flake[] {
  const rand = (a: number, b: number) => a + random() * (b - a);
  const colors = COLORS[kind];
  return Array.from({ length: count }, (_, i) => {
    const base = kind === 'fireflies' ? rand(0.5, 1) : rand(0.55, 0.95);
    return {
      x: rand(0, w),
      y: rand(0, h),
      vx: kind === 'leaves' ? rand(0.9, 2) : kind === 'ash' ? rand(0.4, 1.1) : kind === 'fireflies' ? rand(-0.12, 0.12) : rand(-0.15, 0.1),
      vy: kind === 'snow' ? rand(0.3, 0.8) : kind === 'ash' ? rand(0.2, 0.5) : kind === 'leaves' ? rand(0.1, 0.35) : rand(-0.08, 0.08),
      phase: rand(0, Math.PI * 2),
      size: kind === 'snow' ? (random() < 0.25 ? 2 : 1) : kind === 'leaves' ? 2 : 1,
      base,
      alpha: base,
      color: colors[i % colors.length],
    };
  });
}

/** Avança `dt` quadros de 60 fps (1 = um quadro). `speed` escala o movimento. */
export function stepFlakes(flakes: Flake[], kind: FlakeKind, dt: number, w: number, h: number, speed = 1) {
  const k = dt * speed;
  for (const f of flakes) {
    f.phase += (kind === 'fireflies' ? 0.035 : 0.025) * k;
    const sway = kind === 'leaves' ? 0.35 : kind === 'fireflies' ? 0.3 : 0.18;
    f.x += (f.vx + Math.sin(f.phase) * sway) * k;
    f.y += (f.vy + (kind === 'leaves' || kind === 'fireflies' ? Math.cos(f.phase * 1.3) * 0.2 : 0)) * k;
    if (kind === 'fireflies') f.alpha = f.base * (0.5 + 0.5 * Math.sin(f.phase * 2.2));
    if (f.y > h + 4) f.y = -4;
    if (f.y < -4) f.y = h + 4;
    if (f.x > w + 4) f.x = -4;
    if (f.x < -4) f.x = w + 4;
  }
}

// ---------------------------------------------------------------------------
// Meteoros
// ---------------------------------------------------------------------------

/** Um meteoro a cada ~3,6 s, com 0,7 s de traço. Devolve null fora do traço, ou o progresso 0→1. */
export const SHOOTING_PERIOD_MS = 3600;
export const SHOOTING_LIFE_MS = 700;
export function shootingProgress(seconds: number): { progress: number; index: number } | null {
  const ms = seconds * 1000;
  if (ms < 1500) return null;
  const t = ms - 1500;
  const index = Math.floor(t / SHOOTING_PERIOD_MS);
  const local = t % SHOOTING_PERIOD_MS;
  if (local >= SHOOTING_LIFE_MS) return null;
  return { progress: local / SHOOTING_LIFE_MS, index };
}

/** Início do meteoro `index`, no céu de 320×40 (determinístico). */
export function shootingStart(index: number): { x: number; y: number } {
  const r = Math.sin((index + 1) * 12.9898) * 43758.5453;
  const f = r - Math.floor(r);
  return { x: 40 + f * 220, y: 2 + ((f * 7.3) % 1) * 10 };
}
