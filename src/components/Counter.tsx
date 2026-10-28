import { useEffect, useState, type Dispatch } from 'react';
import { playResult } from '../game/audio';
import { GAME_YEAR, formatDateFull } from '../game/constants';
import { compareMarks } from '../game/compare';
import { DENY_LABEL } from '../game/rules';
import type { Action, GameState } from '../game/state';
import type { Applicant, DayRules, ViolationCode } from '../game/types';
import { CounterScene } from './CounterScene';
import { BaggageDoc, FeeDoc, IdentityDoc, PassDoc, SealDoc, SpeciesCert } from './Documents';
import { RuleBook } from './RuleBook';

interface Props {
  state: GameState;
  dispatch: Dispatch<Action>;
}

/** A mesa de um viajante. Remontada a cada viajante para limpar as marcações. */
function Desk({ applicant, rules }: { applicant: Applicant; rules: DayRules }) {
  const [marks, setMarks] = useState<ReadonlySet<string>>(new Set());

  const onToggle = (id: string) =>
    setMarks((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const { identity, pass, seal } = applicant;
  const props = { marks, onToggle };
  const has = (code: ViolationCode) => rules.active.includes(code);
  const checks = compareMarks(applicant, rules, marks);

  return (
    <div className="docs">
      <p className="desk-today">
        Hoje: <strong>{formatDateFull(rules.today)}</strong>, ano {GAME_YEAR}
      </p>
      <ul className="compare" role="status" aria-live="polite" aria-label="Conferência dos campos grifados">
        {checks.length === 0 ? (
          <li className="compare-hint">
            Grife dois campos iguais de papéis diferentes (nome, reino, espécie) ou uma validade para conferir.
          </li>
        ) : (
          checks.map((c) => (
            <li key={c.id} className={c.ok ? 'compare-ok' : 'compare-bad'}>
              <span aria-hidden="true">{c.ok ? '✓' : '✗'}</span> {c.text}
            </li>
          ))
        )}
      </ul>
      {identity && <IdentityDoc card={identity} {...props} />}
      {pass && <PassDoc pass={pass} {...props} />}
      {seal && <SealDoc seal={seal} {...props} />}
      {has('BAGAGEM_PROIBIDA') && <BaggageDoc items={applicant.baggage} {...props} />}
      {has('TAXA_NAO_PAGA') && <FeeDoc paid={applicant.fee} {...props} />}
      {has('ESPECIE_SEM_DOC') && applicant.speciesDoc && (
        <SpeciesCert doc={applicant.speciesDoc} {...props} />
      )}
    </div>
  );
}

export function Counter({ state, dispatch }: Props) {
  // Só há viajante no balcão depois que ele chega à fila.
  const applicant = state.index < state.arrived ? state.queue[state.index] : undefined;
  const [asking, setAsking] = useState(false);
  const playing = state.phase === 'playing';
  const result = state.result;

  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (key === 'escape') setAsking(false);
      else if (!asking && key === 'a') dispatch({ type: 'DECIDE', decision: { kind: 'approve' } });
      else if (!asking && key === 'n') setAsking(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, asking, dispatch]);

  useEffect(() => {
    if (result) playResult(result.decision.kind, result.verdict);
  }, [result]);

  // O relógio só corre enquanto o dia está em andamento (não durante o resultado).
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(id);
  }, [state.phase, dispatch]);

  if (!applicant) {
    return (
      <main className="counter">
        <CounterScene day={state.day} emptyText="Ninguém no balcão. Os próximos viajantes ainda estão a caminho." />
      </main>
    );
  }

  const deny = (reason: ViolationCode) => {
    setAsking(false);
    dispatch({ type: 'DECIDE', decision: { kind: 'deny', reason } });
  };

  const stampLabel = result?.decision.kind === 'approve' ? 'Aprovado' : 'Negado';

  return (
    <main className="counter">
      <CounterScene day={state.day} applicant={applicant} reaction={result?.decision.kind} />

      <section className="desk" aria-label="Mesa de documentos">
        <h2 className="visually-hidden">Documentos na mesa</h2>
        <Desk key={applicant.id} applicant={applicant} rules={state.rules} />
        {result && (
          <div className={`stamp ${result.decision.kind === 'approve' ? 'stamp-ok' : 'stamp-no'}`} aria-hidden="true">
            {stampLabel}
          </div>
        )}
      </section>

      <RuleBook rules={state.rules} upgrades={state.upgrades} />

      <footer className="decision-bar">
        {playing && (
          <>
            <button
              type="button"
              className="stamp-btn approve"
              onClick={() => dispatch({ type: 'DECIDE', decision: { kind: 'approve' } })}
            >
              Aprovar <kbd>A</kbd>
            </button>
            <button type="button" className="stamp-btn deny" onClick={() => setAsking(true)}>
              Negar <kbd>N</kbd>
            </button>
          </>
        )}

        {result && (
          <div className={`result result-${result.verdict}`} role="status" aria-live="polite">
            <div className="result-text">
              <strong>
                {result.headline} <span className="delta">{result.delta > 0 ? '+' : '−'}{Math.abs(result.delta)}</span>
              </strong>
              {result.violations.length > 0 ? (
                <ul>
                  {result.violations.map((v) => (
                    <li key={v.detail}>
                      <b>{DENY_LABEL[v.code]}:</b> {v.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma irregularidade nos documentos.</p>
              )}
            </div>
            <button type="button" className="next-btn" autoFocus onClick={() => dispatch({ type: 'NEXT' })}>
              {state.index + 1 < state.queue.length ? 'Próximo viajante' : 'Encerrar o dia'}
            </button>
          </div>
        )}
      </footer>

      {asking && (
        <div className="modal-backdrop" onClick={() => setAsking(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deny-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="deny-title">Motivo da negativa</h2>
            <div className="reasons">
              {state.rules.active.map((code) => (
                <button key={code} type="button" className="reason" onClick={() => deny(code)}>
                  {DENY_LABEL[code]}
                </button>
              ))}
            </div>
            <button type="button" className="link-btn" onClick={() => setAsking(false)}>
              Cancelar <kbd>Esc</kbd>
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
