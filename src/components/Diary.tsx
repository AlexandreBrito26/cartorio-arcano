import { useEffect, useRef, useState } from 'react';
import {
  DIARY_TABS,
  LORE_INTRO,
  entriesFor,
  isUnlocked,
  unlockedCount,
  type DiaryTab,
} from '../game/lore';

interface Props {
  /** Dia mais avançado já alcançado (desbloqueia os verbetes). */
  reachedDay: number;
  onClose: () => void;
}

/** Diário do Cartório: enciclopédia do mundo, liberada conforme a campanha avança. */
export function Diary({ reachedDay, onClose }: Props) {
  const [tab, setTab] = useState<DiaryTab>('mundo');
  const closeRef = useRef<HTMLButtonElement>(null);
  const { open, total } = unlockedCount(reachedDay);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const entries = entriesFor(tab);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal diary"
        role="dialog"
        aria-modal="true"
        aria-label="Diário do Cartório"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="diary-head">
          <div>
            <h2>Diário do Cartório</h2>
            <p className="muted">{open} de {total} verbetes</p>
          </div>
          <button ref={closeRef} type="button" className="link-btn" onClick={onClose}>
            Fechar <kbd>Esc</kbd>
          </button>
        </header>

        <div className="diary-tabs" role="tablist">
          {DIARY_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'active' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="diary-body">
          {tab === 'mundo' && (
            <article className="diary-entry intro">
              <h3>{LORE_INTRO.title}</h3>
              {LORE_INTRO.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </article>
          )}
          {entries.map((e) =>
            isUnlocked(e, reachedDay) ? (
              <article key={e.id} className="diary-entry">
                <h3>{e.title}</h3>
                <p className="tagline">{e.tagline}</p>
                {e.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </article>
            ) : (
              <article key={e.id} className="diary-entry locked">
                <h3>🔒 Verbete lacrado</h3>
                <p className="tagline">Abre no dia {e.unlockDay}</p>
              </article>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
