import { describe, expect, it } from 'vitest';
import { isMuted, playResult, setMuted } from './audio';
import { MAX_DAY, MONTH_NAMES, formatDate, formatDateFull, getDayRules } from './constants';
import { buildApplicant, generateDay, mutateName } from './generator';
import { createRng } from './rng';
import { evaluate, judge } from './rules';
import { createInitialState, reducer, type GameState } from './state';

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

describe('áudio', () => {
  it('não quebra fora do navegador e respeita o mudo', () => {
    expect(() => playResult('approve', 'perfect')).not.toThrow();
    expect(() => playResult('deny', 'wrong')).not.toThrow();
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(() => playResult('deny', 'partial')).not.toThrow();
    setMuted(false);
    expect(isMuted()).toBe(false);
  });
});

describe('fluxo do jogo', () => {
  it('joga um dia inteiro e termina na tela de fim de dia', () => {
    let s = reducer(reducer(createInitialState(), { type: 'NEW_GAME' }), { type: 'CUTSCENE_DONE' });
    s = reducer(s, { type: 'START_DAY', seed: 123 });
    expect(s.phase).toBe('playing');

    while (s.phase === 'playing') {
      if (s.index >= s.arrived) {
        s = reducer(s, { type: 'TICK' });
        continue;
      }
      s = reducer(s, { type: 'DECIDE', decision: { kind: 'approve' } });
      s = reducer(s, { type: 'NEXT' });
    }

    expect(s.phase).toBe('dayEnd');
    expect(s.stats.correct + s.stats.partial + s.stats.wrong).toBe(s.rules.applicants);
    expect(s.stats.expenses).toBe(12);
  });
});

describe('eventos de história', () => {
  it('um evento antecede o dia certo e a escolha altera o saldo', () => {
    let s: GameState = { ...createInitialState(), phase: 'dayEnd', day: 1, coins: 20, save: { day: 2, coins: 20, upgrades: {} } };
    s = reducer(s, { type: 'NEXT_DAY' });
    expect(s.phase).toBe('event');
    expect(s.day).toBe(2);

    s = reducer(s, { type: 'CHOOSE_EVENT', option: 0 });
    expect(s.coins).toBe(25);
    expect(s.save?.coins).toBe(25);
    expect(s.eventOutcome).not.toBeNull();

    s = reducer(s, { type: 'EVENT_DONE' });
    expect(s.phase).toBe('briefing');
  });

  it('não deixa escolher uma opção que deixaria o saldo negativo', () => {
    const base: GameState = { ...createInitialState(), phase: 'event', day: 4, coins: 1, eventOutcome: null };
    expect(reducer(base, { type: 'CHOOSE_EVENT', option: 0 })).toBe(base);
  });

  it('dias sem evento vão direto ao briefing', () => {
    const s: GameState = { ...createInitialState(), phase: 'dayEnd', day: 2, coins: 20 };
    expect(reducer(s, { type: 'NEXT_DAY' }).phase).toBe('briefing');
  });
});

describe('plantão infinito', () => {
  it('depois do dia 20 a fila cresce até o teto, sem regras novas', () => {
    const d20 = getDayRules(MAX_DAY);
    expect(getDayRules(MAX_DAY + 1).applicants).toBe(d20.applicants + 1);
    expect(getDayRules(MAX_DAY + 1).newCodes).toEqual([]);
    expect(getDayRules(200).applicants).toBe(25);
    expect(getDayRules(MAX_DAY + 1).today).toBe(getDayRules(MAX_DAY).today + 1);
  });

  it('o desfecho oferece continuar no plantão a partir do dia seguinte', () => {
    const s: GameState = { ...createInitialState(), phase: 'ending', day: MAX_DAY, coins: 50 };
    const next = reducer(s, { type: 'CONTINUE_INFINITE' });
    expect(next.phase).toBe('briefing');
    expect(next.day).toBe(MAX_DAY + 1);
  });
});

import { DIARY_TABS, GUILD_LORE, REALM_LORE, SPECIES_LORE, entriesFor, isUnlocked, unlockedCount } from './lore';
import { GUILDS, MAX_DAY as LORE_MAX_DAY, REALMS, SPECIES } from './constants';

describe('lore', () => {
  it('cobre todo reino, espécie e guilda do jogo', () => {
    for (const r of REALMS) expect(REALM_LORE[r].body.length).toBeGreaterThan(0);
    for (const s of SPECIES) expect(SPECIES_LORE[s].body.length).toBeGreaterThan(0);
    for (const g of GUILDS) expect(GUILD_LORE[g].body.length).toBeGreaterThan(0);
  });

  it('ids são únicos por aba e os dias de desbloqueio ficam dentro da campanha', () => {
    for (const t of DIARY_TABS) {
      const list = entriesFor(t.id);
      expect(new Set(list.map((e) => e.id)).size).toBe(list.length);
      for (const e of list) {
        expect(e.unlockDay).toBeGreaterThanOrEqual(1);
        expect(e.unlockDay).toBeLessThanOrEqual(LORE_MAX_DAY);
      }
    }
  });

  it('o diário abre aos poucos e fica completo no fim da campanha', () => {
    const d1 = unlockedCount(1);
    const end = unlockedCount(LORE_MAX_DAY);
    expect(d1.open).toBeGreaterThan(0);
    expect(d1.open).toBeLessThan(end.open);
    expect(end.open).toBe(end.total);
    expect(isUnlocked(REALM_LORE['Reino das Cinzas'], 2)).toBe(false);
    expect(isUnlocked(REALM_LORE['Reino das Cinzas'], 3)).toBe(true);
  });
});

describe('datas com número do mês', () => {
  it('mostra a ordem do mês para comparar validade e "hoje"', () => {
    expect(formatDateFull(100)).toBe('11 de Eclipse (4º mês)');
    expect(formatDateFull(0)).toBe('1 de Névoa (1º mês)');
    expect(formatDateFull(359)).toBe('30 de Veludo (12º mês)');
    expect(MONTH_NAMES).toHaveLength(12);
    // Uma data posterior sempre tem (mês, dia) maior, e o número do mês deixa isso à vista.
    const month = (n: number) => Number(/\((\d+)º mês\)/.exec(formatDateFull(n))![1]);
    for (let n = 0; n < 359; n++) expect(month(n + 1)).toBeGreaterThanOrEqual(month(n));
  });
});
