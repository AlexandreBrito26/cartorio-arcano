import type { DayRules, Guild, Purpose, Realm, Species, ViolationCode } from './types';

export const GAME_YEAR = 417;
export const MAX_DAY = 20;
export const START_COINS = 30;
export const MIN_WORK_AGE = 16;
export const ENTRY_FEE = 2;

/** Relógio: segundos por viajante previsto no dia (define o tempo limite). */
export const SECONDS_PER_APPLICANT = 12;
/** A cada quantos segundos chega um novo viajante à fila. */
export const ARRIVAL_EVERY = 8;
/** Viajantes que já estão na fila quando o dia começa. */
export const START_QUEUE = 2;
/** Moedas perdidas por viajante que o relógio deixou sem atendimento. */
export const LATE_PENALTY = 2;

/** Teto de viajantes por dia no plantão infinito. */
export const INFINITE_MAX_APPLICANTS = 25;

export const timeLimit = (applicants: number) => applicants * SECONDS_PER_APPLICANT;

/** Itens que não podem entrar na bagagem. */
export const BANNED_ITEMS = ['Pó de Brasa', 'Pergaminho Proibido', 'Ovo de Dragão', 'Essência de Sombra'];
/** Itens comuns, sempre permitidos. */
export const HARMLESS_ITEMS = ['Cantil de água', 'Pão amanhecido', 'Manual de Runas', 'Lanterna de bolso', 'Mapa dobrado'];

export const REWARD_APPROVE = 6;
export const REWARD_DENY = 8;
export const REWARD_DENY_PARTIAL = 4;
export const FINE = 6;

/** Despesas do dia: velas, pergaminho e pão. Sobem até o dia 8 e depois ficam estáveis. */
export const dailyExpenses = (day: number) => 12 + Math.min(day - 1, 7) * 4;

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

export const SPECIES: readonly Species[] = [
  'Humano', 'Elfo', 'Anão', 'Goblin', 'Fada', 'Draconato', 'Tritão', 'Golem', 'Espectro',
];

export const REALMS: readonly Realm[] = [
  'Vale Dourado',
  'Ilhas de Cristal',
  'Floresta Sussurrante',
  'Montanhas de Ferro',
  'Pântano de Névoa',
  'Reino das Cinzas',
  'Abismo Azul',
  'Planícies do Vento',
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
  Draconato: [16, 120],
  Tritão: [16, 200],
  Golem: [1, 150],
  Espectro: [16, 300],
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
  Draconato: ['#b5523b', '#8f3f2e', '#c9793f'],
  Tritão: ['#5fb3c4', '#3d8fa3', '#7fc8b8'],
  Golem: ['#8a8a8f', '#6b6b72', '#9c9488'],
  Espectro: ['#d8dce8', '#b9c2d9', '#c7bfe0'],
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
  {
    headline: 'Bagagem sob suspeita',
    story:
      'Um comboio de mercadores chegou com malas que tilintam. O Conselho proibiu itens de contrabando na bagagem. "Abra tudo, aprendiz. Quem esconde algo costuma ter motivo."',
    add: ['BAGAGEM_PROIBIDA'],
    applicants: 9,
  },
  {
    headline: 'Taxa de entrada',
    story:
      'O cofre das Brumas está vazio. A partir de hoje, toda entrada paga 2 moedas no balcão, e o recibo precisa estar na mesa.',
    add: ['TAXA_NAO_PAGA'],
    applicants: 10,
  },
  {
    headline: 'Registro das espécies',
    story:
      'Criaturas de outros mundos começaram a chegar em massa. Todo viajante que não for humano precisa apresentar o Documento da Espécie, e a espécie tem de bater com a da Carta.',
    add: ['ESPECIE_SEM_DOC'],
    applicants: 10,
  },
  {
    headline: 'Rumores de guerra',
    story: 'Mensageiros falam de tropas nas montanhas. O Conselho pede atenção redobrada a quem vem do Vale Dourado e das Montanhas de Ferro.',
    add: [],
    applicants: 10,
  },
  {
    headline: 'Filas de madrugada',
    story: 'Os viajantes chegam antes do sol. Velas acesas, pés cansados e paciência curta. Mantenha o ritmo.',
    add: [],
    applicants: 11,
  },
  {
    headline: 'O Abismo Azul fecha',
    story: 'Marés estranhas tomam o Abismo Azul. A fronteira fecha por precaução até nova ordem.',
    add: [],
    banned: ['Abismo Azul'],
    applicants: 11,
  },
  {
    headline: 'Dias longos',
    story: 'O balcão não para desde o amanhecer. A Mestra deixa um recado: "Quem tem pressa erra. Quem erra paga."',
    add: [],
    applicants: 12,
  },
  {
    headline: 'Troca de mestres dos selos',
    story: 'A Guilda trocou o responsável pelos selos. Confira cada símbolo com calma, porque os falsificadores também aprenderam.',
    add: [],
    applicants: 12,
  },
  {
    headline: 'Festival das Brumas',
    story: 'A cidade inteira vem para a festa, e a fila se estende pela rua. Muita gente, pouca paciência.',
    add: [],
    applicants: 13,
  },
  {
    headline: 'Impostos novos',
    story: 'O Conselho cobra mais dos mercadores de passagem. O balcão segue as mesmas regras, mas a fila só cresce.',
    add: [],
    applicants: 13,
  },
  {
    headline: 'A Mestra adoece',
    story: 'A Mestra Aurelha ficou de cama. Você responde por todo o balcão, com o carimbo na mão e o livro aberto.',
    add: [],
    applicants: 13,
  },
  {
    headline: 'Contrabando organizado',
    story: 'Uma rede de contrabando usa as Planícies do Vento como rota. Os guardas fecham a fronteira e pedem olhos atentos.',
    add: [],
    banned: ['Planícies do Vento'],
    applicants: 14,
  },
  {
    headline: 'Pressa do império',
    story: 'Um emissário do império quer passar primeiro, sem fila. A Mestra avisa: "Passa quem tem papel. Ninguém mais."',
    add: [],
    applicants: 14,
  },
  {
    headline: 'Véspera do desfecho',
    story: 'Faltam poucos dias para o fim da campanha. Cada carimbo conta, e o livro do cartório já está quase cheio.',
    add: [],
    applicants: 15,
  },
  {
    headline: 'O último carimbo',
    story: 'Vinte dias depois, a fila dá a volta no quarteirão. A Mestra Aurelha assina o livro e entrega o carimbo para você.',
    add: [],
    applicants: 15,
  },
];

export function getDayRules(day: number): DayRules {
  const current = Math.max(day, 1);
  const infinite = current > MAX_DAY;
  const index = Math.min(current, MAX_DAY) - 1;
  const active: ViolationCode[] = [];
  let bannedRealms: Realm[] = [];

  for (let i = 0; i <= index; i++) {
    active.push(...DAYS[i].add);
    if (DAYS[i].banned) bannedRealms = [...new Set([...bannedRealms, ...DAYS[i].banned!])];
  }

  const config = DAYS[index];
  // No plantão infinito, cada dia traz um viajante a mais, até o teto.
  const extra = infinite ? current - MAX_DAY : 0;

  return {
    day: current,
    today: BASE_TODAY + current - 1,
    applicants: infinite ? Math.min(INFINITE_MAX_APPLICANTS, config.applicants + extra) : config.applicants,
    active,
    bannedRealms,
    minWorkAge: MIN_WORK_AGE,
    headline: infinite ? `Plantão, dia ${current}` : config.headline,
    story: infinite
      ? 'A campanha acabou, mas a fila não. Cada dia chega com mais viajantes e a mesma fronteira.'
      : config.story,
    newCodes: infinite ? [] : config.add,
    notes: infinite ? [] : (config.notes ?? []),
  };
}
