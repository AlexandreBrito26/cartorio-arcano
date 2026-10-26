import type { Dispatch } from 'react';
import { MAX_DAY, formatDate } from '../game/constants';
import { eventForDay } from '../game/events';
import { Ambience } from './Ambience';
import { Logo } from './Logo';
import { ruleText } from '../game/rules';
import type { Action, GameState } from '../game/state';

interface Props {
  state: GameState;
  dispatch: Dispatch<Action>;
}

export function Title({ state, dispatch }: Props) {
  return (
    <main className="screen title-screen">
      <Ambience className="ambience-page" count={46} />
      <Logo size={132} className="title-logo" title="Logo do Cartório Arcano" />
      <p className="eyebrow">Um jogo de carimbos entre mundos</p>
      <h1>Cartório Arcano</h1>
      <p className="lead">
        O cartório fica no entreposto entre mundos, onde humanos, elfos, dragões, golems e espectros
        dependem do mesmo papel. Confira Carta, Passe e documentos da espécie, siga o Regulamento e
        decida quem entra. Cada decisão errada sai do seu bolso.
      </p>
      <div className="actions">
        <button type="button" className="primary" autoFocus onClick={() => dispatch({ type: 'NEW_GAME' })}>
          Novo jogo
        </button>
        {state.save && (
          <button type="button" className="secondary" onClick={() => dispatch({ type: 'CONTINUE' })}>
            Continuar (dia {state.save.day}, {state.save.coins} moedas)
          </button>
        )}
      </div>
    </main>
  );
}

export function Briefing({ state, dispatch }: Props) {
  const { rules } = state;
  return (
    <main className="screen briefing">
      <p className="eyebrow">
        {rules.day > MAX_DAY ? `Plantão, dia ${rules.day}` : `Dia ${rules.day} de ${MAX_DAY}`} · {formatDate(rules.today)}
      </p>
      <h1>{rules.headline}</h1>
      <p className="lead">{rules.story}</p>

      <section className="panel">
        <h2>Novas regras de hoje</h2>
        <ul className="rule-list">
          {rules.newCodes.map((code) => (
            <li key={code}>{ruleText(code, rules)}</li>
          ))}
          {rules.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="muted">
          {rules.applicants} viajantes na fila. Todas as regras ficam no Regulamento, ao lado da mesa.
        </p>
      </section>

      <div className="actions">
        <button
          type="button"
          className="primary"
          autoFocus
          onClick={() => dispatch({ type: 'START_DAY', seed: Date.now() })}
        >
          Abrir o balcão
        </button>
      </div>
    </main>
  );
}

export function DayEnd({ state, dispatch }: Props) {
  const { stats, coins, day } = state;
  const broke = coins < 0;
  const last = day >= MAX_DAY;

  return (
    <main className="screen day-end">
      <p className="eyebrow">Fim do dia {day}</p>
      <h1>{broke ? 'Sem moedas para as velas' : 'Balcão fechado'}</h1>

      <section className="panel">
        <dl className="ledger">
          <div><dt>Decisões certas</dt><dd>{stats.correct}</dd></div>
          <div><dt>Motivo errado</dt><dd>{stats.partial}</dd></div>
          <div><dt>Infrações</dt><dd>{stats.wrong}</dd></div>
          <div className="gain"><dt>Ganhos</dt><dd>+{stats.earned}</dd></div>
          <div className="loss"><dt>Multas</dt><dd>−{stats.fined}</dd></div>
          {stats.lost > 0 && (
            <div className="loss"><dt>Sem atendimento (relógio)</dt><dd>−{stats.lost}</dd></div>
          )}
          <div className="loss"><dt>Despesas (velas, pergaminho, pão)</dt><dd>−{stats.expenses}</dd></div>
          <div className="total"><dt>Saldo</dt><dd>{coins}</dd></div>
        </dl>
        {broke && (
          <p className="muted">
            Você não conseguiu pagar as despesas e o cartório fechou as portas. Tente de novo com mais calma.
          </p>
        )}
      </section>

      <div className="actions">
        <button type="button" className="primary" autoFocus onClick={() => dispatch({ type: 'NEXT_DAY' })}>
          {broke ? 'Voltar ao início' : last ? 'Ver o desfecho' : `Seguir para o dia ${day + 1}`}
        </button>
      </div>
    </main>
  );
}

export function Ending({ state, dispatch }: Props) {
  return (
    <main className="screen ending">
      <p className="eyebrow">Fim da jornada</p>
      <h1>Aprendiz efetivado</h1>
      <p className="lead">
        A Mestra Aurelha guarda o caderno de inspeção e, pela primeira vez, sorri. “Carimbo firme,
        olho atento. O balcão é seu.” Você encerra a campanha com {state.coins} moedas no bolso.
      </p>
      <div className="actions">
        <button type="button" className="primary" autoFocus onClick={() => dispatch({ type: 'CONTINUE_INFINITE' })}>
          Continuar no plantão
        </button>
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'NEW_GAME' })}>
          Jogar de novo
        </button>
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'TO_TITLE' })}>
          Menu inicial
        </button>
      </div>
    </main>
  );
}

export function EventScreen({ state, dispatch }: Props) {
  const event = eventForDay(state.day);
  if (!event) return null;
  const answered = state.eventOutcome !== null;

  return (
    <main className="screen event">
      <p className="eyebrow">Evento do dia {state.day}</p>
      <h1>{event.title}</h1>
      <section className="panel">
        <p className="lead">{event.text}</p>

        {answered ? (
          <>
            <p className="event-outcome">{state.eventOutcome}</p>
            <div className="actions">
              <button type="button" className="primary" autoFocus onClick={() => dispatch({ type: 'EVENT_DONE' })}>
                Seguir para o dia {state.day}
              </button>
            </div>
          </>
        ) : (
          <div className="actions">
            {event.options.map((o, i) => {
              const blocked = state.coins + o.delta < 0;
              return (
                <button
                  key={o.label}
                  type="button"
                  className="secondary"
                  disabled={blocked}
                  onClick={() => dispatch({ type: 'CHOOSE_EVENT', option: i })}
                >
                  {o.label} <span className="delta">{o.delta >= 0 ? '+' : '−'}{Math.abs(o.delta)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
