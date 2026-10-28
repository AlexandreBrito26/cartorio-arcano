import type { Container as PixiContainer } from 'pixi.js';
import { shootingProgress, shootingStart, type Weather } from '../game/weather';

type Pixi = typeof import('pixi.js');

/** O céu do balcão ocupa as linhas 0 a 39 da arte (320×80); as montanhas da arte cobrem a parte de baixo. */
export const SKY_W = 320;
export const SKY_H = 40;

/** Gerador pseudoaleatório pequeno e determinístico: as estrelas ficam no mesmo lugar a cada visita do dia. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hashId = (id: string) => [...id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

/**
 * Desenha o céu do dia atrás da arte do balcão: faixas, estrelas que cintilam, lua, sol baixo, aurora,
 * nuvens à deriva e meteoros. Devolve `update(segundos)`; com movimento reduzido, chame uma vez com 0.
 * Só adiciona o próprio Container em `parent`; quem destrói o pai destrói o céu junto.
 */
export function buildSky(pixi: Pixi, weather: Weather, parent: PixiContainer) {
  const { Container, Graphics } = pixi;
  const sky = new Container();
  parent.addChild(sky);
  const rand = seeded(hashId(weather.id));
  const updaters: Array<(sec: number) => void> = [];

  // Faixas de 8 px, do topo ao horizonte.
  const bands = new Graphics();
  weather.sky.forEach((color, i) => bands.rect(0, i * 8, SKY_W, 8).fill({ color }));
  sky.addChild(bands);

  // Estrelas em três grupos que cintilam fora de fase.
  if (weather.stars) {
    const groups = [0, 1, 2].map(() => new Graphics());
    for (let i = 0; i < 54; i++) {
      const g = groups[i % 3];
      const x = Math.floor(rand() * SKY_W);
      const y = 1 + Math.floor(rand() * 30);
      const big = rand() < 0.15;
      g.rect(x, y, big ? 2 : 1, 1).fill({ color: big ? 0xfff2c9 : 0xdfe8ff });
      if (big) g.rect(x, y - 1, 1, 3).rect(x - 1, y, 3, 1).fill({ color: 0xdfe8ff, alpha: 0.35 });
    }
    groups.forEach((g) => sky.addChild(g));
    updaters.push((sec) => groups.forEach((g, k) => (g.alpha = 0.55 + 0.45 * Math.sin(sec * (1.1 + k * 0.4) + k * 2.1))));
  }

  // Aurora: cortinas que ondulam, redesenhadas a cada quadro.
  if (weather.aurora?.length) {
    const aurora = new Graphics();
    sky.addChild(aurora);
    updaters.push((sec) => {
      aurora.clear();
      weather.aurora!.forEach((color, i) => {
        for (let x = 0; x < SKY_W; x += 4) {
          const top = 9 + i * 3 + 5 * Math.sin(x * 0.03 + sec * 0.4 + i * 2);
          const height = 9 + 4 * Math.sin(x * 0.05 - sec * 0.5 + i);
          const a = Math.max(0.04, 0.17 + 0.1 * Math.sin(x * 0.07 + sec * 0.7 + i * 1.7));
          aurora.rect(x, top, 4, height).fill({ color, alpha: a });
          aurora.rect(x, top, 4, 3).fill({ color, alpha: Math.min(0.5, a * 1.7) });
        }
      });
    });
  }

  // Lua, cheia ou em crescente, com um halo.
  if (weather.moon) {
    const mx = 256;
    const my = 13;
    const moon = new Graphics().circle(mx, my, 10).fill({ color: weather.moon.color, alpha: 0.1 });
    moon.circle(mx, my, 5).fill({ color: weather.moon.color });
    if (weather.moon.kind === 'crescent') {
      const bite = weather.sky[Math.min(4, Math.floor((my - 1) / 8))];
      moon.circle(mx + 2.5, my - 1.5, 4.4).fill({ color: bite });
    }
    sky.addChild(moon);
  }

  // Sol baixo, meio escondido pelas montanhas da arte.
  if (weather.sun) {
    const glow = new Graphics().circle(205, 38, 20).fill({ color: weather.sun.glow, alpha: 0.28 });
    glow.circle(205, 38, 14).fill({ color: weather.sun.glow, alpha: 0.3 });
    const disc = new Graphics().circle(205, 38, 10).fill({ color: weather.sun.color });
    sky.addChild(glow, disc);
    updaters.push((sec) => (glow.alpha = 0.8 + 0.2 * Math.sin(sec * 0.9)));
  }

  // Meteoros: um traço rápido de tempos em tempos.
  if (weather.shootingStars) {
    const trail = new Graphics();
    trail.visible = false;
    sky.addChild(trail);
    updaters.push((sec) => {
      const s = shootingProgress(sec);
      if (!s) {
        trail.visible = false;
        return;
      }
      const start = shootingStart(s.index);
      const x = start.x + s.progress * 70;
      const y = start.y + s.progress * 30;
      trail.clear();
      trail.moveTo(x - 12, y - 5.1).lineTo(x, y).stroke({ width: 1, color: 0xffffff, alpha: 0.9 });
      trail.moveTo(x - 6, y - 2.6).lineTo(x, y).stroke({ width: 1, color: 0xfff2c9, alpha: 1 });
      trail.alpha = 1 - s.progress * 0.8;
      trail.visible = true;
    });
  }

  // Nuvens à deriva, com a volta ao outro lado da tela.
  const { count, color, alpha, speed } = weather.clouds;
  const clouds = Array.from({ length: count }, (_, i) => {
    const g = new Graphics()
      .ellipse(0, 0, 24, 4)
      .ellipse(15, -2, 16, 4)
      .ellipse(-13, 1, 14, 3)
      .fill({ color, alpha });
    const y = 3 + ((i * 7 + 2) % 20);
    g.position.y = y;
    sky.addChild(g);
    return { g, offset: (i * (SKY_W + 120)) / Math.max(1, count) };
  });
  updaters.push((sec) => {
    const span = SKY_W + 120;
    for (const c of clouds) c.g.position.x = ((sec * speed * 3 + c.offset) % span) - 60;
  });

  return {
    update(sec: number) {
      for (const fn of updaters) fn(sec);
    },
  };
}
