import { useEffect, useRef, useState, type Dispatch } from 'react';
import { PixelSprite } from './PixelSprite';
import { MAX_DAY, formatDate } from '../game/constants';
import { eventForDay } from '../game/events';
import { Ambience } from './Ambience';
import { CanvasLogo } from './CanvasLogo';
import { preloadBundles } from '../render/assets';
import { ruleText } from '../game/rules';
import type { Action, GameState } from '../game/state';
import { UPGRADES, canBuy, levelOf, nextCost, type UpgradeId } from '../game/upgrades';

interface Props {
  state: GameState;
  dispatch: Dispatch<Action>;
}

/** Começa a baixar o Pixi e as texturas assim que o jogador mostra intenção de jogar. */
const warmUp = () => void preloadBundles(['abertura', 'balcao', 'personagens']);

export function Title({ state, dispatch }: Props) {
  return (
    <main className="screen title-screen">
      <Ambience className="ambience-page" count={46} />
      <CanvasLogo className="title-logo" />
      <p className="eyebrow">Um jogo de carimbos entre mundos</p>
      <h1 className="visually-hidden">Cartório das Brumas</h1>
      <p className="lead">
        O cartório fica no entreposto entre mundos, onde humanos, elfos, dragões, golems e espectros
        dependem do mesmo papel. Confira Carta, Passe e documentos da espécie, siga o Regulamento e
        decida quem entra. Cada decisão errada sai do seu bolso.
      </p>
      <div className="actions" onPointerEnter={warmUp} onPointerDown={warmUp}>
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
      {/* Primeiro dia: brasas do PixiJS flutuam atrás da abertura do cartório. */}
      {rules.day === 1 && <Ambience mood="embers" count={30} className="ambience-page ambience-briefing" />}
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
        {!broke && (
          <button type="button" className="secondary" onClick={() => dispatch({ type: 'OPEN_UPGRADES' })}>
            Melhorias do cartório
          </button>
        )}
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

export function UpgradeShop({ state, dispatch }: Props) {
  const { coins, upgrades } = state;
  // Faísca no cartão recém-comprado (some sozinha depois da animação).
  const [flash, setFlash] = useState<{ id: UpgradeId; n: number } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const buy = (id: UpgradeId) => {
    dispatch({ type: 'BUY_UPGRADE', id });
    setFlash((f) => ({ id, n: (f?.n ?? 0) + 1 }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 600);
  };

  return (
    <main className="screen upgrade-shop">
      <p className="eyebrow">Fim do dia {state.day} · Oficina do cartório</p>
      <h1>Melhorias do cartório</h1>
      <p className="lead">
        A Mestra deixa a chave do cofre sobre a mesa. Cada melhoria é permanente e vale para os
        próximos dias. Mas lembre-se: as despesas de amanhã também saem desse saldo.
      </p>

      <div className="shop-banner" role="img" aria-label="Prateleira da oficina do cartório, à luz de vela" />

      <p className="shop-balance" aria-live="polite">
        <PixelSprite src="/art/ui/icon-moeda-spin.png" frames={6} w={16} h={16} scale={2} fps={8} />
        Moedas: <strong>{coins}</strong>
      </p>

      <ul className="upgrade-list">
        {UPGRADES.map((u) => {
          const level = levelOf(upgrades, u.id);
          const cost = nextCost(upgrades, u.id);
          const affordable = canBuy(upgrades, u.id, coins);
          return (
            <li
              key={u.id}
              className={`upgrade-card${cost === null ? ' maxed' : ''}${flash?.id === u.id ? ' bought' : ''}`}
            >
              <span className="upgrade-icon">
                <PixelSprite src={`/art/ui/upg-${u.id}.png`} frames={4} w={24} h={24} scale={3} fps={cost === null ? 6 : 4} />
                {flash?.id === u.id && (
                  <PixelSprite
                    key={flash.n}
                    className="fx-burst"
                    src="/art/ui/fx-burst.png"
                    frames={6}
                    w={32}
                    h={32}
                    scale={3}
                    fps={12}
                    once
                  />
                )}
              </span>
              <div className="upgrade-body">
                <h2>{u.name}</h2>
                <p>{u.description}</p>
                <p className="muted">{u.perLevel}</p>
                <div className="upgrade-pips" role="img" aria-label={`Nível ${level} de ${u.costs.length}`}>
                  {u.costs.map((_, i) => (
                    <span key={i} className={`pip${i < level ? ' on' : ''}`} />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="secondary upgrade-buy"
                disabled={!affordable}
                onClick={() => buy(u.id)}
              >
                {cost === null ? 'Nível máximo' : `Comprar · ${cost}`}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="actions">
        <button type="button" className="primary" autoFocus onClick={() => dispatch({ type: 'CLOSE_UPGRADES' })}>
          Voltar ao balanço do dia
        </button>
      </div>
    </main>
  );
}
