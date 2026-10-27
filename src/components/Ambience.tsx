import { useEffect, useRef } from 'react';
import { createMotes, stepMotes, type Mood, type Mote } from '../render/motes';
import { reduced } from '../render/motion';

interface Props {
  mood?: Mood;
  /** Quantidade de partículas. */
  count?: number;
  className?: string;
}

/**
 * Partículas flutuantes (brasas, névoa ou chuva) num canvas 2D transparente.
 * Canvas 2D não usa contexto WebGL nem baixa o PixiJS, então serve até na tela de título.
 */
export function Ambience({ mood = 'embers', count = 36, className }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || reduced()) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.style.cssText = 'display:block;width:100%;height:100%';
    el.appendChild(canvas);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let motes: Mote[] | null = null;

    const resize = () => {
      w = el.clientWidth;
      h = el.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      if (!motes && w > 0 && h > 0) motes = createMotes(mood, count, w, h);
    };
    resize();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    ro?.observe(el);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(3, (now - last) / (1000 / 60));
      last = now;
      if (!motes) return;
      stepMotes(motes, mood, dt, w, h);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        ctx.globalAlpha = m.alpha;
        if (mood === 'rain') {
          ctx.strokeStyle = m.color;
          ctx.lineWidth = m.width;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(m.x - m.len * 0.12, m.y + m.len);
          ctx.stroke();
        } else {
          ctx.fillStyle = m.color;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.remove();
    };
  }, [mood, count]);

  return <div ref={host} className={['ambience', className].filter(Boolean).join(' ')} aria-hidden="true" />;
}
