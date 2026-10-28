import { LATE_PENALTY, MAX_DAY, START_COINS, START_QUEUE, getDayRules } from './constants';
import { arrivalEvery, buyUpgrade, expensesFor, timeLimitFor, type UpgradeId, type Upgrades } from './upgrades';
import { generateDay } from './generator';
import { evaluate, judge } from './rules';
import { loadSave, type SaveData } from './storage';
import { eventForDay } from './events';
import { cutsceneForDay, type CutsceneId } from './cutscene';
import type { Applicant, Decision, DecisionResult, DayRules } from './types';

export type Phase =
  | 'title'
  | 'cutscene'
  | 'briefing'
  | 'event'
  | 'playing'
  | 'result'
  | 'dayEnd'
  | 'upgrades'
  | 'ending';

export interface DayStats {
  correct: number;
  partial: number;
  wrong: number;
  earned: number;
  fined: number;
  expenses: number;
  /** Moedas perdidas com viajantes que o relógio deixou sem atendimento. */
  lost: number;
}

export interface GameState {
  phase: Phase;
  day: number;
  coins: number;
  /** Melhorias do cartório compradas até agora. */
  upgrades: Upgrades;
  rules: DayRules;
  queue: Applicant[];
  index: number;
  /** Segundos decorridos no dia (o relógio conta só durante a fila). */
  elapsed: number;
  /** Quantos viajantes da fila já chegaram ao balcão. */
  arrived: number;
  result: DecisionResult | null;
  /** Texto da escolha feita no evento do dia (null enquanto não escolhe). */
  eventOutcome: string | null;
  stats: DayStats;
  save: SaveData | null;
  /** Cena em exibição (fase 'cutscene') e a fase para a qual o jogo segue ao terminá-la. */
  cutscene: { id: CutsceneId; next: Phase } | null;
}

export type Action =
  | { type: 'NEW_GAME' }
  | { type: 'CONTINUE' }
  | { type: 'CUTSCENE_DONE' }
  | { type: 'START_DAY'; seed: number }
  | { type: 'DECIDE'; decision: Decision }
  | { type: 'NEXT' }
  | { type: 'NEXT_DAY' }
  | { type: 'OPEN_UPGRADES' }
  | { type: 'BUY_UPGRADE'; id: UpgradeId }
  | { type: 'CLOSE_UPGRADES' }
  | { type: 'TICK' }
  | { type: 'CHOOSE_EVENT'; option: number }
  | { type: 'EVENT_DONE' }
  | { type: 'CONTINUE_INFINITE' }
  | { type: 'TO_TITLE' };

const emptyStats = (): DayStats => ({
  correct: 0,
  partial: 0,
  wrong: 0,
  earned: 0,
  fined: 0,
  expenses: 0,
  lost: 0,
});

function freshGame(save: SaveData | null, day = 1, coins = START_COINS, upgrades: Upgrades = {}): GameState {
  return {
    phase: 'title',
    day,
    coins,
    upgrades,
    rules: getDayRules(day),
    queue: [],
    index: 0,
    elapsed: 0,
    arrived: 0,
    result: null,
    eventOutcome: null,
    stats: emptyStats(),
    save,
    cutscene: null,
  };
}

/** Fecha o dia: desconta perdas e despesas e decide se o cartório segue. */
function endOfDay(state: GameState, lost: number): GameState {
  const expenses = expensesFor(state.day, state.upgrades);
  const coins = state.coins - lost - expenses;
  const survived = coins >= 0;
  // Depois do último dia o plantão continua, então o save sempre aponta para o dia seguinte.
  const save: SaveData | null = survived ? { day: state.day + 1, coins, upgrades: state.upgrades } : state.save;

  return {
    ...state,
    phase: 'dayEnd',
    coins,
    result: null,
    stats: { ...state.stats, lost, expenses },
    save,
  };
}

/** Fase em que o jogo entra ao chegar num dia: evento, se houver, ou briefing. */
const dayEntryPhase = (day: number): Phase => (eventForDay(day) ? 'event' : 'briefing');

/** Passa para uma cena; ao terminar, o jogo segue para `next`. */
const playCutscene = (state: GameState, id: CutsceneId, next: Phase): GameState => ({
  ...state,
  phase: 'cutscene',
  cutscene: { id, next },
});

/** Avança para o dia seguinte, passando antes pela cena do dia, se houver. */
function enterDay(state: GameState, day: number): GameState {
  const next: GameState = {
    ...state,
    phase: dayEntryPhase(day),
    day,
    rules: getDayRules(day),
    queue: [],
    index: 0,
    elapsed: 0,
    arrived: 0,
    result: null,
    eventOutcome: null,
    stats: emptyStats(),
  };
  const scene = cutsceneForDay(day);
  return scene ? playCutscene(next, scene, next.phase) : next;
}

export const createInitialState = (): GameState => freshGame(loadSave());

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return playCutscene(freshGame(state.save), 'intro', 'briefing');

    case 'CUTSCENE_DONE':
      if (state.phase !== 'cutscene' || !state.cutscene) return state;
      return { ...state, phase: state.cutscene.next, cutscene: null };

    case 'CONTINUE': {
      if (!state.save) return state;
      const resumed = freshGame(state.save, state.save.day, state.save.coins, state.save.upgrades);
      const scene = cutsceneForDay(state.save.day);
      return scene ? playCutscene(resumed, scene, 'briefing') : { ...resumed, phase: 'briefing' };
    }

    case 'START_DAY': {
      if (state.phase !== 'briefing') return state;
      return {
        ...state,
        phase: 'playing',
        queue: generateDay(state.rules, action.seed),
        index: 0,
        elapsed: 0,
        arrived: Math.min(START_QUEUE, state.rules.applicants),
        result: null,
        stats: emptyStats(),
      };
    }

    case 'DECIDE': {
      if (state.phase !== 'playing') return state;
      if (state.index >= state.arrived) return state;
      const applicant = state.queue[state.index];
      if (!applicant) return state;

      const result = judge(evaluate(applicant, state.rules), action.decision, state.upgrades);
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

      return endOfDay(state, 0);
    }

    case 'TICK': {
      if (state.phase !== 'playing') return state;
      const elapsed = state.elapsed + 1;
      if (elapsed >= timeLimitFor(state.rules.applicants, state.upgrades)) {
        // O relógio zerou: quem ainda não foi atendido vai embora.
        const unattended = state.queue.length - state.index;
        return endOfDay({ ...state, elapsed }, unattended * LATE_PENALTY);
      }
      return {
        ...state,
        elapsed,
        arrived: Math.min(state.queue.length, START_QUEUE + Math.floor(elapsed / arrivalEvery(state.upgrades))),
      };
    }

    case 'NEXT_DAY': {
      if (state.phase !== 'dayEnd') return state;
      if (state.coins < 0) return { ...state, phase: 'title' };
      if (state.day >= MAX_DAY) return { ...state, phase: 'ending' };

      return enterDay(state, state.day + 1);
    }

    case 'OPEN_UPGRADES': {
      // A loja só abre com o cartório de pé e o balcão fechado.
      if (state.phase !== 'dayEnd' || state.coins < 0) return state;
      return { ...state, phase: 'upgrades' };
    }

    case 'BUY_UPGRADE': {
      if (state.phase !== 'upgrades') return state;
      const bought = buyUpgrade(state.upgrades, action.id, state.coins);
      if (!bought) return state;
      return {
        ...state,
        coins: bought.coins,
        upgrades: bought.upgrades,
        save: state.save ? { ...state.save, coins: bought.coins, upgrades: bought.upgrades } : null,
      };
    }

    case 'CLOSE_UPGRADES':
      if (state.phase !== 'upgrades') return state;
      return { ...state, phase: 'dayEnd' };

    case 'CHOOSE_EVENT': {
      if (state.phase !== 'event' || state.eventOutcome !== null) return state;
      const event = eventForDay(state.day);
      const option = event?.options[action.option];
      if (!option || state.coins + option.delta < 0) return state;
      const coins = state.coins + option.delta;
      return {
        ...state,
        coins,
        eventOutcome: option.outcome,
        save: state.save ? { ...state.save, coins } : null,
      };
    }

    case 'EVENT_DONE':
      if (state.phase !== 'event') return state;
      return { ...state, phase: 'briefing', eventOutcome: null };

    case 'CONTINUE_INFINITE': {
      if (state.phase !== 'ending') return state;
      return enterDay(state, state.day + 1);
    }

    case 'TO_TITLE':
      return { ...state, phase: 'title' };
  }
}
