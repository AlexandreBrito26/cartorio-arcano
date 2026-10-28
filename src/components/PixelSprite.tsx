import type { CSSProperties } from 'react';

interface Props {
  /** Folha horizontal em public/ (N quadros lado a lado). */
  src: string;
  frames: number;
  /** Tamanho de um quadro, em pixels de arte. */
  w: number;
  h: number;
  /** Pixels de tela por pixel de arte (inteiro, para manter a nitidez). */
  scale?: number;
  fps?: number;
  /** Toca uma vez e para no último quadro (efeitos), em vez de repetir. */
  once?: boolean;
  className?: string;
  /** Texto alternativo; sem ele, o sprite é decorativo. */
  label?: string;
}

/** Duração de um ciclo, em segundos. */
export const spriteDuration = (frames: number, fps: number) => frames / fps;

/** Sprite animado por CSS (`steps()`): sem canvas, sem Pixi. Com movimento reduzido fica no 1º quadro. */
export function PixelSprite({ src, frames, w, h, scale = 3, fps = 6, once = false, className, label }: Props) {
  const style = {
    '--sprite': `url(${src})`,
    '--frames': frames,
    '--fw': `${w * scale}px`,
    '--fh': `${h * scale}px`,
    '--dur': `${spriteDuration(frames, fps)}s`,
    '--iter': once ? 1 : 'infinite',
    '--fill': once ? 'forwards' : 'none',
  } as CSSProperties;

  return (
    <span
      className={`pixel-sprite${className ? ` ${className}` : ''}`}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
