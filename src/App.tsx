import { useEffect, useReducer, useState } from 'react';
import { Counter } from './components/Counter';
import { Cutscene } from './components/Cutscene';
import { Logo } from './components/Logo';
import { Briefing, DayEnd, Ending, Title } from './components/Screens';
import { isMuted, setMuted } from './game/audio';
import { GAME_YEAR, MAX_DAY, formatDate } from './game/constants';
import { INTRO_SCENES } from './game/cutscene';
import { createInitialState, reducer } from './game/state';
import { persistSave } from './game/storage';

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [muted, setMutedState] = useState(isMuted);

  const toggleSound = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  useEffect(() => {
    persistSave(state.save);
  }, [state.save]);

  const inGame = state.phase === 'playing' || state.phase === 'result';

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <Logo size={28} />
          Cartório Arcano
        </span>
        {state.phase !== 'title' && state.phase !== 'intro' && state.phase !== 'ending' && (
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
        <button
          type="button"
          className="mute-btn"
          aria-pressed={muted}
          aria-label={muted ? 'Ligar o som' : 'Desligar o som'}
          title={muted ? 'Som desligado' : 'Som ligado'}
          onClick={toggleSound}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </header>

      {state.phase === 'title' && <Title state={state} dispatch={dispatch} />}
      {state.phase === 'intro' && (
        <Cutscene scenes={INTRO_SCENES} onDone={() => dispatch({ type: 'INTRO_DONE' })} />
      )}
      {state.phase === 'briefing' && <Briefing state={state} dispatch={dispatch} />}
      {inGame && <Counter state={state} dispatch={dispatch} />}
      {state.phase === 'dayEnd' && <DayEnd state={state} dispatch={dispatch} />}
      {state.phase === 'ending' && <Ending state={state} dispatch={dispatch} />}
    </div>
  );
}
