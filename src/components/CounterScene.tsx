import { useEffect, useState } from 'react';
import type { Applicant } from '../game/types';
import { Ambience } from './Ambience';
import { Portrait } from './Portrait';

type Reaction = 'approve' | 'deny' | undefined;

interface Props {
  applicant?: Applicant;
  /** Reação do viajante à decisão (aceno ou lamento). */
  reaction?: Reaction;
  /** Texto fixo quando o balcão está vazio. */
  emptyText?: string;
}

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Revela a fala letra a letra, como legenda de cinema. No servidor ou sem movimento, mostra tudo. */
function useTypewriter(text: string) {
  const instant = typeof window === 'undefined' || reducedMotion();
  const [shown, setShown] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 26);
    return () => window.clearInterval(id);
  }, [text, instant]);

  return text.slice(0, shown);
}

/** Cenário: o lado de fora do guichê, na chuva das Brumas. */
function Backdrop() {
  return (
    <svg className="st-bg" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="st-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#070b1a" />
          <stop offset="0.55" stopColor="#16223f" />
          <stop offset="1" stopColor="#2b3a5c" />
        </linearGradient>
        <radialGradient id="st-lamp-glow">
          <stop offset="0" stopColor="#ffd98a" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffd98a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="st-rune-glow">
          <stop offset="0" stopColor="#e0b44c" stopOpacity="0.5" />
          <stop offset="1" stopColor="#e0b44c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g transform="translate(200 0)">
      <rect x="-200" width="1200" height="300" fill="url(#st-sky)" />

      {/* nuvens pesadas, em duas camadas que derivam em velocidades diferentes */}
      <g className="st-clouds st-clouds-far" fill="#0a1022">
        <ellipse cx="120" cy="40" rx="190" ry="34" opacity="0.9" />
        <ellipse cx="460" cy="26" rx="230" ry="30" opacity="0.95" />
        <ellipse cx="760" cy="52" rx="200" ry="36" opacity="0.9" />
      </g>
      <g className="st-clouds st-clouds-near" fill="#0d1429">
        <ellipse cx="280" cy="78" rx="210" ry="26" opacity="0.8" />
        <ellipse cx="640" cy="92" rx="240" ry="30" opacity="0.75" />
      </g>

      {/* silhuetas dos reinos distantes */}
      <path d="M-200 176 L0 176 L60 140 L110 164 L190 120 L260 168 L330 150 L420 182 L520 146 L610 172 L700 130 L800 170 L1000 170 V230 H-200 Z" fill="#0b132a" />
      <path d="M-200 196 L0 196 L90 172 L170 192 L260 166 L360 194 L470 176 L560 200 L680 170 L800 196 L1000 196 V240 H-200 Z" fill="#101a36" />

      {/* torre distante com janela acesa */}
      <g transform="translate(655 118)">
        <rect x="0" y="20" width="26" height="82" fill="#0a1124" />
        <path d="M-4 22 L13 0 L30 22 Z" fill="#0a1124" />
        <rect className="st-window" x="9" y="40" width="8" height="12" fill="#ffd98a" />
      </g>

      {/* portão de pedra com a runa acesa */}
      <g transform="translate(88 100)">
        <circle className="st-rune" cx="46" cy="26" r="34" fill="url(#st-rune-glow)" />
        <path d="M0 140 V60 A46 46 0 0 1 92 60 V140 Z" fill="#232a44" />
        <path d="M12 140 V62 A34 34 0 0 1 80 62 V140 Z" fill="#0c1020" />
        <path className="st-rune" d="M46 14 L49 23 L58 26 L49 29 L46 38 L43 29 L34 26 L43 23 Z" fill="#e0b44c" />
      </g>

      {/* ponte de pedra e piso molhado */}
      <rect x="-200" y="230" width="1200" height="70" fill="#0b1226" />
      <path d="M-200 232 H1000 V244 H-200 Z" fill="#2a3556" opacity="0.7" />
      <g stroke="#1b2644" strokeWidth="2" opacity="0.8">
        <path d="M-200 262 H1000 M-200 284 H1000" />
        <path d="M-120 244 V300 M-20 244 V300 M80 244 V300 M220 244 V300 M360 244 V300 M520 244 V300 M660 244 V300 M780 244 V300 M900 244 V300" />
      </g>

      {/* lampião do lado de fora, com reflexo na pedra molhada */}
      <g transform="translate(720 140)">
        <circle className="st-lamp" cx="0" cy="0" r="62" fill="url(#st-lamp-glow)" />
        <rect x="-2" y="10" width="4" height="96" fill="#1c1a24" />
        <rect x="-9" y="-10" width="18" height="22" rx="3" fill="#2a2430" />
        <rect className="st-lamp-flame" x="-5" y="-6" width="10" height="14" rx="3" fill="#ffd98a" />
      </g>
      <ellipse className="st-lamp" cx="720" cy="262" rx="40" ry="6" fill="#ffd98a" opacity="0.2" />
      <ellipse className="st-rune" cx="134" cy="262" rx="38" ry="5" fill="#e0b44c" opacity="0.14" />

      {/* névoa em camadas, rente ao chão */}
      <g className="st-mist st-mist-a">
        <ellipse cx="160" cy="236" rx="330" ry="22" fill="#9fb3d9" opacity="0.16" />
        <ellipse cx="620" cy="244" rx="260" ry="20" fill="#9fb3d9" opacity="0.14" />
      </g>
      <g className="st-mist st-mist-b">
        <ellipse cx="60" cy="252" rx="200" ry="16" fill="#cfd9f0" opacity="0.12" />
        <ellipse cx="480" cy="256" rx="260" ry="18" fill="#cfd9f0" opacity="0.1" />
      </g>
      </g>
    </svg>
  );
}

/** A divisória: o guichê de madeira e latão que separa o viajante do aprendiz. */
function Partition() {
  const bars = Array.from({ length: 28 }, (_, i) => 98 + i * 38);
  return (
    <svg className="st-partition" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="st-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3223" />
          <stop offset="1" stopColor="#24160f" />
        </linearGradient>
        <linearGradient id="st-brass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6a2c" />
          <stop offset="0.5" stopColor="#e0b44c" />
          <stop offset="1" stopColor="#8a6a2c" />
        </linearGradient>
        <linearGradient id="st-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bcd0ff" stopOpacity="0.14" />
          <stop offset="0.4" stopColor="#bcd0ff" stopOpacity="0" />
          <stop offset="0.7" stopColor="#bcd0ff" stopOpacity="0.08" />
          <stop offset="1" stopColor="#bcd0ff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="st-candle-glow">
          <stop offset="0" stopColor="#ffcf6b" stopOpacity="0.7" />
          <stop offset="1" stopColor="#ffcf6b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* pilares laterais */}
      <rect x="0" y="0" width="76" height="300" fill="url(#st-wood)" />
      <rect x="1124" y="0" width="76" height="300" fill="url(#st-wood)" />
      <rect x="70" y="0" width="6" height="232" fill="url(#st-brass)" />
      <rect x="1124" y="0" width="6" height="232" fill="url(#st-brass)" />

      {/* viga superior com placa */}
      <rect x="0" y="0" width="1200" height="30" fill="url(#st-wood)" />
      <rect x="0" y="28" width="1200" height="4" fill="url(#st-brass)" />
      <g transform="translate(600 31)">
        <rect x="-96" y="0" width="192" height="26" rx="3" fill="#1a110c" stroke="#8a6a2c" strokeWidth="2" />
        <text x="0" y="17" textAnchor="middle" fill="#e0b44c" fontFamily="Cinzel, Georgia, serif" fontSize="11" letterSpacing="3">
          GUICHÊ DAS BRUMAS
        </text>
        <path d="M-70 0 V-6 M70 0 V-6" stroke="#8a6a2c" strokeWidth="2" />
      </g>

      {/* grade de latão e vidro */}
      <g stroke="url(#st-brass)" strokeWidth="2.4" opacity="0.85">
        {bars.map((x) => (
          <path key={x} d={`M${x} 32 V232`} />
        ))}
      </g>
      <rect x="76" y="32" width="1048" height="200" fill="url(#st-glass)" />
      <path d="M150 32 L110 232 M230 32 L190 232" stroke="#d6e2ff" strokeOpacity="0.06" strokeWidth="14" />

      {/* lampião pendurado à esquerda, no lado quente */}
      <g className="st-swing" style={{ transformOrigin: '38px 0px' }}>
        <path d="M38 30 V62" stroke="#8a6a2c" strokeWidth="2" />
        <circle className="st-candle" cx="38" cy="82" r="46" fill="url(#st-candle-glow)" />
        <rect x="26" y="62" width="24" height="30" rx="4" fill="#2a1d14" stroke="#8a6a2c" strokeWidth="2" />
        <rect className="st-lamp-flame" x="32" y="68" width="12" height="18" rx="5" fill="#ffd98a" />
      </g>

      {/* tampo do balcão */}
      <rect x="0" y="232" width="1200" height="68" fill="url(#st-wood)" />
      <rect x="0" y="228" width="1200" height="8" fill="url(#st-brass)" />
      <rect x="0" y="236" width="1200" height="3" fill="#00000066" />
      <g stroke="#ffffff08" strokeWidth="1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M0 ${246 + i * 6} H1200`} />
        ))}
      </g>

      {/* sobre o tampo: vela, sineta, tinteiro e carimbo */}
      <g transform="translate(1010 228)">
        <circle className="st-candle" cx="0" cy="-26" r="54" fill="url(#st-candle-glow)" />
        <rect x="-7" y="-24" width="14" height="24" rx="2" fill="#efe2bf" />
        <path className="st-flame" d="M0 -46 C-6 -37 -4 -29 0 -29 C4 -29 6 -37 0 -46 Z" fill="#ffd36b" />
        <ellipse cx="0" cy="0" rx="16" ry="3" fill="#8a6a2c" />
      </g>
      <g transform="translate(900 228)">
        <path d="M-14 0 C-14 -16 -8 -22 0 -22 C8 -22 14 -16 14 0 Z" fill="url(#st-brass)" />
        <circle cx="0" cy="-24" r="3" fill="#e0b44c" />
        <ellipse cx="0" cy="1" rx="18" ry="3" fill="#00000055" />
      </g>
      <g transform="translate(170 228)">
        <rect x="-12" y="-14" width="24" height="14" rx="3" fill="#1a1426" stroke="#8a6a2c" strokeWidth="1.5" />
        <path d="M6 -14 L24 -46" stroke="#efe2bf" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 -46 L30 -52 L27 -42 Z" fill="#efe2bf" />
      </g>
      <g transform="translate(250 228)">
        <rect x="-10" y="-8" width="20" height="8" rx="2" fill="#b23a48" />
        <rect x="-4" y="-26" width="8" height="20" rx="3" fill="#2a1f16" />
      </g>
    </svg>
  );
}

/**
 * A cena do balcão: chuva e névoa do lado de fora, o viajante atrás da divisória de latão e vidro,
 * luz quente de vela do lado do aprendiz, relâmpago ocasional e legenda de cinema.
 */
export function CounterScene({ applicant, reaction, emptyText }: Props) {
  const line = applicant ? `“${applicant.line}”` : (emptyText ?? '');
  const typed = useTypewriter(line);

  return (
    <section className="stage" aria-label={applicant ? 'Viajante no balcão' : 'Balcão vazio'}>
      <div className="stage-view">
        <Backdrop />

        {applicant && (
          <div className={['st-traveler', reaction && `react-${reaction}`].filter(Boolean).join(' ')}>
            <Portrait key={applicant.id} look={applicant.look} />
          </div>
        )}

        <Ambience mood="rain" count={90} className="st-rain" />
        <Partition />

        <div className="st-warm" />
        <div className="st-vignette" />
        <div className="st-flash">
          <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice">
            <path d="M760 0 L736 70 L762 76 L720 160 L748 164 L700 250" fill="none" stroke="#e8f0ff" strokeWidth="2.5" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="st-place">Fronteira das Brumas · Chuva</span>
      </div>

      <p className={['bubble', !applicant && 'bubble-empty'].filter(Boolean).join(' ')} aria-live="polite">
        <span className="visually-hidden">{line}</span>
        <span aria-hidden="true">
          {typed}
          <span className="caret" />
        </span>
      </p>
    </section>
  );
}
