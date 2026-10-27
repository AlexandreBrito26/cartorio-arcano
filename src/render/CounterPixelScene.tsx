import { useEffect, useRef } from 'react';
import type { Texture as PixiTexture, TickerCallback } from 'pixi.js';
import { flameScale, lampAngle, lightningAlpha, stampFrame } from './counterAnim';
import { useStage } from './PixiStage';
import { reduced } from './motion';

const W = 320;
const H = 80;

export type CounterLayer = 'back' | 'front';

type Reaction = 'approve' | 'deny' | undefined;

interface Props {
  /** `back` fica atrás do viajante; `front` fica na frente (divisória, lampião, carimbo). */
  layer: CounterLayer;
  /** Decisão tomada: o carimbo bate na mesa no mesmo instante do som. */
  reaction?: Reaction;
}

/**
 * Balcão em pixel art, em duas camadas do PixiStage que envolvem o viajante:
 * `back` (céu, torre, portão e névoa) e `front` (divisória de latão, lampião,
 * vela, sineta e carimbo animado, além do relâmpago).
 * A escala é o menor inteiro que cobre o palco, então não sobram faixas.
 * Não cria canvas: só adiciona e remove o seu Container na camada.
 */
export function CounterPixelScene({ layer, reaction }: Props) {
  const { stage } = useStage();
  const reactionRef = useRef<Reaction>(reaction);
  reactionRef.current = reaction;

  useEffect(() => {
    if (!stage) return;
    const { app, pixi } = stage;
    const { Container, Graphics, Sprite, Text, Texture, Rectangle, Assets } = pixi;
    let cancelled = false;
    const offs: Array<() => void> = [];

    const root = new Container();
    const scene = new Container();
    root.addChild(scene);
    stage.layers[layer === 'back' ? 'fundo' : 'frente'].addChild(root);

    const layout = () => {
      const w = app.screen.width;
      const h = app.screen.height;
      // Escala inteira `m` (menor que cobre o palco), em pixels lógicos: sem faixas nem fração.
      const m = stage.metrics.m;
      root.scale.set(m);
      root.position.set(Math.round((w - W * m) / 2), Math.round((h - H * m) / 2));
    };
    layout();
    const offLayout = stage.onLayout(layout);

    const base = '/art/balcao';
    const tick = (fn: TickerCallback<unknown>) => {
      offs.push(stage.tick(fn));
    };

    void (async () => {
      // Import dinâmico: atlas.ts importa o pixi.js, que não pode entrar no pacote inicial.
      const { loadAtlas, makePixelSprite } = await import('./atlas');
      if (cancelled) return;
      if (layer === 'back') {
        const [bgTex, mistTex, atlas] = await Promise.all([
          Assets.load<PixiTexture>(`${base}/counter-back.png`),
          Assets.load<PixiTexture>('/art/cutscene/fx-mist.png'),
          loadAtlas('/sprites/smoke-rune.json'),
        ]);
        if (cancelled) return;

        scene.addChild(new Sprite(bgTex));

        // Névoa rente ao chão, com alfa, passando devagar.
        const mists = [
          { y: 64, speed: 5, alpha: 0.16, offset: 0 },
          { y: 72, speed: 3, alpha: 0.12, offset: 110 },
        ].map((m) => {
          const s = new Sprite(mistTex);
          s.anchor.set(0.5);
          s.alpha = m.alpha;
          s.position.set(0, m.y);
          scene.addChild(s);
          return { s, ...m };
        });

        // Runa acesa no portão (mesma animação de 4 quadros da cutscene).
        const rune = makePixelSprite(atlas, 'pulse', 8);
        rune.anchor.set(0.5);
        rune.position.set(36, 34);
        scene.addChild(rune);

        // Janela da torre que pisca de leve.
        const window_ = new Graphics().rect(169, 41, 4, 5).fill({ color: 0xffd98a });
        scene.addChild(window_);

        let elapsed = 0;
        const isStill = reduced();
        tick((t) => {
          elapsed += t.deltaMS;
          const sec = isStill ? 0 : elapsed / 1000;
          for (const m of mists) {
            const span = W + 200;
            m.s.position.x = ((sec * m.speed + m.offset) % span) - 100;
          }
          window_.alpha = 0.7 + 0.3 * Math.sin(sec * 2.1);
        });
      } else {
        const [fgTex, lampTex, stampSheet] = await Promise.all([
          Assets.load<PixiTexture>(`${base}/counter-front.png`),
          Assets.load<PixiTexture>(`${base}/counter-lamp.png`),
          Assets.load<PixiTexture>(`${base}/counter-stamp.png`),
        ]);
        if (cancelled) return;

        scene.addChild(new Sprite(fgTex));

        // Placa do guichê, em Cinzel.
        const family = getComputedStyle(document.documentElement).getPropertyValue('--font-title').trim() || 'serif';
        const plaque = new Text({
          text: 'GUICHÊ DAS BRUMAS',
          style: { fontFamily: family, fontSize: 6, fill: 0xe0b44c, letterSpacing: 1 },
        });
        plaque.resolution = 6; // texto nítido mesmo com a escala inteira do palco
        plaque.anchor.set(0.5);
        plaque.position.set(160, 8);
        scene.addChild(plaque);

        // Lampião pendurado: pivô no topo da corrente, balanço leve e chama tremendo.
        const lamp = new Sprite(lampTex);
        lamp.anchor.set(0.5, 0);
        lamp.position.set(10, 0);
        const lampFlame = new Graphics().ellipse(7, 13, 1.6, 2.6).fill({ color: 0xffe9a8 });
        lamp.addChild(lampFlame);
        scene.addChild(lamp);

        // Vela sobre o balcão.
        const candleFlame = new Graphics().ellipse(0, 0, 1.2, 2.2).fill({ color: 0xffd36b });
        candleFlame.position.set(268, 50);
        scene.addChild(candleFlame);

        // Carimbo: 4 quadros, disparado pela decisão.
        const frames = [0, 1, 2, 3].map(
          (i) => new Texture({ source: stampSheet.source, frame: new Rectangle(i * 16, 0, 16, 18) }),
        );
        const stamp = new Sprite(frames[0]);
        stamp.anchor.set(0.5, 0);
        stamp.position.set(67, 48);
        scene.addChild(stamp);

        // Relâmpago: flash azulado e um traço de raio.
        const flash = new Graphics().rect(0, 0, W, H).fill({ color: 0xb9ccff });
        flash.alpha = 0;
        const bolt = new Graphics()
          .moveTo(203, 0).lineTo(196, 18).lineTo(203, 19).lineTo(186, 40).lineTo(192, 41).lineTo(175, 60)
          .stroke({ width: 1, color: 0xe8f0ff });
        bolt.alpha = 0;
        scene.addChild(flash, bolt);

        let elapsed = 0;
        let decisionAt: number | null = null;
        let seenReaction: Reaction = undefined;
        const isStill = reduced();

        tick((t) => {
          elapsed += t.deltaMS;
          // Relógio de parede: o carimbo é medido do mesmo instante em que o som foi disparado.
          const now = performance.now();
          if (reactionRef.current !== seenReaction) {
            seenReaction = reactionRef.current;
            decisionAt = seenReaction ? now : null;
          }
          const sec = isStill ? 0 : elapsed / 1000;

          lamp.rotation = isStill ? 0 : lampAngle(sec);
          lampFlame.scale.set(1, flameScale(sec));
          candleFlame.scale.set(1, flameScale(sec + 1.7));

          const ms = decisionAt === null ? null : now - decisionAt;
          stamp.texture = frames[isStill ? 0 : stampFrame(ms)];

          const a = isStill ? 0 : lightningAlpha(sec);
          flash.alpha = a;
          bolt.alpha = a > 0.25 ? 1 : 0;
        });
      }
    })();

    return () => {
      cancelled = true;
      if (stage.destroyed) return; // o PixiStage já levou tudo
      for (const off of offs) off();
      offLayout();
      root.destroy({ children: true });
    };
  }, [stage, layer]);

  return null;
}
