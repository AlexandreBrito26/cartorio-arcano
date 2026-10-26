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

  return (
    <svg viewBox="0 0 120 140" className="portrait" role="img" aria-label={`Retrato de ${species}`}>
      {species === 'Fada' && (
        <>
          <ellipse cx="18" cy="92" rx="15" ry="30" fill="#bfe9ff" opacity="0.55" transform="rotate(-22 18 92)" />
          <ellipse cx="102" cy="92" rx="15" ry="30" fill="#bfe9ff" opacity="0.55" transform="rotate(22 102 92)" />
        </>
      )}
      {hairStyle === 1 && <path d={HAIR_BACK} fill={hair} />}
      <path d="M8 140 C8 110 34 98 60 100 C86 98 112 110 112 140 Z" fill={cloak} />
      <path d="M46 99 L60 120 L74 99 Z" fill="#00000030" />
      <rect x="50" y="84" width="20" height="20" rx="6" fill={skin} />
      <Ears look={look} />
      <ellipse cx="60" cy="58" rx="28" ry="32" fill={skin} />

      {hairStyle === 2 ? (
        [34, 46, 58, 70, 82].map((cx, i) => (
          <circle key={cx} cx={cx} cy={i % 2 ? 32 : 36} r="11" fill={hair} />
        ))
      ) : (
        <path d={HAIR_CAP} fill={hair} />
      )}

      {beard && <path d={BEARD} fill={hair} />}

      <ellipse cx="48" cy="60" rx="5" ry="4" fill="#fff" />
      <ellipse cx="72" cy="60" rx="5" ry="4" fill="#fff" />
      <circle cx="48" cy="60" r="2.6" fill={eyes} />
      <circle cx="72" cy="60" r="2.6" fill={eyes} />
      <path d="M41 52 L55 51 M65 51 L79 52" stroke="#00000066" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 76 Q60 80 68 76" stroke="#5b2f2f" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
