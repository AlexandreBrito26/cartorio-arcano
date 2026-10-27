import { useEffect, useRef } from 'react';
import { Logo } from './Logo';
import { easeOutCubic, gateTargets, particleAt } from '../render/formation';
import { reduced } from '../render/motion';

const NAME = 'Cartório das Brumas';
const W = 480;
const H = 300;

/**
 * Logo do jogo em canvas 2D: o selo do portão com a estrela-runa pulsando, névoa passando
 * atrás e o nome em Cinzel. Não usa WebGL nem PixiJS, então abre junto com o título.
 * Sem canvas ou com movimento reduzido, fica o selo estático em PNG (<Logo />).
 */
export function CanvasLogo({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el || reduced()) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // fica o selo em PNG de reserva

    canvas.style.cssText = 'display:block;width:100%;height:100%';
    el.appendChild(canvas);
    el.classList.add('canvas-logo-live');

    let seed = 11;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const formation = gateTargets().map((target) => {
      const a = rnd() * Math.PI * 2;
      const r = 150 * Math.sqrt(rnd());
      return {
        start: { x: Math.cos(a) * r, y: Math.sin(a) * r },
        target,
        delay: 0.2 + rnd() * 1.0,
        dur: 2.0 + rnd() * 0.8,
      };
    });

    const star: [number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 22 : 7;
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      star.push([Math.cos(a) * r, Math.sin(a) * r - 6]);
    }
    const family = getComputedStyle(document.documentElement).getPropertyValue('--font-title').trim() || 'serif';

    let cw = 0;
    let ch = 0;
    let dpr = 1;
    const resize = () => {
      cw = el.clientWidth;
      ch = el.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(cw * dpr));
      canvas.height = Math.max(1, Math.round(ch * dpr));
    };
    resize();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    ro?.observe(el);

    const drawSeal = () => {
      ctx.beginPath();
      ctx.arc(0, 0, 118, 0, Math.PI * 2);
      ctx.fillStyle = '#120e24';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#c9a040';
      ctx.stroke();
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.globalAlpha = i % 6 === 0 ? 1 : 0.7;
        ctx.fillStyle = '#e0b44c';
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 100, Math.sin(a) * 100, i % 6 === 0 ? 3 : 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      // Portão: moldura de pedra e vão escuro, com o carimbo vermelho na soleira.
      const gate = (half: number, top: number, color: string) => {
        ctx.beginPath();
        ctx.moveTo(-half, 62);
        ctx.lineTo(-half, top);
        ctx.arc(0, top, half, Math.PI, 0);
        ctx.lineTo(half, 62);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      };
      gate(50, -10, '#f1e4c3');
      gate(38, -8, '#2b1d17');
      ctx.fillStyle = '#b23a48';
      ctx.fillRect(-58, 62, 116, 10);
    };

    let raf = 0;
    let t = 0;
    let sec = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dtSec = Math.min(0.1, (now - last) / 1000);
      last = now;
      sec += dtSec;
      t += dtSec * 1.8; // 0,03 por quadro a 60 fps

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);
      const s = Math.min(cw / W, ch / H);
      ctx.translate(cw / 2, (ch - H * s) / 2 + 120 * s);
      ctx.scale(s, s);

      // Partículas de 1 px se juntam no contorno do portão.
      const particlesAlpha = sec > 3.2 ? Math.max(0, 1 - (sec - 3.2) / 0.6) : 1;
      if (particlesAlpha > 0) {
        ctx.fillStyle = '#e0b44c';
        ctx.globalAlpha = 0.9 * particlesAlpha;
        for (const f of formation) {
          const p = particleAt(f.start, f.target, f.delay, f.dur, sec);
          ctx.fillRect(p.x, p.y, 1, 1);
        }
      }

      // O selo aparece quando as partículas já estão no contorno.
      const emblem = easeOutCubic((sec - 2.0) / 0.8);
      if (emblem > 0) {
        ctx.globalAlpha = emblem;
        drawSeal();
        const pulse = 0.5 + 0.5 * Math.sin(t);
        // Brilho e estrela-runa, que pulsam.
        ctx.globalAlpha = emblem * (0.25 + 0.25 * pulse) * 0.35;
        ctx.fillStyle = '#ffe9a8';
        ctx.beginPath();
        ctx.arc(0, -6, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = emblem;
        ctx.save();
        const k = 0.95 + 0.07 * pulse;
        ctx.scale(k, k);
        ctx.beginPath();
        star.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fillStyle = '#f6d87a';
        ctx.fill();
        ctx.restore();
        // Névoa: faixas translúcidas que passam pela base do selo.
        ctx.fillStyle = '#a79fc9';
        ctx.globalAlpha = emblem * 0.12;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.ellipse(Math.sin(t * (0.25 + i * 0.12)) * 40, 80 + i * 14, 90 + i * 20, 9 + i * 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Nome do jogo, em Cinzel quando a fonte estiver disponível.
      ctx.globalAlpha = 1;
      ctx.font = `600 40px ${family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '3px';
      ctx.fillStyle = '#f6d87a';
      ctx.fillText(NAME, 0, 146);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.remove();
      el.classList.remove('canvas-logo-live');
    };
  }, []);

  return (
    <div ref={host} className={['canvas-logo', className].filter(Boolean).join(' ')} role="img" aria-label={NAME}>
      <Logo size={128} className="canvas-logo-fallback" />
    </div>
  );
}
