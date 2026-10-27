/**
 * Animação de entrada da logo: partículas de 1 px se juntam no contorno do portão.
 * Coordenadas do próprio selo (origem no centro), como em PixiLogo.
 */
export interface Pt {
  x: number;
  y: number;
}

/** Contorno do portão do selo: arco em meia-volta, lados retos e a soleira. */
export function gateTargets(): Pt[] {
  const cx = 0;
  const cy = -10; // centro do arco, como no selo
  const r = 50;
  const baseY = 62; // soleira, como no selo
  const pts: Pt[] = [];
  const steps = 48;
  // arco de 180° a 360°
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI + (i / steps) * Math.PI;
    pts.push({ x: Math.round(cx + Math.cos(a) * r), y: Math.round(cy + Math.sin(a) * r) });
  }
  // lados até a soleira
  for (let y = cy; y <= baseY; y += 2) {
    pts.push({ x: cx - r, y });
    pts.push({ x: cx + r, y });
  }
  // soleira
  for (let x = cx - r; x <= cx + r; x += 2) pts.push({ x, y: baseY });
  // remove repetidos
  const seen = new Set<string>();
  return pts.filter((p) => {
    const k = `${p.x},${p.y}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Easing que desacelera ao chegar. */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

/** Posição de uma partícula no instante `s` (segundos), dado o início e o alvo. */
export function particleAt(start: Pt, target: Pt, delay: number, duration: number, s: number): Pt {
  const t = easeOutCubic((s - delay) / duration);
  return {
    x: start.x + (target.x - start.x) * t,
    y: start.y + (target.y - start.y) * t,
  };
}
