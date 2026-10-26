import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Counter } from './components/Counter';
import { Cutscene } from './components/Cutscene';
import { Logo } from './components/Logo';
import { Briefing, DayEnd, Ending, Title } from './components/Screens';
import { MAX_DAY } from './game/constants';
import { INTRO_SCENES } from './game/cutscene';
import { createInitialState, reducer, type GameState } from './game/state';

const noop = () => {};

/** renderToString separa trechos de texto com <!-- -->; removemos para comparar o texto visível. */
const render = (el: Parameters<typeof renderToString>[0]) =>
  renderToString(el).replace(/<!-- -->/g, '');

describe('renderização das telas', () => {
  it('monta título, briefing, balcão, resultado, fim de dia e desfecho em todos os dias', () => {
    expect(render(<Title state={createInitialState()} dispatch={noop} />)).toContain('Cartório Arcano');

    let s: GameState = reducer(createInitialState(), { type: 'NEW_GAME' });
    expect(s.phase).toBe('intro');
    s = reducer(s, { type: 'INTRO_DONE' });
    expect(s.phase).toBe('briefing');

    for (let day = 1; day <= MAX_DAY; day++) {
      expect(render(<Briefing state={s} dispatch={noop} />)).toContain(`Dia ${day} de ${MAX_DAY}`);

      s = reducer(s, { type: 'START_DAY', seed: day * 991 });

      while (s.phase === 'playing') {
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
    expect(reducer(base, { type: 'NEW_GAME' }).phase).toBe('intro');
    expect(reducer(reducer(base, { type: 'NEW_GAME' }), { type: 'START_DAY', seed: 1 }).phase).toBe('intro');
    const withSave = { ...base, save: { day: 3, coins: 20 } };
    expect(reducer(withSave, { type: 'CONTINUE' }).phase).toBe('briefing');
  });
});
