import type { Look } from '../game/types';

const HAIR_BACK = 'M29 52 C22 96 30 112 42 112 L78 112 C90 112 98 96 91 52 Z';
const HAIR_CAP = 'M31 56 C28 22 92 22 89 56 C82 42 70 36 60 36 C50 36 38 42 31 56 Z';
const BEARD = 'M33 64 C32 110 88 110 87 64 C80 82 40 82 33 64 Z';

function Ears({ look }: { look: Look }) {
  const { species, skin } = look;
  if (species === 'Elfo') {
    return (
      <>
        <path d="M33 56 L8 42 L34 72 Z" fill={skin} />
        <path d="M87 56 L112 42 L86 72 Z" fill={skin} />
      </>
    );
  }
  if (species === 'Goblin') {
    return (
      <>
        <path d="M33 54 L2 34 L35 78 Z" fill={skin} />
        <path d="M87 54 L118 34 L85 78 Z" fill={skin} />
      </>
    );
  }
  if (species === 'Tritão') {
    return (
      <>
        <path d="M33 58 L10 50 L10 74 L34 72 Z" fill="#7fc8b8" />
        <path d="M87 58 L110 50 L110 74 L86 72 Z" fill="#7fc8b8" />
      </>
    );
  }
  if (species === 'Golem') {
    return (
      <>
        <rect x="24" y="54" width="12" height="18" rx="2" fill={skin} />
        <rect x="84" y="54" width="12" height="18" rx="2" fill={skin} />
      </>
    );
  }
  if (species === 'Espectro') {
    return null;
  }
  if (species === 'Fada') {
    return (
      <>
        <path d="M33 58 L16 48 L34 70 Z" fill={skin} />
        <path d="M87 58 L104 48 L86 70 Z" fill={skin} />
      </>
    );
  }
  return (
    <>
      <circle cx="32" cy="62" r="7" fill={skin} />
      <circle cx="88" cy="62" r="7" fill={skin} />
    </>
  );
}

/** Retrato desenhado em SVG: cada espécie tem silhueta própria. */
export function Portrait({ look }: { look: Look }) {
  const { species, skin, hair, eyes, cloak, hairStyle, beard } = look;
  const noHair = species === 'Golem' || species === 'Espectro';
  const isGolem = species === 'Golem';
  const isSpectre = species === 'Espectro';
  const hasBeard = beard && !noHair;

  return (
    <svg viewBox="0 0 120 140" className="portrait" role="img" aria-label={`Retrato de ${species}`}>
      {species === 'Fada' && (
        <>
          <ellipse cx="18" cy="92" rx="15" ry="30" fill="#bfe9ff" opacity="0.55" transform="rotate(-22 18 92)" />
          <ellipse cx="102" cy="92" rx="15" ry="30" fill="#bfe9ff" opacity="0.55" transform="rotate(22 102 92)" />
        </>
      )}
      {isSpectre && (
        <path d="M8 140 C20 128 26 136 34 128 C44 138 52 128 60 136 C68 128 76 138 86 128 C94 136 100 128 112 140 Z" fill="#c7bfe0" opacity="0.45" />
      )}
      {!noHair && hairStyle === 1 && <path d={HAIR_BACK} fill={hair} />}
      <path d="M8 140 C8 110 34 98 60 100 C86 98 112 110 112 140 Z" fill={cloak} />
      <path d="M46 99 L60 120 L74 99 Z" fill="#00000030" />
      <rect x="50" y="84" width="20" height="20" rx="6" fill={skin} />
      <Ears look={look} />
      {isGolem ? (
        <>
          <rect x="34" y="28" width="52" height="62" rx="6" fill={skin} />
          <path d="M44 40 L52 52 L46 62 M76 46 L70 58 L78 66" stroke="#00000055" strokeWidth="1.6" fill="none" />
        </>
      ) : (
        <ellipse cx="60" cy="58" rx="28" ry="32" fill={skin} opacity={isSpectre ? 0.72 : 1} />
      )}

      {species === 'Draconato' && (
        <>
          <path d="M42 34 L38 14 L50 28 Z" fill="#e8d9a8" />
          <path d="M78 34 L82 14 L70 28 Z" fill="#e8d9a8" />
          <circle cx="40" cy="70" r="2" fill="#00000033" />
          <circle cx="80" cy="70" r="2" fill="#00000033" />
          <circle cx="60" cy="78" r="2" fill="#00000033" />
        </>
      )}

      {species === 'Tritão' && (
        <>
          <path d="M44 84 L38 92 M40 84 L35 94 M76 84 L82 92 M80 84 L85 94" stroke="#3d8fa3" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {noHair ? null : hairStyle === 2 ? (
        [34, 46, 58, 70, 82].map((cx, i) => (
          <circle key={cx} cx={cx} cy={i % 2 ? 32 : 36} r="11" fill={hair} />
        ))
      ) : (
        <path d={HAIR_CAP} fill={hair} />
      )}

      {hasBeard && <path d={BEARD} fill={hair} />}

      <ellipse cx="48" cy="60" rx="5" ry="4" fill="#fff" />
      <ellipse cx="72" cy="60" rx="5" ry="4" fill="#fff" />
      <circle cx="48" cy="60" r="2.6" fill={eyes} />
      <circle cx="72" cy="60" r="2.6" fill={eyes} />
      <path d="M41 52 L55 51 M65 51 L79 52" stroke="#00000066" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 76 Q60 80 68 76" stroke="#5b2f2f" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
