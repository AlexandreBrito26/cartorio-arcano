import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { TYPE_SPEED, defaultMood, type CutsceneScene } from '../game/cutscene';
import { playStamp } from '../game/audio';
import { playScore, resolveScore, stopScore } from '../game/music';
import { Ambience } from './Ambience';
import { PixelCutsceneArt } from '../render/PixelCutsceneArt';

interface Props {
  scenes: readonly CutsceneScene[];
  onDone: () => void;
  doneLabel?: string;
  /** Nome da cena para leitores de tela. */
  label?: string;
  /** Cartão de título que abre a cena (ex.: "Ano 417"), antes da primeira imagem. */
  titleCard?: string;
}

/** Quanto o cartão de título fica na tela antes de seguir sozinho. */
const TITLE_MS = 4200;
const TITLE_MS_REDUCED = 2400;
const TITLE_LEAVE_MS = 900;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cena de história: arte em pixel art (Pixi) com câmera (parallax, foco e tremor) e transição por cena,
 * letterbox, partículas, trilha sintetizada, legenda de quem fala e texto em máquina de escrever.
 * Clique, Espaço ou Enter completam o texto e depois avançam; Esc pula tudo.
 * Com `titleCard`, a abertura começa por um cartão de título (clique ou tecla também o pulam).
 */
export function Cutscene({ scenes, onDone, doneLabel = 'Continuar', label = 'Cena', titleCard }: Props) {
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(0);
  const [titleState, setTitleState] = useState<'show' | 'leaving' | 'gone'>(titleCard ? 'show' : 'gone');
  const titling = titleState === 'show';
  const scene = scenes[index];
  const full = scene.lines.join('\n');
  const finished = chars >= full.length;
  const last = index === scenes.length - 1;
  const doneRef = useRef(false);

  // O cartão de título segue sozinho depois de alguns segundos e sai com um fade.
  useEffect(() => {
    if (titleState === 'show') {
      const id = window.setTimeout(
        () => setTitleState('leaving'),
        prefersReducedMotion() ? TITLE_MS_REDUCED : TITLE_MS,
      );
      return () => window.clearTimeout(id);
    }
    if (titleState === 'leaving') {
      const id = window.setTimeout(() => setTitleState('gone'), TITLE_LEAVE_MS);
      return () => window.clearTimeout(id);
    }
  }, [titleState]);

  // Trilha: nasce com o cartão de título e muda de perfil a cada cena; some ao sair.
  useEffect(() => {
    playScore(titling ? 'title' : scene.art);
  }, [titling, scene.art]);
  useEffect(() => () => stopScore(1.4), []);

  // Máquina de escrever (ou texto inteiro de uma vez com movimento reduzido).
  useEffect(() => {
    if (titling) {
      setChars(0);
      return;
    }
    if (prefersReducedMotion()) {
      setChars(full.length);
      return;
    }
    setChars(0);
    const start = performance.now();
    const id = window.setInterval(() => {
      const n = Math.floor(((performance.now() - start) / 1000) * TYPE_SPEED);
      setChars(Math.min(n, full.length));
      if (n >= full.length) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [full, titling]);

  // Som da cena, quando ela pede um (no instante do impacto, não na entrada).
  useEffect(() => {
    if (titling || !scene.sfx) return;
    const kind = scene.sfx;
    const id = window.setTimeout(() => {
      playStamp(kind);
      resolveScore();
    }, scene.sfxAt ?? 0);
    return () => window.clearTimeout(id);
  }, [scene, titling]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const advance = useCallback(() => {
    if (titleState === 'show') {
      setTitleState('leaving');
    } else if (!finished) {
      setChars(full.length);
    } else if (last) {
      finish();
    } else {
      setIndex((i) => i + 1);
    }
  }, [titleState, finished, last, full.length, finish]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        // Botões focados tratam Enter/Espaço sozinhos.
        if ((e.target as HTMLElement | null)?.tagName === 'BUTTON') return;
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, finish]);

  const shown = full.slice(0, chars).split('\n');
  const fallback = defaultMood(scene.art);
  const camera = scene.camera ?? 'still';
  const transition = scene.transition ?? 'fade';
  const focus = scene.focus ?? { x: 50, y: 50 };
  const shakeStyle = { '--shake-at': `${scene.sfxAt ?? 0}ms` } as CSSProperties;

  return (
    <main className="screen cutscene" aria-label={label}>
      <div className="cutscene-frame" onClick={advance}>
        {!titling && (
          <div key={index} className={`scene-stage tr-${transition}`}>
            <div className={`scene-shake${scene.sfx ? ' impact' : ''}`} style={shakeStyle}>
              <div className="scene-sway">
                <div className="scene-camera" data-camera={camera} data-focus={`${focus.x} ${focus.y}`}>
                  <PixelCutsceneArt art={scene.art} camera={camera} focus={focus} impactMs={scene.sfxAt} />
                </div>
              </div>
            </div>
          </div>
        )}
        {!titling && (
          <Ambience
            key={`${index}-${scene.art}`}
            mood={scene.mood ?? fallback.mood}
            count={scene.particles ?? fallback.count}
          />
        )}
        <div className="cutscene-vignette" />
        {titleCard && titleState !== 'gone' && (
          <div className={`title-card${titleState === 'leaving' ? ' leaving' : ''}`} aria-hidden="true">
            <Ambience mood="embers" count={16} />
            <p className="title-card-text">{titleCard}</p>
            <span className="title-card-rule" />
          </div>
        )}
        <div className="letterbox" aria-hidden="true">
          <span className="lb-top" />
          <span className="lb-bottom" />
        </div>
      </div>

      <div className="cutscene-text" aria-live="polite" onClick={advance}>
        {titleCard && <span className="visually-hidden">{titleCard}</span>}
        {scene.speaker && <p className="cutscene-speaker">{scene.speaker}</p>}
        {scene.lines.map((line, i) => (
          <p key={`${index}-${i}`}>
            <span className="visually-hidden">{line}</span>
            <span aria-hidden="true">{shown[i] ?? ''}</span>
          </p>
        ))}
      </div>

      <div className="cutscene-bar">
        <ol className="cutscene-dots" aria-label={`Cena ${index + 1} de ${scenes.length}`}>
          {scenes.map((_, i) => (
            <li key={i} className={i === index ? 'on' : i < index ? 'past' : undefined} />
          ))}
        </ol>
        <div className="actions">
          <button type="button" className="secondary" onClick={finish}>
            Pular <kbd>Esc</kbd>
          </button>
          <button type="button" className="primary" autoFocus onClick={advance}>
            {titling ? 'Continuar' : finished && last ? doneLabel : finished ? 'Continuar' : 'Mostrar tudo'}
          </button>
        </div>
      </div>
    </main>
  );
}
