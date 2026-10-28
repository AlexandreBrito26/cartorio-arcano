import { useEffect } from 'react';
import type { Graphics as PixiGraphics, TickerCallback } from 'pixi.js';
import { createFlakes, stepFlakes, type Flake, type FlakeKind, type ParticleSpec, type Weather } from '../game/weather';
import { createMotes, stepMotes, type Mote } from './motes';
import { useStage } from './PixiStage';
import { reduced } from './motion';

const toHex = (c: string) => parseInt(c.replace('#', ''), 16);

/**
 * Partículas do clima do dia, na camada `chuva` do PixiStage (entre o viajante e a divisória):
 * chuva, neve, cinzas, brasas, folhas ao vento ou vaga-lumes, conforme `weather.particles`.
 * Chuva e brasas usam a simulação de render/motes.ts; o resto, a de game/weather.ts.
 * Cada partícula é um Graphics estático que só muda de posição (e de opacidade, quando pisca).
 */
export function WeatherLayer({ weather }: { weather: Weather }) {
  const { stage } = useStage();

  useEffect(() => {
    if (!stage || reduced()) return;
    const { app, pixi } = stage;
    const layer = stage.layers.chuva;
    layer.alpha = 0.9;
    const w = () => app.screen.width;
    const h = () => app.screen.height;

    const offs: Array<() => void> = [];
    const owned: PixiGraphics[] = [];

    const addRain = (spec: ParticleSpec) => {
      const motes: Mote[] = createMotes('rain', spec.count, w(), h());
      const drops = motes.map((m) => {
        // Fio de chuva inclinado: comprimento e opacidade próprios dão profundidade.
        const g = new pixi.Graphics();
        g.moveTo(0, 0).lineTo(-m.len * 0.12, m.len).stroke({ width: m.width, color: m.color, alpha: m.alpha });
        g.position.set(m.x, m.y);
        layer.addChild(g);
        owned.push(g);
        return g;
      });
      offs.push(
        stage.tick((t) => {
          // As velocidades são em px de tela por quadro; no canvas lógico cada px vale `p` de tela.
          stepMotes(motes, 'rain', (t.deltaTime * (spec.speed ?? 1)) / stage.metrics.p, w(), h());
          for (let i = 0; i < motes.length; i++) drops[i].position.set(motes[i].x, motes[i].y);
        }),
      );
    };

    const addEmbers = (spec: ParticleSpec) => {
      const motes: Mote[] = createMotes('embers', spec.count, w(), h());
      const dots = motes.map((m) => {
        const size = Math.max(1, Math.round(m.r * 0.6));
        const g = new pixi.Graphics().rect(0, 0, size, size).fill({ color: toHex(m.color) });
        g.position.set(m.x, m.y);
        layer.addChild(g);
        owned.push(g);
        return g;
      });
      offs.push(
        stage.tick((t) => {
          // Brasas em px de tela por quadro, como a chuva.
          stepMotes(motes, 'embers', (t.deltaTime * (spec.speed ?? 1)) / stage.metrics.p, w(), h());
          for (let i = 0; i < motes.length; i++) {
            dots[i].position.set(motes[i].x, motes[i].y);
            dots[i].alpha = motes[i].alpha;
          }
        }),
      );
    };

    const addFlakes = (kind: FlakeKind, spec: ParticleSpec) => {
      const flakes: Flake[] = createFlakes(kind, spec.count, w(), h());
      const dots = flakes.map((f) => {
        const g = new pixi.Graphics().rect(0, 0, f.size, f.size).fill({ color: f.color });
        g.position.set(f.x, f.y);
        g.alpha = f.alpha;
        layer.addChild(g);
        owned.push(g);
        return g;
      });
      offs.push(
        stage.tick((t) => {
          stepFlakes(flakes, kind, t.deltaTime, w(), h(), spec.speed ?? 1);
          for (let i = 0; i < flakes.length; i++) {
            dots[i].position.set(flakes[i].x, flakes[i].y);
            if (kind === 'fireflies') dots[i].alpha = flakes[i].alpha;
          }
        }),
      );
    };

    for (const spec of weather.particles) {
      if (spec.kind === 'rain') addRain(spec);
      else if (spec.kind === 'embers') addEmbers(spec);
      else addFlakes(spec.kind, spec);
    }

    return () => {
      if (stage.destroyed) return;
      for (const off of offs) off();
      for (const g of owned) g.destroy();
    };
  }, [stage, weather]);

  return null;
}
