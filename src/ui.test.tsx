import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Counter } from './components/Counter';
import { Briefing, DayEnd, Ending, Title } from './components/Screens';
import { MAX_DAY } from './game/constants';
import { createInitialState, reducer, type GameState } from './game/state';

const noop = () => {};

/** renderToString separa trechos de texto com <!-- -->; removemos para comparar o texto visível. */
const render = (el: Parameters<typeof renderToString>[0]) =>
  renderToString(el).replace(/<!-- -->/g, '');

describe('renderização das telas', () => {
  it('monta título, briefing, balcão, resultado, fim de dia e desfecho em todos os dias', () => {
    expect(render(<Title state={createInitialState()} dispatch={noop} />)).toContain('Cartório Arcano');

    let s: GameState = reducer(createInitialState(), { type: 'NEW_GAME' });

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
