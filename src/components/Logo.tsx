interface LogoProps {
  size?: number;
  className?: string;
  /** Quando informado, a logo vira uma imagem com rótulo; senão é decorativa. */
  title?: string;
}

/** Selo do cartório em pixel art (PNG). Sem SVG: a tela inteira fica em pixel. */
export function Logo({ size = 96, className, title }: LogoProps) {
  return (
    <img
      src="/art/ui/logo-seal.png"
      width={size}
      height={size}
      alt=""
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={['logo', className].filter(Boolean).join(' ')}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
