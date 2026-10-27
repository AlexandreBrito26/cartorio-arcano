import { useEffect, useRef } from 'react';

type Mood = 'embers' | 'mist' | 'rain';

interface Props {
  mood?: Mood;
  /** Quantidade de partículas. */
  count?: number;
  className?: string;
}

const PALETTE: Record<Mood, number[]> = {
  embers: [0xe0b44c, 0xffd36b, 0xf1e4c3],
  mist: [0xa79fc9, 0x7a66e0, 0xf1e4c3],
  rain: [0x9fb8e8, 0xc9d8ff, 0x7f9bd6],
};

const reduced = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface Mote {
  g: import('pixi.js').Graphics;
  vx: number;
  vy: number;
  phase: number;
  base: number;
}

/**
 * Partículas flutuantes (brasas ou névoa) desenhadas com PixiJS num canvas transparente.
 * O PixiJS é carregado sob demanda para não pesar no carregamento inicial do jogo.
 */
export function Ambience({ mood = 'embers', count = 36, className }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || reduced()) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const { Application, Graphics } = await import('pixi.js');
      if (cancelled) return;

      const app = new Application();
      try {
        await app.init({
          resizeTo: el,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
        });
      } catch {
        // Sem WebGL/canvas: o jogo segue sem as partículas.
        return;
      }
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      el.appendChild(app.canvas);
      const colors = PALETTE[mood];
      const motes: Mote[] = [];
      const rand = (a: number, b: number) => a + Math.random() * (b - a);

      for (let i = 0; i < count; i++) {
        const g = new Graphics();
        if (mood === 'rain') {
          // Fio de chuva inclinado: cada gota tem comprimento e opacidade próprios (profundidade).
          const len = rand(8, 22);
          g.moveTo(0, 0).lineTo(-len * 0.12, len).stroke({ width: rand(0.6, 1.3), color: colors[i % colors.length], alpha: rand(0.18, 0.5) });
        } else {
          const r = mood === 'mist' ? rand(14, 38) : rand(1, 2.6);
          g.circle(0, 0, r).fill({ color: colors[i % colors.length], alpha: mood === 'mist' ? 0.05 : rand(0.35, 0.9) });
        }
        g.x = rand(0, app.screen.width);
        g.y = rand(0, app.screen.height);
        app.stage.addChild(g);
        motes.push({
          g,
          vx: mood === 'rain' ? -rand(1.2, 2.2) : mood === 'mist' ? rand(0.05, 0.2) : rand(-0.15, 0.15),
          vy: mood === 'rain' ? rand(11, 19) : mood === 'mist' ? rand(-0.03, 0.03) : -rand(0.1, 0.45),
          phase: rand(0, Math.PI * 2),
          base: g.alpha,
        });
      }

      app.ticker.add((t) => {
        const { width, height } = app.screen;
        const dt = t.deltaTime;
        for (const m of motes) {
          m.phase += 0.02 * dt;
          m.g.x += (m.vx + (mood === 'rain' ? 0 : Math.sin(m.phase) * 0.15)) * dt;
          m.g.y += m.vy * dt;
          if (mood === 'embers') m.g.alpha = m.base * (0.6 + 0.4 * Math.sin(m.phase * 2));
          if (m.g.y < -10) m.g.y = height + 10;
          if (m.g.y > height + 40) m.g.y = -10;
          if (m.g.x > width + 40) m.g.x = -40;
          if (m.g.x < -40) m.g.x = width + 40;
        }
      });

      cleanup = () => app.destroy(true, { children: true });
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [mood, count]);

  return <div ref={host} className={['ambience', className].filter(Boolean).join(' ')} aria-hidden="true" />;
}
