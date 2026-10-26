import { MAX_DAY, START_COINS, dailyExpenses, getDayRules } from './constants';
import { generateDay } from './generator';
import { evaluate, judge } from './rules';
import { loadSave, type SaveData } from './storage';
import type { Applicant, Decision, DecisionResult, DayRules } from './types';

export type Phase = 'title' | 'intro' | 'briefing' | 'playing' | 'result' | 'dayEnd' | 'ending';

export interface DayStats {
  correct: number;
  partial: number;
  wrong: number;
  earned: number;
  fined: number;
  expenses: number;
}

export interface GameState {
  phase: Phase;
  day: number;
  coins: number;
  rules: DayRules;
  queue: Applicant[];
  index: number;
  result: DecisionResult | null;
  stats: DayStats;
  save: SaveData | null;
}

export type Action =
  | { type: 'NEW_GAME' }
  | { type: 'CONTINUE' }
  | { type: 'INTRO_DONE' }
  | { type: 'START_DAY'; seed: number }
  | { type: 'DECIDE'; decision: Decision }
  | { type: 'NEXT' }
  | { type: 'NEXT_DAY' }
  | { type: 'TO_TITLE' };

const emptyStats = (): DayStats => ({
  correct: 0,
  partial: 0,
  wrong: 0,
  earned: 0,
  fined: 0,
  expenses: 0,
});

function freshGame(save: SaveData | null, day = 1, coins = START_COINS): GameState {
  return {
    phase: 'title',
    day,
    coins,
    rules: getDayRules(day),
    queue: [],
    index: 0,
    result: null,
    stats: emptyStats(),
    save,
  };
}

export const createInitialState = (): GameState => freshGame(loadSave());

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return { ...freshGame(state.save), phase: 'intro' };

    case 'INTRO_DONE':
      if (state.phase !== 'intro') return state;
      return { ...state, phase: 'briefing' };

    case 'CONTINUE': {
      if (!state.save) return state;
      return { ...freshGame(state.save, state.save.day, state.save.coins), phase: 'briefing' };
    }

    case 'START_DAY': {
      if (state.phase !== 'briefing') return state;
      return {
        ...state,
        phase: 'playing',
        queue: generateDay(state.rules, action.seed),
        index: 0,
        result: null,
        stats: emptyStats(),
      };
    }

    case 'DECIDE': {
      if (state.phase !== 'playing') return state;
      const applicant = state.queue[state.index];
      if (!applicant) return state;

      const result = judge(evaluate(applicant, state.rules), action.decision);
      const stats = { ...state.stats };
      if (result.verdict === 'perfect') stats.correct += 1;
      else if (result.verdict === 'partial') stats.partial += 1;
      else stats.wrong += 1;
      if (result.delta > 0) stats.earned += result.delta;
      else stats.fined -= result.delta;

      return { ...state, phase: 'result', result, stats, coins: state.coins + result.delta };
    }

    case 'NEXT': {
      if (state.phase !== 'result') return state;

      if (state.index + 1 < state.queue.length) {
        return { ...state, phase: 'playing', index: state.index + 1, result: null };
      }

      const expenses = dailyExpenses(state.day);
      const coins = state.coins - expenses;
      const survived = coins >= 0;
      const save: SaveData | null = !survived
        ? state.save
        : state.day < MAX_DAY
          ? { day: state.day + 1, coins }
          : null;

      return {
        ...state,
        phase: 'dayEnd',
        coins,
        result: null,
        stats: { ...state.stats, expenses },
        save,
      };
    }

    case 'NEXT_DAY': {
      if (state.phase !== 'dayEnd') return state;
      if (state.coins < 0) return { ...state, phase: 'title' };
      if (state.day >= MAX_DAY) return { ...state, phase: 'ending' };

      const day = state.day + 1;
      return {
        ...state,
        phase: 'briefing',
        day,
        rules: getDayRules(day),
        queue: [],
        index: 0,
        result: null,
        stats: emptyStats(),
      };
    }

    case 'TO_TITLE':
      return { ...state, phase: 'title' };
  }
}
