import { useEffect } from 'react';
import type { Graphics as PixiGraphics, TickerCallback } from 'pixi.js';
import { createMotes, stepMotes } from './motes';
import { useStage } from './PixiStage';
import { reduced } from './motion';

/**
 * Chuva do balcão, na camada `chuva` do PixiStage (entre o viajante e a divisória).
 * A simulação é a mesma do Ambience (render/motes.ts); aqui cada gota é um Graphics
 * estático que só muda de posição. No canvas lógico a gota fica `p` vezes mais grossa, como pixel art.
 */
export function RainLayer({ count = 90 }: { count?: number }) {
  const { stage } = useStage();

  useEffect(() => {
    if (!stage || reduced()) return;
    const { app, pixi } = stage;
    const layer = stage.layers.chuva;
    layer.alpha = 0.9;

    const motes = createMotes('rain', count, app.screen.width, app.screen.height);
    const drops: PixiGraphics[] = motes.map((m) => {
      // Fio de chuva inclinado: comprimento e opacidade próprios dão profundidade.
      const g = new pixi.Graphics();
      g.moveTo(0, 0).lineTo(-m.len * 0.12, m.len).stroke({ width: m.width, color: m.color, alpha: m.alpha });
      g.position.set(m.x, m.y);
      layer.addChild(g);
      return g;
    });

    const onTick: TickerCallback<unknown> = (t) => {
      // As velocidades são em px de tela por quadro; no canvas lógico cada px vale `p` de tela.
      stepMotes(motes, 'rain', t.deltaTime / stage.metrics.p, app.screen.width, app.screen.height);
      for (let i = 0; i < motes.length; i++) drops[i].position.set(motes[i].x, motes[i].y);
    };
    const off = stage.tick(onTick);

    return () => {
      if (stage.destroyed) return;
      off();
      for (const g of drops) g.destroy();
    };
  }, [stage, count]);

  return null;
}
