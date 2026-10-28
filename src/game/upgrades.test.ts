import { describe, expect, it } from 'vitest';
import { FINE, REWARD_APPROVE, REWARD_DENY, SECONDS_PER_APPLICANT, ARRIVAL_EVERY, dailyExpenses } from './constants';
import { judge } from './rules';
import { createInitialState, reducer, type GameState } from './state';
import {
  UPGRADES,
  arrivalEvery,
  buyUpgrade,
  canBuy,
  expensesFor,
  fineAmount,
  maxLevel,
  nextCost,
  rewardApprove,
  rewardDeny,
  sanitizeUpgrades,
  timeLimitFor,
} from './upgrades';

const shopState = (coins: number, upgrades = {}): GameState => ({
  ...createInitialState(),
  phase: 'dayEnd',
  day: 1,
  coins,
  upgrades,
  save: { day: 2, coins, upgrades },
});

describe('efeitos das melhorias', () => {
  it('sem melhorias, os valores são os de base', () => {
    expect(rewardApprove()).toBe(REWARD_APPROVE);
    expect(rewardDeny({})).toBe(REWARD_DENY);
    expect(fineAmount()).toBe(FINE);
    expect(expensesFor(4)).toBe(dailyExpenses(4));
    expect(timeLimitFor(10)).toBe(10 * SECONDS_PER_APPLICANT);
    expect(arrivalEvery()).toBe(ARRIVAL_EVERY);
  });

  it('cada nível altera o valor como descrito', () => {
    expect(rewardApprove({ carimbo: 2 })).toBe(REWARD_APPROVE + 2);
    expect(fineAmount({ seguro: 2 })).toBe(FINE - 2);
    expect(expensesFor(1, { cofre: 3 })).toBe(dailyExpenses(1) - 6);
    expect(timeLimitFor(10, { ampulheta: 1 })).toBe(10 * (SECONDS_PER_APPLICANT + 2));
    expect(arrivalEvery({ balcao: 2 })).toBe(ARRIVAL_EVERY + 2);
  });

  it('multa e despesas nunca ficam negativas, em nenhum nível', () => {
    for (const u of UPGRADES) {
      const all = { [u.id]: maxLevel(u.id) };
      expect(fineAmount(all)).toBeGreaterThanOrEqual(1);
      for (let day = 1; day <= 25; day++) expect(expensesFor(day, all)).toBeGreaterThanOrEqual(0);
    }
  });

  it('judge usa o carimbo e o seguro', () => {
    const clean = judge([], { kind: 'approve' }, { carimbo: 1 });
    expect(clean.delta).toBe(REWARD_APPROVE + 1);
    const wrong = judge([{ code: 'DOC_AUSENTE', detail: 'x' }], { kind: 'approve' }, { seguro: 1 });
    expect(wrong.delta).toBe(-(FINE - 1));
  });
});

describe('compra', () => {
  it('só compra com saldo suficiente e até o nível máximo', () => {
    const cost = nextCost({}, 'carimbo')!;
    expect(canBuy({}, 'carimbo', cost - 1)).toBe(false);
    expect(buyUpgrade({}, 'carimbo', cost - 1)).toBeNull();

    let ups = {};
    let coins = 1000;
    for (let i = 0; i < maxLevel('carimbo'); i++) {
      const r = buyUpgrade(ups, 'carimbo', coins)!;
      expect(r.coins).toBeLessThan(coins);
      ups = r.upgrades;
      coins = r.coins;
    }
    expect(nextCost(ups, 'carimbo')).toBeNull();
    expect(buyUpgrade(ups, 'carimbo', 1000)).toBeNull();
  });

  it('reducer: abrir a loja, comprar, debitar e persistir no save', () => {
    let s = shopState(100);
    s = reducer(s, { type: 'OPEN_UPGRADES' });
    expect(s.phase).toBe('upgrades');

    const cost = nextCost({}, 'carimbo')!;
    s = reducer(s, { type: 'BUY_UPGRADE', id: 'carimbo' });
    expect(s.coins).toBe(100 - cost);
    expect(s.upgrades.carimbo).toBe(1);
    expect(s.save).toEqual({ day: 2, coins: 100 - cost, upgrades: { carimbo: 1 } });

    s = reducer(s, { type: 'CLOSE_UPGRADES' });
    expect(s.phase).toBe('dayEnd');
  });

  it('reducer: sem saldo nada muda, e fora da loja a compra é ignorada', () => {
    const poor = reducer(shopState(1), { type: 'OPEN_UPGRADES' });
    expect(reducer(poor, { type: 'BUY_UPGRADE', id: 'carimbo' })).toBe(poor);
    const outside = shopState(100);
    expect(reducer(outside, { type: 'BUY_UPGRADE', id: 'carimbo' })).toBe(outside);
  });

  it('reducer: loja não abre com o cartório falido; novo jogo zera as melhorias', () => {
    const broke = shopState(-3);
    expect(reducer(broke, { type: 'OPEN_UPGRADES' })).toBe(broke);
    const fresh = reducer(shopState(50, { carimbo: 2 }), { type: 'NEW_GAME' });
    expect(fresh.upgrades).toEqual({});
  });

  it('o dia seguinte continua depois da loja e as despesas usam a Despensa', () => {
    let s = shopState(100, { cofre: 1 });
    s = reducer(s, { type: 'NEXT_DAY' });
    expect(s.day).toBe(2);
    expect(s.upgrades.cofre).toBe(1);
  });
});

describe('save', () => {
  it('saneia dados inválidos e limita ao nível máximo', () => {
    expect(sanitizeUpgrades(undefined)).toEqual({});
    expect(sanitizeUpgrades({ carimbo: 99, seguro: -1, cofre: 1.5, lixo: 3, balcao: 'x' })).toEqual({
      carimbo: maxLevel('carimbo'),
    });
  });
});
