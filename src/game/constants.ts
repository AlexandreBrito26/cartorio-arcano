import type { DayRules, Guild, Purpose, Realm, Species, ViolationCode } from './types';

export const GAME_YEAR = 417;
export const MAX_DAY = 5;
export const START_COINS = 30;
export const MIN_WORK_AGE = 16;

export const REWARD_APPROVE = 6;
export const REWARD_DENY = 8;
export const REWARD_DENY_PARTIAL = 4;
export const FINE = 6;

/** Despesas do dia: velas, pergaminho e pão. */
export const dailyExpenses = (day: number) => 12 + (day - 1) * 4;

const BASE_TODAY = 100;

const MONTHS = [
  'Névoa',
  'Brasa',
  'Orvalho',
  'Eclipse',
  'Seiva',
  'Cinza',
  'Aurora',
  'Geada',
  'Trovão',
  'Lume',
  'Maré',
  'Veludo',
];

/** Converte "dia do ano" (0–359, meses de 30 dias) em texto. */
export function formatDate(n: number): string {
  const month = Math.floor(n / 30) % 12;
  const day = (n % 30) + 1;
  return `${day} de ${MONTHS[month]}`;
}

export const SPECIES: readonly Species[] = ['Humano', 'Elfo', 'Anão', 'Goblin', 'Fada'];

export const REALMS: readonly Realm[] = [
  'Vale Dourado',
  'Ilhas de Cristal',
  'Floresta Sussurrante',
  'Montanhas de Ferro',
  'Pântano de Névoa',
  'Reino das Cinzas',
];

export const PURPOSES: readonly Purpose[] = ['Visita', 'Comércio', 'Trabalho', 'Estudo'];

export const GUILDS: readonly Guild[] = ['Ferreiros', 'Alquimistas', 'Cartógrafos', 'Menestréis'];

export const GUILD_SYMBOLS: Record<Guild, string> = {
  Ferreiros: '⚒',
  Alquimistas: '⚗',
  Cartógrafos: '✦',
  Menestréis: '♪',
};

/** Símbolos que podem aparecer em selos falsos. */
export const FAKE_SYMBOLS = ['☾', '☘', '⚓', '♞', '❖', '☀'];

export const AGE_RANGE: Record<Species, [number, number]> = {
  Humano: [6, 75],
  Elfo: [16, 250],
  Anão: [16, 180],
  Goblin: [8, 55],
  Fada: [4, 90],
};

export const FIRST_NAMES = [
  'Ilya', 'Maren', 'Thalia', 'Corvin', 'Brisa', 'Orlan', 'Selene', 'Doran',
  'Fenna', 'Kael', 'Lirael', 'Bruno', 'Tamsin', 'Okko', 'Vesper', 'Nerys',
  'Gideon', 'Pia', 'Rowan', 'Zuri', 'Halden', 'Mirela', 'Tobias', 'Yara',
];

export const LAST_NAMES = [
  'Veyrun', 'Brasalume', 'Pedraluz', 'Quillfeather', 'Marenvalle', 'Torvasco',
  'Nebulim', 'Ferrovelho', 'Alvorada', 'Cinzeiro', 'Salgueiro', 'Dornelas',
  'Estrelim', 'Gravetti', 'Lumenar', 'Orvalhado',
];

export const SKINS: Record<Species, string[]> = {
  Humano: ['#f1c9a5', '#d9a273', '#a8734a', '#7a4d2e'],
  Elfo: ['#f3dcc6', '#e6c9a8', '#d3e6d4'],
  Anão: ['#e3b48c', '#c98f63', '#b57a50'],
  Goblin: ['#8fbf6a', '#74a85a', '#9bc47a'],
  Fada: ['#f7d6e0', '#d6c8f5', '#c8f0f0'],
};

export const HAIRS = ['#2b1d17', '#5a3a22', '#8b5a2b', '#c9a24b', '#d8d8e0', '#7a3b6e', '#2f5d62'];
export const EYES = ['#2a5db0', '#3b7a3b', '#7a4a1e', '#6b3fa0', '#b8860b'];
export const CLOAKS = ['#3b2f6b', '#5b2a3a', '#23504a', '#4a4a5e', '#6b4a22', '#2c3e6b'];

export const LINES: Record<Purpose, string[]> = {
  Visita: [
    'Vim ver minha tia-avó. Ela faz uma sopa de cogumelo famosa.',
    'Só passando para ver a Torre dos Ventos. Dizem que é linda.',
    'Meu primo casa amanhã e eu não posso perder a festa!',
  ],
  Comércio: [
    'Trago especiarias e três barris de mel de ressonância.',
    'Sou mercador de lanternas encantadas. Quer uma de brinde?',
    'Tenho entrega de tecidos para o mercado da meia-noite.',
  ],
  Estudo: [
    'Consegui vaga na Academia de Runas! Estou nervoso.',
    'Vou estudar o comportamento de dragões domésticos.',
    'Minha tese é sobre a migração das luzes-fátuas.',
  ],
  Trabalho: [
    'O mestre da oficina me espera. Não posso me atrasar!',
    'Tenho contrato de duas luas. Só preciso passar por aqui.',
    'Me chamaram às pressas, a guilda está com pouca gente.',
  ],
};

interface DayConfig {
  headline: string;
  story: string;
  add: ViolationCode[];
  banned?: Realm[];
  applicants: number;
  notes?: string[];
}

const DAYS: DayConfig[] = [
  {
    headline: 'Primeiro dia no balcão',
    story:
      'A Mestra Registradora Aurelha lhe entrega um carimbo de bronze e uma vela. "Ninguém atravessa as Brumas sem papel, aprendiz. Olhe com calma e carimbe com firmeza."',
    add: ['DOC_AUSENTE', 'NOME_DIVERGENTE'],
    applicants: 6,
  },
  {
    headline: 'Prazo é prazo',
    story:
      'Uma corrente de ar levou metade dos pergaminhos do arquivo e a Mestra está de mau humor. "Hoje, datas. Papel velho não entra."',
    add: ['DOC_VENCIDO'],
    applicants: 8,
  },
  {
    headline: 'Fumaça no horizonte',
    story:
      'Nuvens de fuligem sobem do leste. O Conselho das Brumas decretou o fechamento da fronteira com o Reino das Cinzas e pediu atenção redobrada à origem dos viajantes.',
    add: ['REINO_DIVERGENTE', 'REINO_PROIBIDO'],
    banned: ['Reino das Cinzas'],
    applicants: 8,
  },
  {
    headline: 'As guildas exigem selos',
    story:
      'As guildas reclamaram de trabalhadores sem credencial. A partir de hoje, passe de trabalho precisa de selo. Falsificadores já estão tentando a sorte.',
    add: ['SELO_AUSENTE', 'SELO_FALSO'],
    applicants: 9,
  },
  {
    headline: 'A inspeção da Mestra',
    story:
      'Última jornada do mês. A Mestra Aurelha observa de longe, de braços cruzados. Há decreto novo e uma regra sobre aprendizes.',
    add: ['IDADE_INSUFICIENTE'],
    banned: ['Reino das Cinzas', 'Pântano de Névoa'],
    applicants: 10,
    notes: ['Decreto atualizado: o Pântano de Névoa também está fechado (quarentena).'],
  },
];

export function getDayRules(day: number): DayRules {
  const index = Math.min(Math.max(day, 1), MAX_DAY) - 1;
  const active: ViolationCode[] = [];
  let bannedRealms: Realm[] = [];

  for (let i = 0; i <= index; i++) {
    active.push(...DAYS[i].add);
    if (DAYS[i].banned) bannedRealms = DAYS[i].banned!;
  }

  const config = DAYS[index];

  return {
    day: index + 1,
    today: BASE_TODAY + index,
    applicants: config.applicants,
    active,
    bannedRealms,
    minWorkAge: MIN_WORK_AGE,
    headline: config.headline,
    story: config.story,
    newCodes: config.add,
    notes: config.notes ?? [],
  };
}
