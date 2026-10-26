import type { Dispatch } from 'react';
import { MAX_DAY, formatDate } from '../game/constants';
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
      <p className="eyebrow">Um jogo de carimbos e papelada</p>
      <h1>Cartório Arcano</h1>
      <p className="lead">
        Nas Brumas, ninguém atravessa a fronteira sem papel. Confira Carta, Passe e Selo, siga o
        Regulamento e decida quem entra. Cada decisão errada sai do seu bolso.
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
        Dia {rules.day} de {MAX_DAY} · {formatDate(rules.today)}
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
        olho atento. O balcão é seu.” Você encerra a semana com {state.coins} moedas no bolso.
      </p>
      <div className="actions">
        <button type="button" className="primary" autoFocus onClick={() => dispatch({ type: 'NEW_GAME' })}>
          Jogar de novo
        </button>
        <button type="button" className="secondary" onClick={() => dispatch({ type: 'TO_TITLE' })}>
          Menu inicial
        </button>
      </div>
    </main>
  );
}
