/** Relógio do balcão, em milissegundos. Funções puras, testadas. */

/** Balanço do lampião: ângulo em radianos (±0,06 rad, ~1,1 rad/s). */
export function lampAngle(seconds: number): number {
  return 0.06 * Math.sin(seconds * 1.1);
}

/** Tremor da chama (vela e lampião): escala vertical de 0,85 a 1,15. */
export function flameScale(seconds: number): number {
  return 1 + 0.15 * Math.sin(seconds * 9.3) * Math.sin(seconds * 3.7 + 1.2);
}

/** Quadro do carimbo depois de uma decisão: impacto, volta e então repouso (0). */
export const STAMP_IMPACT_FRAME = 2;
export function stampFrame(msSinceDecision: number | null): number {
  if (msSinceDecision === null || msSinceDecision < 0) return 0;
  if (msSinceDecision < 110) return 2; // impacto, junto com o som
  if (msSinceDecision < 220) return 3; // a base volta
  if (msSinceDecision < 300) return 1; // sobe um pouco
  return 0;
}

/** Relâmpago: começa aos 4 s e repete a cada 11 s, com dois pulsos de brilho. */
export function lightningAlpha(seconds: number): number {
  if (seconds < 4) return 0;
  const t = (seconds - 4) * 1000 % 11000;
  if (t < 150) return 0.35;
  if (t >= 220 && t < 300) return 0.2;
  return 0;
}
