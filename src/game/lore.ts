import type { Guild, Realm, Species } from './types';

/**
 * Lore base do entreposto. Só texto e dados: nada aqui mexe nas regras do jogo.
 * `unlockDay` é o dia da campanha em que o verbete entra no Diário do Cartório
 * (coincide com o dia em que a história do jogo apresenta o assunto).
 */

export interface LoreEntry<Id extends string = string> {
  id: Id;
  title: string;
  /** Linha curta que resume o verbete. */
  tagline: string;
  /** Parágrafos do verbete. */
  body: string[];
  unlockDay: number;
}

export const LORE_INTRO = {
  title: 'O entreposto das Brumas',
  paragraphs: [
    'Dizem que o mundo antigo era um só, e que se partiu em oito reinos quando as Brumas subiram. Cada reino ficou do seu lado, cercado de névoa, e por gerações ninguém soube se os outros ainda existiam.',
    'Foi o Conselho das Brumas quem fixou o entreposto no único ponto onde a névoa afina: uma ponte de pedra, uma muralha baixa e um balcão com uma vela acesa. Quem quer cruzar de um reino a outro passa por aqui, e precisa de papel.',
    'O Cartório Arcano nasceu desse balcão. Sua regra de ouro é antiga: a névoa esconde o rosto e o passado, mas um documento bem conferido não mente. Por isso o carimbo vale tanto quanto uma muralha.',
  ],
};

export type HistoryId = 'brumas' | 'conselho' | 'cartorio' | 'mestra' | 'fumaca' | 'fechamentos';

export const HISTORY: LoreEntry<HistoryId>[] = [
  {
    id: 'brumas',
    title: 'A subida das Brumas',
    tagline: 'Ano 1 do Calendário do Selo',
    unlockDay: 1,
    body: [
      'Nos registros mais velhos, a névoa surge numa única madrugada e cobre o vale inteiro. Quando ela baixa, a estrada para o reino vizinho já não existe: onde havia caminho há só cinza clara e silêncio.',
      'As Brumas não são inimigas. Elas apagam rotas, borram nomes e embaralham a memória de quem as atravessa sem guia. Quem entra sem papel pode sair sem lembrar quem era.',
    ],
  },
  {
    id: 'conselho',
    title: 'O Conselho das Brumas',
    tagline: 'Quem decide o que é regra',
    unlockDay: 3,
    body: [
      'Oito cadeiras, uma por reino, e uma nona cadeira vazia que ninguém ocupa: a cadeira do viajante. O Conselho se reúne na Torre dos Ventos e decreta, sem muita pressa e quase sempre em cima da hora, o que pode e o que não pode cruzar a ponte.',
      'Os decretos chegam ao cartório por mensageiro, às vezes à noite. É por isso que o Regulamento muda de um dia para o outro, e é por isso que a Mestra Aurelha sempre manda reler.',
    ],
  },
  {
    id: 'cartorio',
    title: 'O Cartório Arcano',
    tagline: 'Carta, Passe, Selo e carimbo',
    unlockDay: 1,
    body: [
      'O cartório mantém três papéis: a Carta de Identidade, que diz quem você é; o Passe de Viagem, que diz por que veio; e, quando a lei pede, o Selo de Guilda ou o Documento da Espécie. Os papéis precisam concordar entre si, porque a Névoa não consegue copiar uma coerência.',
      'O livro do cartório guarda cada carimbo desde o primeiro. Ninguém lembra quem escreveu a primeira página, mas todos sabem que ela diz: "Na dúvida, releia."',
    ],
  },
  {
    id: 'mestra',
    title: 'A Mestra Aurelha',
    tagline: 'Registradora-chefe, quarenta anos de balcão',
    unlockDay: 1,
    body: [
      'Aurelha entrou no cartório como aprendiz e nunca saiu. Tem opinião sobre tinta, sobre carimbo torto e sobre gente apressada, e nunca perdoou o dia em que um falsificador passou por ela com um selo bonito demais.',
      'Fala pouco, observa muito e não elogia. Quando diz "carimbo firme", é o maior elogio que o cartório conhece.',
    ],
  },
  {
    id: 'fumaca',
    title: 'A fumaça do leste',
    tagline: 'O que aconteceu no Reino das Cinzas',
    unlockDay: 3,
    body: [
      'Ninguém sabe ao certo o que queima no Reino das Cinzas. Alguns falam de uma forja que escapou do controle; outros, de uma guerra entre casas. O fato é que a fumaça cobriu o céu, e o Conselho fechou a fronteira antes que o fogo, ou a história, atravessasse a ponte.',
      'No balcão, a ordem é simples: papel do Reino das Cinzas não entra, mesmo que esteja perfeito. A pena é mais pesada para o carimbador do que para o viajante.',
    ],
  },
  {
    id: 'fechamentos',
    title: 'As fronteiras que se fecham',
    tagline: 'Quarentenas, marés e rotas de contrabando',
    unlockDay: 5,
    body: [
      'Fronteira fechada não é castigo, é cautela. O Pântano de Névoa ficou em quarentena depois de uma febre que fazia as pessoas esquecerem o próprio nome. O Abismo Azul fecha quando a maré vira. As Planícies do Vento fecham quando os guardas descobrem mais uma rota de contrabando.',
      'Toda fronteira que se fecha acaba reabrindo, mas no cartório ninguém sabe quando. Por isso o Regulamento é o único mapa em que se pode confiar.',
    ],
  },
];

export const REALM_LORE: Record<Realm, LoreEntry<Realm> & { accent: string; ruler: string; known: string }> = {
  'Vale Dourado': {
    id: 'Vale Dourado',
    title: 'Vale Dourado',
    tagline: 'Celeiro e tribunal do mundo',
    ruler: 'Casa Alvorada',
    known: 'Trigo, mel de ressonância e juristas',
    accent: '#e0b44c',
    unlockDay: 1,
    body: [
      'Campos de trigo que brilham no fim da tarde e um senso de ordem herdado dos antigos escribas. O Vale foi o primeiro a aceitar a ideia de documento, e até hoje se orgulha disso.',
      'Seus viajantes costumam chegar bem-vestidos e bem-documentados, o que nem sempre quer dizer que estejam certos.',
    ],
  },
  'Ilhas de Cristal': {
    id: 'Ilhas de Cristal',
    title: 'Ilhas de Cristal',
    tagline: 'Arquipélago de vidro e luz',
    ruler: 'O Colégio dos Prismas',
    known: 'Lentes, cristais cantantes e navegação',
    accent: '#8fd3e8',
    unlockDay: 1,
    body: [
      'Ilhas de rocha transparente onde a luz do sol vira música. Os vidreiros de lá fazem as lentes dos faróis que atravessam as Brumas.',
      'Os moradores acham o resto do mundo opaco. O resto do mundo acha que eles falam demais.',
    ],
  },
  'Floresta Sussurrante': {
    id: 'Floresta Sussurrante',
    title: 'Floresta Sussurrante',
    tagline: 'Mata antiga que guarda segredos',
    ruler: 'O Círculo das Copas',
    known: 'Ervas, rumores e arquivos vivos',
    accent: '#5fae7a',
    unlockDay: 1,
    body: [
      'Árvores tão velhas que as raízes guardam memória. Diz-se que a Floresta nunca esquece uma conversa, e que por isso poucos conversam perto dela.',
      'Os elfos da Floresta chegam ao balcão com paciência de séculos, e esperam o mesmo do balcão.',
    ],
  },
  'Montanhas de Ferro': {
    id: 'Montanhas de Ferro',
    title: 'Montanhas de Ferro',
    tagline: 'Forjas, túneis e cofres',
    ruler: 'O Conclave das Forjas',
    known: 'Metal, juramentos e cerveja escura',
    accent: '#c98f63',
    unlockDay: 1,
    body: [
      'Cidades escavadas na rocha, aquecidas pelas próprias forjas. A palavra de um anão das Montanhas vale um contrato, e um contrato vale uma montanha.',
      'Quando os mensageiros falam de tropas na serra, é dali que vem o barulho.',
    ],
  },
  'Pântano de Névoa': {
    id: 'Pântano de Névoa',
    title: 'Pântano de Névoa',
    tagline: 'Onde a névoa nasce',
    ruler: 'As Três Parteiras',
    known: 'Musgos medicinais, goblins de turfa, febres',
    accent: '#8fbf6a',
    unlockDay: 5,
    body: [
      'Dizem que é de lá que a névoa sobe todas as manhãs. Os goblins do Pântano sabem navegar sem ver, e usam isso em seu favor.',
      'A febre da névoa levou o Conselho a decretar quarentena: quem a pega esquece o nome, e quem esquece o nome não consegue apresentar a Carta.',
    ],
  },
  'Reino das Cinzas': {
    id: 'Reino das Cinzas',
    title: 'Reino das Cinzas',
    tagline: 'Fronteira fechada',
    ruler: 'Contestado',
    known: 'Forjas apagadas, brasa viva, histórias incompletas',
    accent: '#b23a48',
    unlockDay: 3,
    body: [
      'Já foi o reino das grandes forjas de vidro negro e dos draconatos ferreiros. Hoje é um lugar que ninguém visita e que ninguém consegue descrever sem trocar de assunto.',
      'Os poucos que ainda tentam sair de lá chegam à ponte com papéis impecáveis. O cartório recusa todos, sem exceção, e guarda a pergunta que o carimbo não responde.',
    ],
  },
  'Abismo Azul': {
    id: 'Abismo Azul',
    title: 'Abismo Azul',
    tagline: 'Cidade submersa',
    ruler: 'A Corte das Marés',
    known: 'Pérolas, tritões e cartas náuticas',
    accent: '#3d8fa3',
    unlockDay: 11,
    body: [
      'Uma cidade inteira no fundo de um lago sem fim, onde o dia e a noite são decididos pela maré. Os tritões de lá cruzam a ponte com os pés molhados e a pressa de quem não pode ficar longe da água.',
      'Quando a maré vira, a fronteira fecha. Ninguém discute com a maré.',
    ],
  },
  'Planícies do Vento': {
    id: 'Planícies do Vento',
    title: 'Planícies do Vento',
    tagline: 'Estrada aberta, sem donos',
    ruler: 'Os Cavaleiros de Passagem',
    known: 'Cavalos, mercadores e rotas sem nome',
    accent: '#d9d2f2',
    unlockDay: 17,
    body: [
      'Terra rasa e infinita, varrida por um vento que apaga as pegadas. Mercadores honestos atravessam as Planícies todos os dias; os outros também.',
      'É a rota preferida do contrabando, justamente porque ninguém é dono dela. Quando a rede é descoberta, a fronteira fecha e os guardas pedem olhos atentos.',
    ],
  },
};

export const SPECIES_LORE: Record<Species, LoreEntry<Species> & { traits: string }> = {
  Humano: {
    id: 'Humano',
    title: 'Humanos',
    tagline: 'Muitos, rápidos, curiosos',
    traits: 'Vida curta, paciência curta, papel em dia',
    unlockDay: 1,
    body: [
      'Estão em todos os reinos e em todos os balcões. Vivem depressa, mudam de ideia e de endereço, e por isso são os que mais perdem documentos.',
      'Não precisam de Documento da Espécie: o cartório presume que o ser humano é o padrão. É um privilégio que eles nem percebem.',
    ],
  },
  Elfo: {
    id: 'Elfo',
    title: 'Elfos',
    tagline: 'Memória longa, paciência longa',
    traits: 'Vivem séculos, nunca se atrasam',
    unlockDay: 1,
    body: [
      'Nascem e morrem devagar. Um elfo de duzentos anos ainda se considera jovem, e dá o ano de nascimento como quem comenta o tempo.',
      'Gostam de formalidade, e dão trabalho quando a formalidade falha.',
    ],
  },
  Anão: {
    id: 'Anão',
    title: 'Anões',
    tagline: 'Contrato é contrato',
    traits: 'Fiéis a juramentos, desconfiados de carimbos tortos',
    unlockDay: 1,
    body: [
      'Gente das forjas e dos cofres, que mede a seriedade de um cartório pelo peso do carimbo. Confere os próprios papéis antes de entregar, e confere os seus também.',
      'Respeitam quem aplica a regra com firmeza, e nunca esquecem quem erra com eles.',
    ],
  },
  Goblin: {
    id: 'Goblin',
    title: 'Goblins',
    tagline: 'Pequenos, rápidos, engenhosos',
    traits: 'Vida breve, jeitinho longo',
    unlockDay: 1,
    body: [
      'Vivem pouco e aproveitam muito. Têm fama de falsificadores, o que é injusto com a maioria e merecido para uma minoria bem treinada.',
      'Muitos trabalham nas guildas como cartógrafos, que é a profissão que mais respeita a verdade.',
    ],
  },
  Fada: {
    id: 'Fada',
    title: 'Fadas',
    tagline: 'Leves como o ar, mais velhas do que parecem',
    traits: 'Pequena estatura, grande teimosia',
    unlockDay: 8,
    body: [
      'Cruzaram para este lado das Brumas há poucas gerações, atraídas pelas luzes do entreposto. Seus documentos vêm perfumados e, às vezes, cantam.',
      'A Espécie delas exige registro porque suas identidades mudam com a estação.',
    ],
  },
  Draconato: {
    id: 'Draconato',
    title: 'Draconatos',
    tagline: 'Escamas, brasa e brio',
    traits: 'Orgulhosos, bons ferreiros, maus perdedores',
    unlockDay: 8,
    body: [
      'Povo de dragões que andam em duas pernas. Dominaram as forjas do Reino das Cinzas, e é por isso que muitos têm um olhar difícil de sustentar, em especial quando a conversa chega naquele reino.',
      'Têm brio de guerreiros e papelada de diplomatas.',
    ],
  },
  Tritão: {
    id: 'Tritão',
    title: 'Tritões',
    tagline: 'Povo das marés',
    traits: 'Úmidos, pontuais, impacientes fora d\'água',
    unlockDay: 8,
    body: [
      'Vêm do Abismo Azul, onde o calendário é a maré. Seus papéis são impermeáveis, e eles estranham que os outros não sejam.',
      'Quando a maré vira, eles sabem antes de qualquer decreto.',
    ],
  },
  Golem: {
    id: 'Golem',
    title: 'Golens',
    tagline: 'Feitos, não nascidos',
    traits: 'Literais, pacientes, difíceis de enganar',
    unlockDay: 8,
    body: [
      'Foram esculpidos por mestres antigos para servir, e acabaram ficando para viver. Sua idade é a da pedra: pode ser um ano, pode ser cem.',
      'Levam a regra ao pé da letra, o que faz deles os melhores e os piores viajantes para um carimbador.',
    ],
  },
  Espectro: {
    id: 'Espectro',
    title: 'Espectros',
    tagline: 'O que ficou depois',
    traits: 'Atravessam paredes, mas respeitam fila',
    unlockDay: 8,
    body: [
      'Ninguém sabe se estão vivos, mortos ou apenas esperando. Preenchem a Carta com uma letra trêmula e a data de nascimento mais antiga do cartório.',
      'O cartório os aceita por tradição: quem já passou pela Névoa e voltou merece, no mínimo, um carimbo.',
    ],
  },
};

export const GUILD_LORE: Record<Guild, LoreEntry<Guild> & { symbol: string }> = {
  Ferreiros: {
    id: 'Ferreiros',
    title: 'Guilda dos Ferreiros',
    tagline: 'Martelo e juramento',
    symbol: '⚒',
    unlockDay: 4,
    body: ['Armadura, ferramentas e a maioria das chaves do entreposto. Seu selo é gravado a martelo, e por isso o falso costuma sair torto.'],
  },
  Alquimistas: {
    id: 'Alquimistas',
    title: 'Guilda dos Alquimistas',
    tagline: 'Pó, vapor e precisão',
    symbol: '⚗',
    unlockDay: 4,
    body: ['Medem tudo duas vezes e explodem só de vez em quando. A tinta do selo muda de cor sob luz forte, o que os falsificadores ainda não conseguem copiar.'],
  },
  Cartógrafos: {
    id: 'Cartógrafos',
    title: 'Guilda dos Cartógrafos',
    tagline: 'Quem sabe onde fica a ponte',
    symbol: '✦',
    unlockDay: 4,
    body: ['Desenham os mapas que atravessam as Brumas, o que faz deles quase os únicos que sabem voltar. Cada selo traz a estrela que aponta o norte do reino de origem.'],
  },
  Menestréis: {
    id: 'Menestréis',
    title: 'Guilda dos Menestréis',
    tagline: 'Música como moeda',
    symbol: '♪',
    unlockDay: 4,
    body: ['Levam notícias de um reino a outro, cantadas. A guilda é pequena, barulhenta e a que mais depressa descobre um selo falso, porque quase sempre o falsário desafina.'],
  },
};

export type DiaryTab = 'mundo' | 'reinos' | 'especies' | 'guildas' | 'cenas';

export const DIARY_TABS: { id: DiaryTab; label: string }[] = [
  { id: 'mundo', label: 'O mundo' },
  { id: 'reinos', label: 'Reinos' },
  { id: 'especies', label: 'Espécies' },
  { id: 'guildas', label: 'Guildas' },
  { id: 'cenas', label: 'Cenas' },
];

/** Verbetes de uma aba, em ordem estável. */
export function entriesFor(tab: DiaryTab): LoreEntry[] {
  switch (tab) {
    case 'mundo':
      return HISTORY;
    case 'reinos':
      return Object.values(REALM_LORE);
    case 'especies':
      return Object.values(SPECIES_LORE);
    case 'guildas':
      return Object.values(GUILD_LORE);
    case 'cenas':
      // As cenas não são verbetes: o Diário as lista à parte (ver Diary).
      return [];
  }
}

export const isUnlocked = (entry: LoreEntry, reachedDay: number) => entry.unlockDay <= reachedDay;

export function unlockedCount(reachedDay: number) {
  const all = DIARY_TABS.flatMap((t) => entriesFor(t.id));
  return { open: all.filter((e) => isUnlocked(e, reachedDay)).length, total: all.length };
}
