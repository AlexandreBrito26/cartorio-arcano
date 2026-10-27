import type { Application, Container, TickerCallback } from 'pixi.js';
import { bindTickerPolicy } from './motion';
import { fitCounter } from './stageLayout';

/** Camadas do balcão, de trás para a frente. */
export const LAYER_ORDER = ['fundo', 'viajante', 'chuva', 'frente'] as const;
export type LayerName = (typeof LAYER_ORDER)[number];

/** Escalas do momento: `p` (CSS px por pixel lógico) e `m` (pixels lógicos por pixel de arte da cena). */
export interface StageMetrics {
  p: number;
  m: number;
}

/** Um único Application do Pixi com uma Container por camada, em resolução interna fixa. */
export interface Stage {
  app: Application;
  pixi: typeof import('pixi.js');
  layers: Record<LayerName, Container>;
  /** O canvas é lógico (`app.screen`) e ampliado `p` vezes por CSS; todo desenho usa unidades lógicas. */
  readonly metrics: StageMetrics;
  /** Chamado depois de cada mudança de tamanho/escala; devolve quem cancela. */
  onLayout(fn: () => void): () => void;
  /** Registra uma função no ticker único do balcão; devolve quem a remove. */
  tick(fn: TickerCallback<unknown>): () => void;
  /** Verdadeiro depois de `destroy()`: quem limpa a própria camada deve ignorar o resto. */
  readonly destroyed: boolean;
  destroy(): void;
}

/** Cria o Application dentro de `host`. Devolve null quando não há WebGL. */
export async function createStage(host: HTMLElement): Promise<Stage | null> {
  const pixi = await import('pixi.js');
  const { configurePixelArt } = await import('./atlas');
  configurePixelArt(); // "nearest" vale para toda textura criada depois

  const first = fitCounter(host.clientWidth, host.clientHeight);
  const app = new pixi.Application();
  try {
    await app.init({
      width: first.lw,
      height: first.lh,
      backgroundAlpha: 0,
      antialias: false,
      roundPixels: true,
      // Resolução interna fixa: 1 pixel do canvas = 1 pixel lógico; quem amplia é o CSS.
      resolution: 1,
      autoDensity: false,
    });
  } catch {
    return null;
  }
  host.appendChild(app.canvas);
  const unbindPolicy = bindTickerPolicy(app); // limite de FPS e pausa com a aba oculta

  const layers = {} as Record<LayerName, Container>;
  for (const name of LAYER_ORDER) {
    const c = new pixi.Container();
    c.label = name;
    app.stage.addChild(c);
    layers[name] = c;
  }

  const metrics: StageMetrics = { p: first.p, m: first.m };
  const listeners = new Set<() => void>();
  const fit = () => {
    const f = fitCounter(host.clientWidth, host.clientHeight);
    metrics.p = f.p;
    metrics.m = f.m;
    app.renderer.resize(f.lw, f.lh);
    const css = app.canvas.style;
    css.width = `${f.lw * f.p}px`;
    css.height = `${f.lh * f.p}px`;
    for (const fn of [...listeners]) fn();
  };
  fit();
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(fit) : null;
  ro?.observe(host);

  let destroyed = false;
  return {
    app,
    pixi,
    layers,
    metrics,
    onLayout(fn) {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
    tick(fn) {
      app.ticker.add(fn);
      return () => {
        if (!destroyed) app.ticker.remove(fn);
      };
    },
    get destroyed() {
      return destroyed;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      ro?.disconnect();
      listeners.clear();
      unbindPolicy();
      app.destroy(true, { children: true }); // texturas ficam no cache do Assets
    },
  };
}
