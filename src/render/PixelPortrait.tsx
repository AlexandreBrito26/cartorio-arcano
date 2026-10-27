import { useEffect, useRef } from 'react';
import type { Graphics as PixiGraphics, Sprite as PixiSprite, Texture, TickerCallback } from 'pixi.js';
import type { Look } from '../game/types';
import { paletteInt } from './palette';
import { Portrait } from '../components/Portrait';
import { useStage } from './PixiStage';
import { PORTRAIT_H, PORTRAIT_W, emerge, portraitFit, travelerBox } from './stageLayout';
import { reduced } from './motion';
import {
  BREATHE_Y,
  FLOAT_ALPHA,
  FLOAT_Y,
  GLOW_ALPHA,
  NOD_Y,
  SHAKE_X,
  SMOKE_FRAMES,
  SPECIES_SLUG,
  SPLASH_FRAMES,
  WING_SCALE_X,
  frameIndex,
  isBlinking,
} from './characterAnim';

export type Reaction = 'approve' | 'deny' | undefined;

const W = PORTRAIT_W;
const H = PORTRAIT_H;

const tintOf = (hex: string) => parseInt(hex.slice(1), 16);

interface Props {
  look: Look;
  reaction?: Reaction;
}

/**
 * Viajante do balcão em pixel art, na camada `viajante` do PixiStage. Cada parte colorida é uma máscara branca
 * tingida com a cor do `look`; idle, piscada e as reações são quadros animados.
 * Reproduz o CSS antigo do `.st-traveler`: posição, brilho/saturação e a entrada `emerge`.
 * Sem WebGL, cai na silhueta em PNG (`Portrait`).
 */
export function PixelPortrait({ look, reaction }: Props) {
  const { stage, failed } = useStage();
  const reactionRef = useRef<Reaction>(reaction);
  reactionRef.current = reaction;

  useEffect(() => {
    if (!stage) return;
    const { app, pixi } = stage;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const { Container, Sprite, Graphics, Texture: PixiTexture, ColorMatrixFilter } = pixi;
      const { loadAtlas } = await import('./atlas'); // dinâmico: atlas.ts importa o pixi.js

      const slug = SPECIES_SLUG[look.species];
      const atlas = await loadAtlas(`/art/personagens/${slug}.json`);
      if (cancelled) return;

      // rig: âncora na base/centro da caixa do viajante; recebe a entrada, o filtro e o halo.
      const rig = new Container();
      stage.layers.viajante.addChild(rig);
      const filter = new ColorMatrixFilter();
      rig.filters = [filter];
      if (!reduced()) rig.alpha = 0; // começa invisível: a entrada (emerge) o revela

      // Brilho azulado em volta (era o drop-shadow do CSS): gradiente radial pré-desenhado.
      const gl = document.createElement('canvas');
      gl.width = gl.height = 128;
      const gctx = gl.getContext('2d');
      if (gctx) {
        const g = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(125,160,255,0.26)');
        g.addColorStop(1, 'rgba(125,160,255,0)');
        gctx.fillStyle = g;
        gctx.fillRect(0, 0, 128, 128);
      }
      const haloTex = PixiTexture.from(gl);
      haloTex.source.scaleMode = 'linear';
      const halo = new Sprite(haloTex);
      halo.anchor.set(0.5);
      rig.addChild(halo);

      const t = atlas.textures;
      const root = new Container();
      rig.addChild(root);

      const back = new Container();
      const body = new Container();
      root.addChild(back, body);

      const mk = (name: string, tint?: string, alpha = 1): PixiSprite => {
        const s = new Sprite(t[name] as Texture);
        if (tint) s.tint = tintOf(tint);
        s.alpha = alpha;
        return s;
      };

      const noHair = look.species === 'Golem' || look.species === 'Espectro';
      const isSpectre = look.species === 'Espectro';
      const isGolem = look.species === 'Golem';
      const isFada = look.species === 'Fada';

      // Asas ficam atrás do corpo.
      let wings: PixiSprite | undefined;
      if (isFada) {
        wings = mk('wings');
        wings.anchor.set(0.5, 0.5);
        wings.position.set(W / 2, H / 2);
        back.addChild(wings);
      }

      const cloak = mk('cloak', look.cloak, isSpectre ? 0.72 : 1);
      const skin = mk('skin', look.skin, isSpectre ? 0.72 : 1);
      const eyes = mk('eyes', look.eyes);
      const lid = mk('eyelid', look.skin);
      lid.visible = false;
      const details = mk('details', undefined, 1);
      const outline = mk('outline');
      body.addChild(cloak, skin);

      if (!noHair) {
        const hairName = look.hairStyle === 2 ? 'hair2' : look.hairStyle === 1 ? 'hair1' : 'hair0';
        body.addChild(mk(hairName, look.hair));
        if (look.beard) body.addChild(mk('beard', look.hair));
      }
      body.addChild(eyes, lid, details, outline);

      // Efeitos próprios: fumaça do Draconato e respingo do Tritão, desenhados por quadro.
      let fx: PixiGraphics | undefined;
      if (look.species === 'Draconato' || look.species === 'Tritão') {
        fx = new Graphics();
        root.addChild(fx);
      }
      let lastFx = -1;

      let anchorY = 0;
      const layout = () => {
        const box = travelerBox(app.screen.width, app.screen.height);
        const fit = portraitFit(box.w, box.h);
        anchorY = box.anchorY;
        rig.position.set(Math.round(box.anchorX), box.anchorY);
        root.scale.set(fit.scale);
        root.position.set(Math.round(-box.w / 2) + fit.x, -box.h + fit.y);
        halo.position.set(0, -box.h / 2);
        halo.width = halo.height = box.h * 1.7;
      };
      layout();
      const offLayout = stage.onLayout(layout);

      // Estado da reação: começa quando `reaction` muda e dura o tempo da sequência.
      let seenReaction: Reaction = undefined;
      let reactionAt = -Infinity;
      let elapsed = 0;
      let emergeMs = 0;
      let emerged = false;
      const isStill = reduced();

      const onTick: TickerCallback<unknown> = (ticker) => {
        elapsed += ticker.deltaMS;

        // Entrada do viajante (sem movimento reduzido): sobe, clareia e ganha opacidade.
        if (!emerged) {
          emergeMs += ticker.deltaMS;
          const e = isStill ? emerge(Infinity) : emerge(emergeMs);
          rig.alpha = e.alpha;
          rig.position.y = anchorY + e.dy / stage.metrics.p; // 18 px de CSS em pixels lógicos
          rig.scale.set(e.scale);
          filter.reset();
          filter.brightness(e.brightness, false);
          filter.saturate(-0.225, true); // saturate(0.85) do CSS
          emerged = e.done;
        }

        if (reactionRef.current !== seenReaction) {
          seenReaction = reactionRef.current;
          reactionAt = elapsed;
        }
        const now = isStill ? 0 : elapsed;

        // Corpo: idle por espécie.
        let dy = 0;
        let alphaBody = 1;
        if (isSpectre) {
          dy = FLOAT_Y[frameIndex(now, 5, FLOAT_Y.length, true)];
          alphaBody = FLOAT_ALPHA[frameIndex(now, 5, FLOAT_ALPHA.length, true)];
        } else if (!isGolem) {
          dy = BREATHE_Y[frameIndex(now, 4, BREATHE_Y.length, true)];
        }
        let dx = 0;

        // Reações (uma vez), sobrepõem o idle.
        const since = now - reactionAt;
        if (seenReaction === 'approve' && since >= 0 && since < NOD_Y.length * 100) {
          dy = NOD_Y[frameIndex(since, 10, NOD_Y.length, false)];
        } else if (seenReaction === 'deny' && since >= 0 && since < SHAKE_X.length * 83) {
          dx = SHAKE_X[frameIndex(since, 12, SHAKE_X.length, false)];
        }

        body.position.set(dx, dy);
        cloak.alpha = isSpectre ? alphaBody : 1;
        skin.alpha = isSpectre ? alphaBody : 1;

        // Golem: rachaduras brilham.
        if (isGolem) details.alpha = GLOW_ALPHA[frameIndex(now, 3, GLOW_ALPHA.length, true)];

        // Fada: asas batem.
        if (wings) wings.scale.set(WING_SCALE_X[frameIndex(now, 12, WING_SCALE_X.length, true)], 1);

        // Fumaça (Draconato) e respingo (Tritão): redesenha só quando muda de quadro.
        if (fx) {
          const isDrac = look.species === 'Draconato';
          const frames = isDrac ? SMOKE_FRAMES : SPLASH_FRAMES;
          const f = frameIndex(now, 6, frames.length, true);
          if (f !== lastFx) {
            lastFx = f;
            fx.clear();
            const color = paletteInt(isDrac ? 'nevoa-2' : 'mare-4');
            for (const [x, y, r] of frames[f]) fx.circle(x, y, r).fill({ color, alpha: 0.75 });
          }
        }

        // Piscada.
        lid.visible = !isStill && isBlinking(now);
      };
      const offTick = stage.tick(onTick);

      cleanup = () => {
        if (stage.destroyed) return; // o PixiStage já levou tudo
        offTick();
        offLayout();
        rig.destroy({ children: true });
        haloTex.destroy(true);
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
    // Um retrato por viajante: o Counter remonta com key={id}.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, look.species, look.skin, look.hair, look.eyes, look.cloak, look.hairStyle, look.beard]);

  if (failed) return <Portrait look={look} />;
  // O desenho está no canvas do balcão; aqui fica só o rótulo para leitores de tela.
  return <span className="pixel-portrait visually-hidden" role="img" aria-label={`Retrato de ${look.species}`} />;
}

