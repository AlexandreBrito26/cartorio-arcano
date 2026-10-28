import { useEffect, useReducer, useRef, useState } from 'react';
import { Counter } from './components/Counter';
import { Cutscene } from './components/Cutscene';
import { Diary } from './components/Diary';
import { Logo } from './components/Logo';
import { PixelSprite } from './components/PixelSprite';
import { SkinContext, SuitContext } from './components/SkinContext';
import { SkinShop } from './components/SkinShop';
import { Briefing, DayEnd, Ending, EventScreen, Title, UpgradeShop } from './components/Screens';
import { isMuted, setMuted } from './game/audio';
import { GAME_YEAR, MAX_DAY, formatDateFull } from './game/constants';
import { timeLimitFor } from './game/upgrades';
import { CUTSCENES, type CutsceneId } from './game/cutscene';
import { createInitialState, reducer } from './game/state';
import { suitDef } from './game/suits';
import { ENDING_SELOS, buySkin, buySuit, equipSkin, equipSuit, grantSelos, selosForDay, skinCssVars, skinDef, type SkinId } from './game/skins';
import { loadSkins, persistSave, persistSkins } from './game/storage';
import { preloadBundle, preloadBundles } from './render/assets';

/** Segundos restantes em mm:ss. */
function formatClock(seconds: number) {
  const s = Math.max(0, seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [muted, setMutedState] = useState(isMuted);
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [replayId, setReplayId] = useState<CutsceneId | null>(null);
  const reachedDay = Math.max(state.day, state.save?.day ?? 1);

  // Skins e Selos: ficam à parte do save do expediente.
  const [skins, setSkins] = useState(loadSkins);
  const [skinsOpen, setSkinsOpen] = useState(false);
  const [previewId, setPreviewId] = useState<SkinId | null>(null);
  const [selosGain, setSelosGain] = useState(0);
  const grantedDay = useRef(0);
  const endingGranted = useRef(false);
  const activeSkin = skinDef(previewId ?? skins.equipped);
  const activeSuit = suitDef(skins.suit);

  const toggleSound = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  useEffect(() => {
    persistSave(state.save);
  }, [state.save]);

  useEffect(() => {
    persistSkins(skins);
  }, [skins]);

  // A skin em uso (ou em prévia) troca as variáveis de cor da página inteira.
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(skinCssVars(activeSkin))) root.style.setProperty(name, value);
    root.dataset.skin = activeSkin.id;
  }, [activeSkin]);

  // Selos: um por dia fechado sem falir (mais, a cada quinto dia) e um bônus no fim da campanha.
  useEffect(() => {
    let gain = 0;
    if (state.phase === 'title') {
      grantedDay.current = 0;
      endingGranted.current = false;
    } else if (state.phase === 'dayEnd' && state.coins >= 0 && grantedDay.current !== state.day) {
      grantedDay.current = state.day;
      gain = selosForDay(state.day);
    } else if (state.phase === 'ending' && !endingGranted.current) {
      endingGranted.current = true;
      gain = ENDING_SELOS;
    }
    if (gain > 0) {
      setSkins((s) => grantSelos(s, gain));
      setSelosGain(gain);
    }
  }, [state.phase, state.day, state.coins]);

  useEffect(() => {
    if (!selosGain) return;
    const id = window.setTimeout(() => setSelosGain(0), 4000);
    return () => window.clearTimeout(id);
  }, [selosGain]);

  const closeSkins = () => {
    setPreviewId(null);
    setSkinsOpen(false);
  };

  // Pré-carga de texturas por fase, para não haver "pop-in" ao entrar na cena.
  useEffect(() => {
    if (state.phase === 'title') return; // o Pixi só é baixado quando o jogador mostra intenção de jogar (Title)
    if (state.phase === 'cutscene') void preloadBundles(['abertura', 'balcao', 'personagens']);
    else void preloadBundle('balcao').then(() => preloadBundle('personagens'));
  }, [state.phase]);

  const inGame = state.phase === 'playing' || state.phase === 'result';

  return (
    <SkinContext.Provider value={activeSkin}>
    <SuitContext.Provider value={activeSuit}>
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <Logo size={28} />
          Cartório das Brumas
        </span>
        {state.phase !== 'title' && state.phase !== 'cutscene' && state.phase !== 'ending' && (
          <dl className="hud">
            <div>
              <dt><img src="/art/ui/icon-dia.png" alt="" className="hud-icon" />Dia</dt>
              <dd>
                {state.day > MAX_DAY ? `${state.day} · plantão` : `${state.day}/${MAX_DAY}`}
              </dd>
            </div>
            <div>
              <dt>Hoje</dt>
              <dd>
                {formatDateFull(state.rules.today)}, {GAME_YEAR}
              </dd>
            </div>
            <div>
              <dt><PixelSprite src="/art/ui/icon-moeda-spin.png" frames={6} w={16} h={16} scale={1} fps={4} className="hud-coin" />Moedas</dt>
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
                  <dd className={timeLimitFor(state.rules.applicants, state.upgrades) - state.elapsed <= 20 ? 'negative' : undefined}>
                    {formatClock(timeLimitFor(state.rules.applicants, state.upgrades) - state.elapsed)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        )}
        {selosGain > 0 && (
          <span className="selos-gain" role="status">
            +{selosGain} {selosGain === 1 ? 'Selo' : 'Selos'}
          </span>
        )}
        {state.phase !== 'cutscene' && !inGame && (
          <button type="button" className="diary-btn skins-btn" onClick={() => setSkinsOpen(true)}>
            🎨 Skins · {skins.selos}
          </button>
        )}
        {state.phase !== 'cutscene' && (
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

      {skinsOpen && (
        <SkinShop
          skins={skins}
          previewId={previewId}
          onPreview={setPreviewId}
          onBuy={(id) => {
            setPreviewId(null);
            setSkins((s) => buySkin(s, id) ?? s);
          }}
          onEquip={(id) => setSkins((s) => equipSkin(s, id))}
          onBuySuit={(id) => setSkins((s) => buySuit(s, id) ?? s)}
          onEquipSuit={(id) => setSkins((s) => equipSuit(s, id))}
          onClose={closeSkins}
        />
      )}
      {diaryOpen && (
        <Diary
          reachedDay={reachedDay}
          canReplay={!inGame}
          onClose={() => setDiaryOpen(false)}
          onReplay={(id) => {
            setDiaryOpen(false);
            setReplayId(id);
          }}
        />
      )}
      {replayId && (
        <div className="replay-overlay">
          <Cutscene
            scenes={CUTSCENES[replayId].scenes}
            label={CUTSCENES[replayId].title}
            titleCard={CUTSCENES[replayId].titleCard}
            doneLabel="Voltar ao Diário"
            onDone={() => {
              setReplayId(null);
              setDiaryOpen(true);
            }}
          />
        </div>
      )}
      {state.phase === 'title' && <Title state={state} dispatch={dispatch} />}
      {state.phase === 'cutscene' && state.cutscene && (
        <Cutscene
          key={state.cutscene.id}
          scenes={CUTSCENES[state.cutscene.id].scenes}
          label={CUTSCENES[state.cutscene.id].title}
          titleCard={CUTSCENES[state.cutscene.id].titleCard}
          doneLabel={CUTSCENES[state.cutscene.id].doneLabel}
          onDone={() => dispatch({ type: 'CUTSCENE_DONE' })}
        />
      )}
      {state.phase === 'briefing' && <Briefing state={state} dispatch={dispatch} />}
      {state.phase === 'event' && <EventScreen state={state} dispatch={dispatch} />}
      {inGame && <Counter state={state} dispatch={dispatch} />}
      {state.phase === 'dayEnd' && <DayEnd state={state} dispatch={dispatch} />}
      {state.phase === 'upgrades' && <UpgradeShop state={state} dispatch={dispatch} />}
      {state.phase === 'ending' && <Ending state={state} dispatch={dispatch} />}
    </div>
    </SuitContext.Provider>
    </SkinContext.Provider>
  );
}
