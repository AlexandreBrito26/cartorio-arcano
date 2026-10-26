import { useId } from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  /** Quando informado, a logo vira uma imagem com rótulo; senão é decorativa. */
  title?: string;
}

/**
 * Logo do Cartório Arcano: um selo de cartório (anel dourado) com o portão da
 * fronteira, uma estrela-runa acesa no vão e o carimbo vermelho na soleira.
 */
export function Logo({ size = 96, className, title }: LogoProps) {
  const uid = useId();
  const glow = `${uid}-glow`;
  const gold = `${uid}-gold`;
  const dots = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return { x: 60 + Math.cos(a) * 46, y: 60 + Math.sin(a) * 46, big: i % 6 === 0 };
  });

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={['logo', className].filter(Boolean).join(' ')}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <radialGradient id={glow} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffe9a8" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e0b44c" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d87a" />
          <stop offset="1" stopColor="#b98a2a" />
        </linearGradient>
      </defs>

      <circle cx="60" cy="60" r="56" fill="#120e24" stroke={`url(#${gold})`} strokeWidth="5" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.big ? 2 : 1} fill="#e0b44c" opacity={d.big ? 1 : 0.7} />
      ))}

      {/* portão: moldura de pedra e vão escuro */}
      <path d="M34 92 V56 A26 26 0 0 1 86 56 V92 Z" fill="#f1e4c3" />
      <path d="M42 92 V57 A18 18 0 0 1 78 57 V92 Z" fill="#2b1d17" />
      <path d="M60 31 L63 36 H57 Z" fill="#b23a48" />

      {/* brilho e estrela-runa */}
      <circle className="logo-glow" cx="60" cy="58" r="20" fill={`url(#${glow})`} />
      <path
        className="logo-star"
        d="M60 40 L63.5 52 L76 56 L63.5 60 L60 72 L56.5 60 L44 56 L56.5 52 Z"
        fill={`url(#${gold})`}
      />

      {/* soleira com o carimbo */}
      <rect x="28" y="92" width="64" height="7" rx="2" fill="#b23a48" />
      <rect x="28" y="92" width="64" height="2" rx="1" fill="#ffffff33" />
    </svg>
  );
}
