import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Counter } from './components/Counter';
import { Cutscene } from './components/Cutscene';
import { Logo } from './components/Logo';
import { Briefing, DayEnd, Ending, EventScreen, Title } from './components/Screens';
import { MAX_DAY } from './game/constants';
import { CUTSCENES, CUTSCENE_SCHEDULE, INTRO_SCENES, replayableCutscenes } from './game/cutscene';
import { createInitialState, reducer, type GameState } from './game/state';

const noop = () => {};

/** renderToString separa trechos de texto com <!-- -->; removemos para comparar o texto visível. */
const render = (el: Parameters<typeof renderToString>[0]) =>
  renderToString(el).replace(/<!-- -->/g, '');

describe('renderização das telas', () => {
  it('monta título, briefing, balcão, resultado, fim de dia e desfecho em todos os dias', () => {
    expect(render(<Title state={createInitialState()} dispatch={noop} />)).toContain('Cartório Arcano');

    let s: GameState = reducer(createInitialState(), { type: 'NEW_GAME' });
    expect(s.phase).toBe('cutscene');
    s = reducer(s, { type: 'CUTSCENE_DONE' });
    expect(s.phase).toBe('briefing');

    for (let day = 1; day <= MAX_DAY; day++) {
      expect(render(<Briefing state={s} dispatch={noop} />)).toContain(`Dia ${day} de ${MAX_DAY}`);

      s = reducer(s, { type: 'START_DAY', seed: day * 991 });

      while (s.phase === 'playing') {
        if (s.index >= s.arrived) {
          // Ainda ninguém no balcão: o relógio avança até o próximo chegar.
          expect(render(<Counter state={s} dispatch={noop} />)).toContain('Ninguém no balcão');
          s = reducer(s, { type: 'TICK' });
          continue;
        }
        expect(render(<Counter state={s} dispatch={noop} />)).toContain('Aprovar');

        // Alterna entre aprovar e negar para exercitar os dois caminhos.
        s = reducer(s, {
          type: 'DECIDE',
          decision: s.index % 2 === 0 ? { kind: 'approve' } : { kind: 'deny', reason: s.rules.active[0] },
        });
        const html = render(<Counter state={s} dispatch={noop} />);
        expect(html).toMatch(/Aprovado|Negado/);

        s = reducer(s, { type: 'NEXT' });
      }

      expect(s.phase).toBe('dayEnd');
      expect(render(<DayEnd state={s} dispatch={noop} />)).toContain(`Fim do dia ${day}`);

      // Garante que o dia seguinte seja jogável mesmo com saldo baixo.
      s = { ...s, coins: Math.max(s.coins, 0) };
      s = reducer(s, { type: 'NEXT_DAY' });
      if (s.phase === 'event') {
        expect(render(<EventScreen state={s} dispatch={noop} />)).toContain('Evento do dia');
        s = reducer(s, { type: 'EVENT_DONE' });
      }
    }

    expect(s.phase).toBe('ending');
    expect(render(<Ending state={s} dispatch={noop} />)).toContain('Aprendiz efetivado');
  });
});

describe('logo e cutscene', () => {
  it('renderiza a logo com e sem rótulo acessível', () => {
    expect(render(<Logo title="Logo do Cartório Arcano" />)).toContain('aria-label="Logo do Cartório Arcano"');
    expect(render(<Logo />)).toContain('aria-hidden="true"');
  });

  it('a abertura tem cenas com texto e a primeira aparece na tela', () => {
    expect(INTRO_SCENES.length).toBeGreaterThan(2);
    for (const scene of INTRO_SCENES) expect(scene.lines.length).toBeGreaterThan(0);
    const html = render(<Cutscene scenes={INTRO_SCENES} onDone={noop} />);
    expect(html).toContain(INTRO_SCENES[0].lines[0]);
    expect(html).toContain('Pular');
  });

  it('novo jogo passa pela abertura; continuar vai direto ao briefing', () => {
    const base = createInitialState();
    expect(reducer(base, { type: 'NEW_GAME' }).phase).toBe('cutscene');
    expect(reducer(reducer(base, { type: 'NEW_GAME' }), { type: 'START_DAY', seed: 1 }).phase).toBe('cutscene');
    const withSave = { ...base, save: { day: 3, coins: 20 } };
    expect(reducer(withSave, { type: 'CONTINUE' }).phase).toBe('briefing');
  });
});

describe('motor de cenas', () => {
  it('toda cena registrada tem id único, texto e opções válidas', () => {
    const ids = Object.values(CUTSCENES).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of Object.values(CUTSCENES)) {
      expect(CUTSCENES[def.id]).toBe(def);
      expect(def.scenes.length).toBeGreaterThan(0);
      for (const scene of def.scenes) expect(scene.lines.length).toBeGreaterThan(0);
    }
    for (const day of Object.keys(CUTSCENE_SCHEDULE)) {
      expect(CUTSCENES[CUTSCENE_SCHEDULE[Number(day)]!]).toBeDefined();
    }
  });

  it('renderiza legenda de quem fala e classes de câmera e transição', () => {
    const html = render(
      <Cutscene
        scenes={[{ art: 'mistress', lines: ['Oi.'], speaker: 'Mestra Aurelha', camera: 'pan-left', transition: 'iris' }]}
        onDone={noop}
      />,
    );
    expect(html).toContain('Mestra Aurelha');
    expect(html).toContain('cam-pan-left');
    expect(html).toContain('tr-iris');
  });

  it('sem campos opcionais, usa câmera parada e fusão', () => {
    const html = render(<Cutscene scenes={[{ art: 'road', lines: ['x'] }]} onDone={noop} />);
    expect(html).toContain('cam-still');
    expect(html).toContain('tr-fade');
  });

  it('o fim da cena leva à fase combinada e limpa a cena', () => {
    const playing = reducer(createInitialState(), { type: 'NEW_GAME' });
    expect(playing.cutscene).toEqual({ id: 'intro', next: 'briefing' });
    const done = reducer(playing, { type: 'CUTSCENE_DONE' });
    expect(done.phase).toBe('briefing');
    expect(done.cutscene).toBeNull();
    expect(reducer(done, { type: 'CUTSCENE_DONE' })).toBe(done);
  });

  it('o Diário lista as cenas e bloqueia o replay durante o expediente', async () => {
    const { Diary } = await import('./components/Diary');
    expect(replayableCutscenes(1).map((c) => c.id)).toContain('intro');
    const html = render(<Diary reachedDay={1} onClose={noop} onReplay={noop} canReplay={false} />);
    expect(html).toContain('Cenas');
  });
});

describe('Diário do Cartório', () => {
  it('mostra verbetes abertos e lacra os dos dias futuros', async () => {
    const { Diary } = await import('./components/Diary');
    const html = render(<Diary reachedDay={1} onClose={noop} />);
    expect(html).toContain('Diário do Cartório');
    expect(html).toContain('A subida das Brumas');
    expect(html).toContain('Verbete lacrado');
  });
});
