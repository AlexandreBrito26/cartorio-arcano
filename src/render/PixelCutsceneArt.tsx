import { useEffect, useRef } from 'react';
import type { Texture } from 'pixi.js';
import type { SceneArt as SceneKind, SceneCamera } from '../game/cutscene';
import { STAMP_IMPACT_MS } from '../game/cutscene';
import { bindTickerPolicy, reduced } from './motion';
import { fitCutscene } from './stageLayout';
import {
  ART_H,
  ART_W,
  CAM_EASE,
  applyXf,
  cameraDurationMs,
  layerTransform,
  rootTransform,
  type LayerDepth,
} from './cutsceneCamera';

/** Margem da arte em cada lado (ver tools/gen_cutscene_art.py). */
const M = 24;

interface Props {
  art: SceneKind;
  camera: SceneCamera;
  focus: { x: number; y: number };
  /** Instante (ms desde a entrada da cena) do impacto do carimbo; só a cena `stamp` usa. */
  impactMs?: number;
}

/** Cena da abertura em PixiJS: três camadas de parallax, câmera do CSS portada e efeitos. */
export function PixelCutsceneArt({ art, camera, focus, impactMs }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    // Relógio da cena: começa na montagem, junto das animações CSS e dos sons,
    // e não quando as texturas terminam de carregar. Assim o carimbo bate no mesmo ms.
    const t0 = performance.now();

    void (async () => {
      const { Application, Container, Sprite, Graphics, Assets } = await import('pixi.js');
      const { configurePixelArt, loadAtlas, makePixelSprite } = await import('./atlas');
      if (cancelled) return;
      configurePixelArt();

      const app = new Application();
      try {
        await app.init({
          width: Math.max(1, el.clientWidth),
          height: Math.max(1, el.clientHeight),
          backgroundAlpha: 0,
          antialias: false,
          roundPixels: true,
          // Resolução interna fixa: o canvas é lógico e o CSS o amplia `p` vezes (render/stageLayout.ts).
          resolution: 1,
          autoDensity: false,
        });
      } catch {
        return; // sem WebGL: a cena fica vazia e o texto segue
      }
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }
      el.appendChild(app.canvas);
      const unbindPolicy = bindTickerPolicy(app);

      const base = `/art/cutscene/${art}`;
      const depths: LayerDepth[] = ['far', 'mid', 'near'];
      const textures = await Promise.all(depths.map((d) => Assets.load<Texture>(`${base}-${d}.png`)));
      const mist = await Assets.load<Texture>('/art/cutscene/fx-mist.png');
      const stampTex = await Assets.load<Texture>('/art/cutscene/fx-stamp.png');
      const runeAtlas = await loadAtlas('/sprites/smoke-rune.json');
      if (cancelled) {
        app.destroy(true, { children: true });
        return;
      }

      const screen = new Container();
      app.stage.addChild(screen);
      const cam = new Container();
      screen.addChild(cam);

      const origin = { x: (focus.x / 100) * ART_W, y: (focus.y / 100) * ART_H };
      const layers = depths.map((depth, i) => {
        const c = new Container();
        const sprite = new Sprite(textures[i]);
        sprite.position.set(-M, -M);
        c.addChild(sprite);
        cam.addChild(c);
        return { depth, c };
      });

      // Efeitos por cena, todos dentro das camadas da arte (mesmo parallax).
      const midLayer = layers.find((l) => l.depth === 'mid')!.c;
      const nearLayer = layers.find((l) => l.depth === 'near')!.c;
      const midFx = new Container();
      midLayer.addChild(midFx);
      const fx: Array<(seconds: number) => void> = [];

      if (art === 'road' || art === 'gate') {
        const sx = art === 'road' ? 172 : 160;
        const sy = art === 'road' ? 86 : 64;
        const scale = art === 'road' ? 1 : 3;
        const rune = makePixelSprite(runeAtlas, 'pulse', 8);
        rune.anchor.set(0.5);
        rune.position.set(sx, sy);
        rune.scale.set(scale);
        midFx.addChild(rune);
      }
      if (art === 'road') {
        const speeds = [9, 14];
        const ys = [124, 138];
        for (let i = 0; i < 2; i++) {
          const s = new Sprite(mist);
          s.alpha = 0.55;
          s.anchor.set(0.5);
          midFx.addChild(s);
          fx.push((sec) => {
            const span = ART_W + 200;
            const x = ((sec * speeds[i] + i * 110) % span) - 100;
            s.position.set(x, ys[i]);
          });
        }
      }
      if (art === 'office') {
        const flame = new Graphics()
          .ellipse(0, 0, 2.2, 3.2)
          .fill({ color: 0xffe9a8 });
        flame.position.set(62, 101);
        nearLayer.addChild(flame);
        fx.push((sec) => {
          flame.scale.set(1, 0.9 + 0.2 * Math.sin(sec * 9));
        });
      }
      if (art === 'stamp') {
        const st = new Sprite(stampTex);
        st.anchor.set(0.5, 0);
        st.position.set(160, -60);
        st.visible = false;
        nearLayer.addChild(st);
        const impact = impactMs ?? STAMP_IMPACT_MS;
        const drop = 260;
        fx.push((sec) => {
          const ms = sec * 1000;
          if (ms < impact - drop) {
            st.visible = false;
            return;
          }
          st.visible = true;
          const k = Math.min(1, (ms - (impact - drop)) / drop);
          const eased = k * k; // cai acelerando, como o carimbo
          st.position.set(160, -60 + (112 + 60) * eased);
        });
      }

      const layout = () => {
        const f = fitCutscene(el.clientWidth, el.clientHeight, ART_W, ART_H);
        app.renderer.resize(f.lw, f.lh);
        app.canvas.style.width = `${f.lw * f.p}px`;
        app.canvas.style.height = `${f.lh * f.p}px`;
        screen.scale.set(f.artScale);
        screen.position.set((f.lw - ART_W * f.artScale) / 2, (f.lh - ART_H * f.artScale) / 2);
      };
      layout();
      const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(layout) : null;
      ro?.observe(el);

      const dur = cameraDurationMs(camera);
      const isReduced = reduced();

      app.ticker.add(() => {
        const elapsed = performance.now() - t0;
        const sec = elapsed / 1000;
        const p = isReduced || dur === 0 ? 1 : Math.min(1, elapsed / dur);
        const e = CAM_EASE(p);

        applyXf(cam, origin, rootTransform(camera, e));
        for (const l of layers) applyXf(l.c, origin, layerTransform(camera, l.depth, e));
        for (const f of fx) f(isReduced ? 0 : sec);
      });

      cleanup = () => {
        unbindPolicy();
        ro?.disconnect();
        app.destroy(true, { children: true });
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [art, camera, focus.x, focus.y, impactMs]);

  return <div ref={host} className="pixel-cutscene" aria-hidden="true" />;
}
