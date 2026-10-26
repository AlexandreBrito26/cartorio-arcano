import type { SceneArt as SceneKind } from '../game/cutscene';

const STARS = [
  [20, 18], [58, 40], [96, 14], [140, 30], [188, 12], [232, 36], [272, 16], [300, 44], [40, 70], [250, 70],
];

function Sky() {
  return (
    <>
      <rect width="320" height="180" fill="#120e24" />
      <rect width="320" height="110" fill="#1c1638" />
      {STARS.map(([x, y], i) => (
        <circle key={i} className="twinkle" style={{ animationDelay: `${i * 0.35}s` }} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#f1e4c3" />
      ))}
    </>
  );
}

function Gate({ x = 160, scale = 1 }: { x?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} 150) scale(${scale}) translate(-40 -110)`}>
      <path d="M0 110 V50 A40 40 0 0 1 80 50 V110 Z" fill="#cdbd92" />
      <path d="M10 110 V52 A30 30 0 0 1 70 52 V110 Z" fill="#2b1d17" />
      <circle className="rune" cx="40" cy="14" r="9" fill="#e0b44c" opacity="0.35" />
      <path className="rune" d="M40 6 L42.4 12 L48 14 L42.4 16 L40 22 L37.6 16 L32 14 L37.6 12 Z" fill="#e0b44c" />
    </g>
  );
}

/** Cenas da abertura, desenhadas em SVG para não depender de arquivos de imagem. */
export function SceneArt({ kind }: { kind: SceneKind }) {
  return (
    <svg viewBox="0 0 320 180" className="scene-art" role="img" aria-label={LABELS[kind]} preserveAspectRatio="xMidYMid slice">
      {kind === 'road' && (
        <>
          <Sky />
          <path d="M0 120 C60 100 110 112 160 100 C220 88 270 100 320 92 V180 H0 Z" fill="#17122e" />
          <path d="M0 136 C70 120 120 130 170 118 C230 104 280 116 320 108 V180 H0 Z" fill="#0f0b1f" />
          <path d="M120 180 C140 150 150 130 168 108 L176 108 C170 132 190 150 230 180 Z" fill="#3a2820" />
          <g className="mist">
            <ellipse cx="70" cy="128" rx="80" ry="9" fill="#a79fc9" opacity="0.14" />
            <ellipse cx="250" cy="140" rx="90" ry="10" fill="#a79fc9" opacity="0.12" />
          </g>
          <Gate x={172} scale={0.32} />
          <g transform="translate(150 150)">
            <circle cx="0" cy="-16" r="4" fill="#f1c9a5" />
            <path d="M-6 -12 L6 -12 L8 6 L-8 6 Z" fill="#5b2a3a" />
            <path d="M-6 6 L-3 16 M6 6 L3 16" stroke="#2b1d17" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M8 -8 L16 -2" stroke="#2b1d17" strokeWidth="2" strokeLinecap="round" />
          </g>
        </>
      )}

      {kind === 'gate' && (
        <>
          <Sky />
          <rect y="140" width="320" height="40" fill="#0f0b1f" />
          <rect x="0" y="40" width="70" height="110" fill="#2b2144" />
          <rect x="250" y="40" width="70" height="110" fill="#2b2144" />
          <path d="M70 150 V80 A90 90 0 0 1 250 80 V150 Z" fill="#cdbd92" />
          <path d="M92 150 V84 A68 68 0 0 1 228 84 V150 Z" fill="#2b1d17" />
          <circle className="rune" cx="160" cy="26" r="30" fill="#e0b44c" opacity="0.25" />
          <path className="rune" d="M160 4 L166 20 L184 26 L166 32 L160 48 L154 32 L136 26 L154 20 Z" fill="#e0b44c" />
          <g fill="#e0b44c">
            <rect x="110" y="104" width="4" height="46" opacity="0.55" />
            <rect x="206" y="104" width="4" height="46" opacity="0.55" />
          </g>
        </>
      )}

      {kind === 'office' && (
        <>
          <rect width="320" height="180" fill="#2b1d17" />
          <rect y="0" width="320" height="120" fill="#3a2820" />
          <rect x="30" y="20" width="60" height="70" rx="4" fill="#120e24" stroke="#5a3a22" strokeWidth="4" />
          <circle cx="60" cy="55" r="14" fill="#e0b44c" opacity="0.16" />
          <g fill="#5a3a22">
            <rect x="214" y="18" width="80" height="6" />
            <rect x="214" y="52" width="80" height="6" />
            <rect x="214" y="86" width="80" height="6" />
          </g>
          {[0, 1, 2].map((r) =>
            [0, 1, 2, 3, 4].map((c) => (
              <rect key={`${r}-${c}`} x={218 + c * 15} y={r * 34 + 4} width="11" height="14" fill={['#7a66e0', '#b23a48', '#3d8b5a'][(r + c) % 3]} opacity="0.85" />
            )),
          )}
          <rect y="120" width="320" height="60" fill="#1b110d" />
          <rect x="30" y="112" width="260" height="16" rx="3" fill="#5a3a22" />
          <g>
            <rect x="60" y="94" width="56" height="18" rx="2" fill="#f1e4c3" />
            <rect x="128" y="98" width="46" height="14" rx="2" fill="#e2cf9f" />
            <circle cx="214" cy="104" r="8" fill="#b23a48" />
            <rect x="209" y="88" width="10" height="16" rx="2" fill="#2a1f16" />
          </g>
          <g className="flame">
            <rect x="256" y="92" width="6" height="20" fill="#f1e4c3" />
            <path d="M259 76 C254 84 256 90 259 90 C262 90 264 84 259 76 Z" fill="#ffd36b" />
            <circle cx="259" cy="84" r="18" fill="#ffd36b" opacity="0.15" />
          </g>
        </>
      )}

      {kind === 'mistress' && (
        <>
          <rect width="320" height="180" fill="#2b1d17" />
          <rect width="320" height="110" fill="#3a2820" />
          <circle cx="260" cy="40" r="46" fill="#e0b44c" opacity="0.1" />
          <g transform="translate(160 40)">
            <path d="M-48 140 C-50 90 -26 70 0 70 C26 70 50 90 48 140 Z" fill="#3b2f6b" />
            <path d="M-12 70 L0 96 L12 70 Z" fill="#f1e4c3" />
            <rect x="-8" y="52" width="16" height="22" rx="5" fill="#d9a273" />
            <ellipse cx="0" cy="34" rx="24" ry="28" fill="#d9a273" />
            <path d="M-26 34 C-30 -2 30 -2 26 34 C20 20 10 14 0 14 C-10 14 -20 20 -26 34 Z" fill="#d8d8e0" />
            <path d="M-24 38 C-30 64 -20 78 -10 78 L-10 50 Z" fill="#d8d8e0" />
            <circle cx="-9" cy="34" r="6" fill="none" stroke="#e0b44c" strokeWidth="1.6" />
            <circle cx="9" cy="34" r="6" fill="none" stroke="#e0b44c" strokeWidth="1.6" />
            <path d="M-3 34 H3" stroke="#e0b44c" strokeWidth="1.6" />
            <circle cx="-9" cy="34" r="2" fill="#2a5db0" />
            <circle cx="9" cy="34" r="2" fill="#2a5db0" />
            <path d="M-6 50 Q0 53 6 50" stroke="#5b2f2f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
          <rect y="140" width="320" height="40" fill="#1b110d" />
          <rect x="40" y="130" width="240" height="14" rx="3" fill="#5a3a22" />
        </>
      )}

      {kind === 'stamp' && (
        <>
          <rect width="320" height="180" fill="#2b1d17" />
          <circle cx="160" cy="100" r="86" fill="#e0b44c" opacity="0.08" />
          <rect x="40" y="130" width="240" height="14" rx="3" fill="#5a3a22" />
          <rect x="90" y="108" width="140" height="24" rx="2" fill="#f1e4c3" />
          <rect x="100" y="116" width="60" height="3" fill="#2a1f16" opacity="0.5" />
          <rect x="100" y="122" width="90" height="3" fill="#2a1f16" opacity="0.35" />
          <g className="stamp-drop">
            <rect x="144" y="40" width="16" height="30" rx="4" fill="#2a1f16" />
            <rect x="124" y="68" width="56" height="12" rx="3" fill="#b23a48" />
            <rect x="130" y="80" width="44" height="6" rx="2" fill="#7d2630" />
          </g>
          <g className="stamp-mark" transform="translate(196 118) rotate(-10)">
            <circle r="14" fill="none" stroke="#b23a48" strokeWidth="2.5" />
            <path d="M0 -8 L2.4 -2 L8 0 L2.4 2 L0 8 L-2.4 2 L-8 0 L-2.4 -2 Z" fill="#b23a48" />
          </g>
        </>
      )}
    </svg>
  );
}

const LABELS: Record<SceneKind, string> = {
  road: 'Um viajante caminha na estrada enevoada rumo ao portão da fronteira',
  gate: 'O portão da fronteira com a runa acesa sobre o arco',
  office: 'O balcão do cartório, com carimbos, papéis e uma vela',
  mistress: 'A Mestra Aurelha, de óculos dourados, atrás do balcão',
  stamp: 'Um carimbo vermelho prestes a tocar um documento',
};
