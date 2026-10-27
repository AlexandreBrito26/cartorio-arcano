import { useCallback, useEffect, useRef, useState } from 'react';
import { TYPE_SPEED, defaultMood, type CutsceneScene } from '../game/cutscene';
import { playStamp } from '../game/audio';
import { Ambience } from './Ambience';
import { SceneArt } from './SceneArt';

interface Props {
  scenes: readonly CutsceneScene[];
  onDone: () => void;
  doneLabel?: string;
  /** Nome da cena para leitores de tela. */
  label?: string;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Cena de história: arte SVG com câmera e transição por cena, partículas, legenda de
 * quem fala e texto em máquina de escrever.
 * Clique, Espaço ou Enter completam o texto e depois avançam; Esc pula tudo.
 */
export function Cutscene({ scenes, onDone, doneLabel = 'Continuar', label = 'Cena' }: Props) {
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(0);
  const scene = scenes[index];
  const full = scene.lines.join('\n');
  const finished = chars >= full.length;
  const last = index === scenes.length - 1;
  const doneRef = useRef(false);

  // Máquina de escrever (ou texto inteiro de uma vez com movimento reduzido).
  useEffect(() => {
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
  }, [full]);

  // Som da cena, quando ela pede um.
  useEffect(() => {
    if (scene.sfx) playStamp(scene.sfx);
  }, [scene]);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  const advance = useCallback(() => {
    if (!finished) {
      setChars(full.length);
    } else if (last) {
      finish();
    } else {
      setIndex((i) => i + 1);
    }
  }, [finished, last, full.length, finish]);

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

  return (
    <main className="screen cutscene" aria-label={label}>
      <div className="cutscene-frame" onClick={advance}>
        <div key={index} className={`scene-stage tr-${transition}`}>
          <div className={`scene-camera cam-${camera}`}>
            <SceneArt kind={scene.art} />
          </div>
        </div>
        <Ambience
          key={`${index}-${scene.art}`}
          mood={scene.mood ?? fallback.mood}
          count={scene.particles ?? fallback.count}
        />
        <div className="cutscene-vignette" />
      </div>

      <div className="cutscene-text" aria-live="polite" onClick={advance}>
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
            {finished && last ? doneLabel : finished ? 'Continuar' : 'Mostrar tudo'}
          </button>
        </div>
      </div>
    </main>
  );
}
