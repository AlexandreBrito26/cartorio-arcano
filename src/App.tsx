import { useEffect, useReducer } from 'react';
import { Counter } from './components/Counter';
import { Briefing, DayEnd, Ending, Title } from './components/Screens';
import { GAME_YEAR, MAX_DAY, formatDate } from './game/constants';
import { createInitialState, reducer } from './game/state';
import { persistSave } from './game/storage';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    persistSave(state.save);
  }, [state.save]);

  const inGame = state.phase === 'playing' || state.phase === 'result';

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">✦ Cartório Arcano</span>
        {state.phase !== 'title' && state.phase !== 'ending' && (
          <dl className="hud">
            <div>
              <dt>Dia</dt>
              <dd>
                {state.day}/{MAX_DAY}
              </dd>
            </div>
            <div>
              <dt>Hoje</dt>
              <dd>
                {formatDate(state.rules.today)}, {GAME_YEAR}
              </dd>
            </div>
            <div>
              <dt>Moedas</dt>
              <dd className={state.coins < 0 ? 'negative' : undefined}>{state.coins}</dd>
            </div>
            {inGame && (
              <>
                <div>
                  <dt>Infrações</dt>
                  <dd>{state.stats.wrong}</dd>
                </div>
                <div>
                  <dt>Fila</dt>
                  <dd>
                    {state.index + 1}/{state.queue.length}
                  </dd>
                </div>
              </>
            )}
          </dl>
        )}
      </header>

      {state.phase === 'title' && <Title state={state} dispatch={dispatch} />}
      {state.phase === 'briefing' && <Briefing state={state} dispatch={dispatch} />}
      {inGame && <Counter state={state} dispatch={dispatch} />}
      {state.phase === 'dayEnd' && <DayEnd state={state} dispatch={dispatch} />}
      {state.phase === 'ending' && <Ending state={state} dispatch={dispatch} />}
    </div>
  );
}
