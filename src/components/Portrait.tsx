import type { Look } from '../game/types';
import { SPECIES_SLUG } from '../render/characterAnim';

/**
 * Silhueta de reserva do viajante, sem WebGL: a camada de contorno da folha de
 * personagem (pixel art), sem tint. Só usada quando o PixiJS não inicializa.
 */
export function Portrait({ look }: { look: Look }) {
  const slug = SPECIES_SLUG[look.species];
  const OUTLINE_INDEX = 10; // ordem das camadas em tools/gen_characters.py
  const SCALE = 2;
  return (
    <div
      className="portrait-fallback"
      role="img"
      aria-label={`Retrato de ${look.species}`}
      style={{
        width: 64 * SCALE,
        height: 72 * SCALE,
        backgroundImage: `url(/art/personagens/${slug}.png)`,
        backgroundSize: `${11 * 64 * SCALE}px ${72 * SCALE}px`,
        backgroundPosition: `${-OUTLINE_INDEX * 64 * SCALE}px 0`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
