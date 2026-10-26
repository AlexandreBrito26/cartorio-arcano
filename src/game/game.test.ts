import { describe, expect, it } from 'vitest';
import { MAX_DAY, formatDate, getDayRules } from './constants';
import { buildApplicant, generateDay, mutateName } from './generator';
import { createRng } from './rng';
import { evaluate, judge } from './rules';
import { createInitialState, reducer } from './state';

const days = Array.from({ length: MAX_DAY }, (_, i) => i + 1);

describe('regras por dia', () => {
  it('acumulam regras e decretos ao longo dos dias', () => {
    expect(getDayRules(1).active).toEqual(['DOC_AUSENTE', 'NOME_DIVERGENTE']);
    expect(getDayRules(3).bannedRealms).toEqual(['Reino das Cinzas']);
    expect(getDayRules(5).bannedRealms).toContain('Pântano de Névoa');
    expect(getDayRules(5).active).toHaveLength(8);
  });

  it('formata datas', () => {
    expect(formatDate(100)).toBe('11 de Eclipse');
  });
});

describe('gerador', () => {
  it('viajantes sem falhas passam em todas as regras', () => {
    for (const day of days) {
      const rules = getDayRules(day);
      for (let seed = 1; seed <= 300; seed++) {
        const a = buildApplicant(createRng(seed), rules, [], 'x');
        expect(evaluate(a, rules), `dia ${day}, seed ${seed}`).toEqual([]);
      }
    }
  });

  it('cada falha injetada é detectada pelo avaliador', () => {
    for (const day of days) {
      const rules = getDayRules(day);
      for (const code of rules.active) {
        for (let seed = 1; seed <= 200; seed++) {
          const a = buildApplicant(createRng(seed * 7 + day), rules, [code], 'x');
          const found = evaluate(a, rules).map((v) => v.code);
          expect(found, `${code}, dia ${day}, seed ${seed}`).toContain(code);
        }
      }
    }
  });

  it('combinações de duas falhas também são detectadas', () => {
    const rules = getDayRules(5);
    const pairs: [typeof rules.active[number], typeof rules.active[number]][] = [
      ['REINO_PROIBIDO', 'REINO_DIVERGENTE'],
      ['NOME_DIVERGENTE', 'DOC_VENCIDO'],
      ['SELO_FALSO', 'IDADE_INSUFICIENTE'],
      ['SELO_AUSENTE', 'IDADE_INSUFICIENTE'],
    ];
    for (const [a, b] of pairs) {
      for (let seed = 1; seed <= 100; seed++) {
        const found = evaluate(buildApplicant(createRng(seed), rules, [a, b], 'x'), rules).map(
          (v) => v.code,
        );
        expect(found).toContain(a);
        expect(found).toContain(b);
      }
    }
  });

  it('a fila do dia tem o tamanho certo e mistura válidos e inválidos', () => {
    for (const day of days) {
      const rules = getDayRules(day);
      for (let seed = 1; seed <= 50; seed++) {
        const queue = generateDay(rules, seed);
        expect(queue).toHaveLength(rules.applicants);
        const invalid = queue.filter((a) => evaluate(a, rules).length > 0).length;
        expect(invalid).toBeGreaterThanOrEqual(1);
        expect(invalid).toBeLessThan(rules.applicants);
      }
    }
  });

  it('mutateName sempre altera o nome', () => {
    const rng = createRng(42);
    for (let i = 0; i < 200; i++) {
      expect(mutateName('Thalia Veyrun', rng)).not.toBe('Thalia Veyrun');
    }
  });
});

describe('julgamento', () => {
  const violation = [{ code: 'NOME_DIVERGENTE' as const, detail: '' }];

  it('aprovar quem está em ordem rende moedas', () => {
    expect(judge([], { kind: 'approve' })).toMatchObject({ verdict: 'perfect', delta: 6 });
  });

  it('aprovar irregular gera multa', () => {
    expect(judge(violation, { kind: 'approve' })).toMatchObject({ verdict: 'wrong', delta: -6 });
  });

  it('negar com o motivo certo, errado ou sem motivo', () => {
    expect(judge(violation, { kind: 'deny', reason: 'NOME_DIVERGENTE' }).verdict).toBe('perfect');
    expect(judge(violation, { kind: 'deny', reason: 'DOC_VENCIDO' }).verdict).toBe('partial');
    expect(judge([], { kind: 'deny', reason: 'DOC_VENCIDO' }).verdict).toBe('wrong');
  });
});

describe('fluxo do jogo', () => {
  it('joga um dia inteiro e termina na tela de fim de dia', () => {
    let s = reducer(createInitialState(), { type: 'NEW_GAME' });
    s = reducer(s, { type: 'START_DAY', seed: 123 });
    expect(s.phase).toBe('playing');

    while (s.phase === 'playing') {
      s = reducer(s, { type: 'DECIDE', decision: { kind: 'approve' } });
      s = reducer(s, { type: 'NEXT' });
    }

    expect(s.phase).toBe('dayEnd');
    expect(s.stats.correct + s.stats.partial + s.stats.wrong).toBe(s.rules.applicants);
    expect(s.stats.expenses).toBe(12);
  });
});
