import { describe, expect, it, vi } from 'vitest';

// Agenda de teste: uma cena antes do dia 3, já que a real ainda está vazia.
vi.mock('./cutscene', async (orig) => {
  const real = await orig<typeof import('./cutscene')>();
  return { ...real, cutsceneForDay: (day: number) => (day === 3 ? ('intro' as const) : undefined) };
});

const { createInitialState, reducer } = await import('./state');

describe('cena antes de um dia da campanha', () => {
  it('passa pela cena ao chegar no dia agendado e depois segue para o evento ou briefing', () => {
    const base = { ...createInitialState(), phase: 'dayEnd' as const, day: 2, coins: 50 };
    const toDay3 = reducer(base, { type: 'NEXT_DAY' });
    expect(toDay3.phase).toBe('cutscene');
    expect(toDay3.day).toBe(3);
    expect(toDay3.cutscene).toEqual({ id: 'intro', next: 'briefing' });
    expect(reducer(toDay3, { type: 'CUTSCENE_DONE' }).phase).toBe('briefing');
  });

  it('dias sem cena agendada seguem direto', () => {
    const base = { ...createInitialState(), phase: 'dayEnd' as const, day: 3, coins: 50 };
    expect(reducer(base, { type: 'NEXT_DAY' }).phase).not.toBe('cutscene');
  });

  it('continuar um save no dia agendado mostra a cena antes do briefing', () => {
    const withSave = { ...createInitialState(), save: { day: 3, coins: 20 } };
    const s = reducer(withSave, { type: 'CONTINUE' });
    expect(s.phase).toBe('cutscene');
    expect(reducer(s, { type: 'CUTSCENE_DONE' }).phase).toBe('briefing');
  });
});
