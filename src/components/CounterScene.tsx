import { useEffect, useMemo, useState } from 'react';
import type { Applicant } from '../game/types';
import { PixelPortrait } from '../render/PixelPortrait';
import { CounterPixelScene } from '../render/CounterPixelScene';
import { PixiStage } from '../render/PixiStage';
import { WeatherLayer } from '../render/WeatherLayer';
import { skinWeather } from '../game/skins';
import { weatherForDay } from '../game/weather';
import { useSkin } from './SkinContext';
import { reduced as reducedMotion } from '../render/motion';

type Reaction = 'approve' | 'deny' | undefined;

interface Props {
  applicant?: Applicant;
  /** Reação do viajante à decisão (aceno ou lamento). */
  reaction?: Reaction;
  /** Texto fixo quando o balcão está vazio. */
  emptyText?: string;
  /** Dia da campanha: cada dia tem o seu clima e o seu céu (game/weather.ts). */
  day?: number;
}

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

/**
 * A cena do balcão: o clima do dia (chuva, neve, aurora…) e a névoa do lado de fora, o viajante atrás da divisória de latão e vidro,
 * luz quente de vela do lado do aprendiz, relâmpago ocasional e legenda de cinema.
 */
export function CounterScene({ applicant, reaction, emptyText, day = 1 }: Props) {
  const skin = useSkin();
  // O clima do dia, com o céu tingido pela skin (a mesma referência enquanto dia e skin não mudam).
  const weather = useMemo(() => skinWeather(weatherForDay(day), skin), [day, skin]);
  const line = applicant ? `“${applicant.line}”` : (emptyText ?? '');
  const typed = useTypewriter(line);

  return (
    <section className="stage" aria-label={applicant ? 'Viajante no balcão' : 'Balcão vazio'}>
      <div className="stage-view">
        {/* Um só canvas Pixi: fundo, viajante, chuva e frente são camadas dele. */}
        <PixiStage>
          <CounterPixelScene layer="back" weather={weather} skin={skin} />

          {applicant && (
            <div className="st-traveler">
              <PixelPortrait key={applicant.id} look={applicant.look} reaction={reaction} />
            </div>
          )}

          <WeatherLayer weather={weather} />
          <CounterPixelScene layer="front" weather={weather} skin={skin} reaction={reaction} />
        </PixiStage>

        <div className="st-warm" />
        <div className="st-vignette" />
        <span className="st-place">Fronteira das Brumas · {weather.label}</span>
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
