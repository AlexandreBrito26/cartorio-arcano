import { useEffect, useReducer, useState } from 'react';
import { Counter } from './components/Counter';
import { Cutscene } from './components/Cutscene';
import { Diary } from './components/Diary';
import { Logo } from './components/Logo';
import { Briefing, DayEnd, Ending, EventScreen, Title } from './components/Screens';
import { isMuted, setMuted } from './game/audio';
import { GAME_YEAR, MAX_DAY, formatDate, timeLimit } from './game/constants';
import { INTRO_SCENES } from './game/cutscene';
import { createInitialState, reducer } from './game/state';
import { persistSave } from './game/storage';

/** Segundos restantes em mm:ss. */
function formatClock(seconds: number) {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [muted, setMutedState] = useState(isMuted);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const reachedDay = Math.max(state.day, state.save?.day ?? 1);

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
                {state.day > MAX_DAY ? `${state.day} · plantão` : `${state.day}/${MAX_DAY}`}
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
                  <dt>Na fila</dt>
                  <dd>{Math.max(0, state.arrived - state.index)}</dd>
                </div>
                <div>
                  <dt>Relógio</dt>
                  <dd className={timeLimit(state.rules.applicants) - state.elapsed <= 20 ? 'negative' : undefined}>
                    {formatClock(timeLimit(state.rules.applicants) - state.elapsed)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        )}
        {state.phase !== 'intro' && (
          <button type="button" className="diary-btn" onClick={() => setDiaryOpen(true)}>
            📖 Diário
          </button>
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

      {diaryOpen && <Diary reachedDay={reachedDay} onClose={() => setDiaryOpen(false)} />}
      {state.phase === 'title' && <Title state={state} dispatch={dispatch} />}
      {state.phase === 'intro' && (
        <Cutscene scenes={INTRO_SCENES} onDone={() => dispatch({ type: 'INTRO_DONE' })} />
      )}
      {state.phase === 'briefing' && <Briefing state={state} dispatch={dispatch} />}
      {state.phase === 'event' && <EventScreen state={state} dispatch={dispatch} />}
      {inGame && <Counter state={state} dispatch={dispatch} />}
      {state.phase === 'dayEnd' && <DayEnd state={state} dispatch={dispatch} />}
      {state.phase === 'ending' && <Ending state={state} dispatch={dispatch} />}
    </div>
  );
}
