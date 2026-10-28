import { useEffect, useRef } from 'react';
import { dressLook, type Suit } from '../game/suits';
import type { Look } from '../game/types';
import { SPECIES_SLUG } from '../render/characterAnim';

/** Três viajantes de exemplo, para ver o traje antes de comprar. */
const SAMPLES: readonly Look[] = [
  { species: 'Humano', skin: '#e0b08c', hair: '#5a3a22', eyes: '#3a6a9a', cloak: '#7a3b3b', hairStyle: 1, beard: true },
  { species: 'Elfo', skin: '#f0d4b4', hair: '#d8c27a', eyes: '#4a9a5a', cloak: '#3a5a7a', hairStyle: 2, beard: false },
  { species: 'Goblin', skin: '#7aa84a', hair: '#2a2a1a', eyes: '#d8b43a', cloak: '#6a4a2a', hairStyle: 0, beard: false },
];

interface Atlas {
  img: HTMLImageElement;
  frames: Record<string, { x: number; y: number; w: number; h: number }>;
}

const cache = new Map<string, Promise<Atlas>>();

/** Carrega a folha de uma espécie (PNG + JSON de quadros), uma vez só. */
function loadSheet(slug: string): Promise<Atlas> {
  let p = cache.get(slug);
  if (!p) {
    p = (async () => {
      const meta = (await (await fetch(`/art/personagens/${slug}.json`)).json()) as {
        frames: Array<{ name: string; x: number; y: number; w: number; h: number }>;
      };
      const img = new Image();
      img.src = `/art/personagens/${slug}.png`;
      await img.decode();
      return { img, frames: Object.fromEntries(meta.frames.map((f) => [f.name, f])) };
    })();
    p.catch(() => cache.delete(slug)); // permite tentar de novo se a rede falhou
    cache.set(slug, p);
  }
  return p;
}

const W = 64;
const H = 72;

/**
 * Desenha um viajante no canvas 2D, camada por camada, igual ao retrato do balcão:
 * cada máscara branca é tingida com a cor do look (`source-in`), as demais entram como estão.
 */
async function drawTraveler(canvas: HTMLCanvasElement, look: Look) {
  const sheet = await loadSheet(SPECIES_SLUG[look.species]);
  const ctx = canvas.getContext('2d');
  const tmp = document.createElement('canvas');
  tmp.width = W;
  tmp.height = H;
  const t = tmp.getContext('2d');
  if (!ctx || !t) return;
  ctx.clearRect(0, 0, W, H);

  const noHair = look.species === 'Golem' || look.species === 'Espectro';
  const layers: Array<[string, string | undefined]> = [
    ['cloak', look.cloak],
    ['skin', look.skin],
    ['shade', undefined],
    ...(noHair ? [] : ([[`hair${look.hairStyle}`, look.hair], ...(look.beard ? [['beard', look.hair]] : [])] as Array<[string, string]>)),
    ['eyes', look.eyes],
    ['eyewhite', undefined],
    ['details', undefined],
    ['outline', undefined],
  ];

  for (const [name, tint] of layers) {
    const f = sheet.frames[name];
    if (!f) continue;
    if (!tint) {
      ctx.drawImage(sheet.img, f.x, f.y, f.w, f.h, 0, 0, W, H);
      continue;
    }
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, W, H);
    t.drawImage(sheet.img, f.x, f.y, f.w, f.h, 0, 0, W, H);
    t.globalCompositeOperation = 'source-in';
    t.fillStyle = tint;
    t.fillRect(0, 0, W, H);
    ctx.drawImage(tmp, 0, 0);
  }
}

/** Prévia de um traje: os três viajantes de exemplo vestidos com ele. */
export function SuitSamples({ suit }: { suit: Suit }) {
  const refs = useRef<Array<HTMLCanvasElement | null>>([]);

  useEffect(() => {
    let cancelled = false;
    SAMPLES.forEach((look, i) => {
      const canvas = refs.current[i];
      if (!canvas) return;
      void drawTraveler(canvas, dressLook(look, suit)).catch(() => {
        if (!cancelled) canvas.getContext('2d')?.clearRect(0, 0, W, H);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [suit]);

  return (
    <div className="suit-samples" aria-hidden="true" style={{ ['--suit-halo' as string]: suit.halo }}>
      {SAMPLES.map((look, i) => (
        <canvas
          key={look.species}
          ref={(el) => {
            refs.current[i] = el;
          }}
          width={W}
          height={H}
        />
      ))}
    </div>
  );
}
