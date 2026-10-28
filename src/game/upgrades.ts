import {
  ARRIVAL_EVERY,
  FINE,
  REWARD_APPROVE,
  REWARD_DENY,
  REWARD_DENY_PARTIAL,
  SECONDS_PER_APPLICANT,
  dailyExpenses,
} from './constants';

export type UpgradeId = 'carimbo' | 'ampulheta' | 'seguro' | 'cofre' | 'balcao';

/** Nível de cada melhoria comprada (ausente = nível 0). */
export type Upgrades = Partial<Record<UpgradeId, number>>;

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  /** Emoji de reserva (a loja usa a folha `upg-<id>.png`). */
  icon: string;
  description: string;
  /** Efeito de cada nível, em texto curto. */
  perLevel: string;
  /** Preço do nível 1, 2, 3... (o tamanho da lista é o nível máximo). */
  costs: readonly number[];
}

export const UPGRADES: readonly UpgradeDef[] = [
  {
    id: 'carimbo',
    name: 'Carimbo de Prata',
    icon: '🪙',
    description: 'Um carimbo mais pesado, que o Conselho paga melhor.',
    perLevel: '+1 moeda por decisão certa',
    costs: [25, 45, 70],
  },
  {
    id: 'ampulheta',
    name: 'Ampulheta Encantada',
    icon: '⏳',
    description: 'A areia cai mais devagar sobre o balcão.',
    perLevel: '+2 s por viajante no relógio do dia',
    costs: [20, 35, 55],
  },
  {
    id: 'seguro',
    name: 'Seguro do Cartório',
    icon: '🛡️',
    description: 'Um cofre de apólices amortece cada infração.',
    perLevel: '−1 moeda em cada multa',
    costs: [30, 50],
  },
  {
    id: 'cofre',
    name: 'Despensa Econômica',
    icon: '🕯️',
    description: 'Velas a granel, pergaminho reciclado e pão do dia anterior.',
    perLevel: '−2 moedas nas despesas diárias',
    costs: [25, 40, 60],
  },
  {
    id: 'balcao',
    name: 'Balcão Ordenado',
    icon: '🪑',
    description: 'Uma corda e um porteiro seguram a fila na rua.',
    perLevel: '+1 s entre as chegadas de viajantes',
    costs: [20, 40],
  },
];

export const UPGRADE_IDS: readonly UpgradeId[] = UPGRADES.map((u) => u.id);

export const upgradeDef = (id: UpgradeId): UpgradeDef => UPGRADES.find((u) => u.id === id)!;

export const levelOf = (ups: Upgrades | undefined, id: UpgradeId): number => ups?.[id] ?? 0;

export const maxLevel = (id: UpgradeId): number => upgradeDef(id).costs.length;

/** Preço do próximo nível, ou null se já está no máximo. */
export function nextCost(ups: Upgrades | undefined, id: UpgradeId): number | null {
  return upgradeDef(id).costs[levelOf(ups, id)] ?? null;
}

/** Pode comprar? Precisa de nível livre e de moedas (o saldo não pode ficar negativo). */
export function canBuy(ups: Upgrades | undefined, id: UpgradeId, coins: number): boolean {
  const cost = nextCost(ups, id);
  return cost !== null && coins >= cost;
}

/** Compra um nível. Devolve as melhorias e o saldo novos, ou null se não puder. */
export function buyUpgrade(
  ups: Upgrades | undefined,
  id: UpgradeId,
  coins: number,
): { upgrades: Upgrades; coins: number } | null {
  const cost = nextCost(ups, id);
  if (cost === null || coins < cost) return null;
  return { upgrades: { ...ups, [id]: levelOf(ups, id) + 1 }, coins: coins - cost };
}

/** Valores efetivos das regras econômicas, com as melhorias aplicadas. */
export const rewardApprove = (ups?: Upgrades) => REWARD_APPROVE + levelOf(ups, 'carimbo');
export const rewardDeny = (ups?: Upgrades) => REWARD_DENY + levelOf(ups, 'carimbo');
/** Motivo errado não rende bônus de carimbo: só a decisão certa. */
export const rewardDenyPartial = (_ups?: Upgrades) => REWARD_DENY_PARTIAL;
/** A multa nunca cai abaixo de 1 moeda. */
export const fineAmount = (ups?: Upgrades) => Math.max(1, FINE - levelOf(ups, 'seguro'));
export const expensesFor = (day: number, ups?: Upgrades) =>
  Math.max(0, dailyExpenses(day) - 2 * levelOf(ups, 'cofre'));
export const secondsPerApplicant = (ups?: Upgrades) => SECONDS_PER_APPLICANT + 2 * levelOf(ups, 'ampulheta');
export const arrivalEvery = (ups?: Upgrades) => ARRIVAL_EVERY + levelOf(ups, 'balcao');
export const timeLimitFor = (applicants: number, ups?: Upgrades) => applicants * secondsPerApplicant(ups);

/** Valida um objeto vindo do localStorage. */
export function sanitizeUpgrades(raw: unknown): Upgrades {
  const out: Upgrades = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const id of UPGRADE_IDS) {
    const v = (raw as Record<string, unknown>)[id];
    if (typeof v === 'number' && Number.isInteger(v) && v > 0) out[id] = Math.min(v, maxLevel(id));
  }
  return out;
}
