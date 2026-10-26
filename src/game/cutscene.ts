export type SceneArt = 'road' | 'gate' | 'office' | 'mistress' | 'stamp';

export interface CutsceneScene {
  art: SceneArt;
  /** Texto da cena; cada item vira um parágrafo. */
  lines: string[];
}

/** Abertura: o que acontece antes do primeiro dia no balcão. */
export const INTRO_SCENES: readonly CutsceneScene[] = [
  {
    art: 'road',
    lines: [
      'Ano 417. A estrada das Brumas serpenteia até a única fronteira que ainda não se perdeu na névoa.',
      'Você chega ao amanhecer, com uma carta de recomendação e as botas molhadas.',
    ],
  },
  {
    art: 'gate',
    lines: [
      'O portão é velho, mas a runa sobre o arco continua acesa. Quem passa ali sem papel em dia não volta o mesmo.',
    ],
  },
  {
    art: 'office',
    lines: [
      'Dentro, o Cartório Arcano cheira a cera, tinta e pergaminho. Há três carimbos na mesa e uma pilha de regulamentos maior que você.',
    ],
  },
  {
    art: 'mistress',
    lines: [
      '“Você é o novo aprendiz.” A Mestra Aurelha não pergunta, afirma.',
      '“Carta, Passe e Selo. Nome, reino, validade. Se estiver errado, você nega. Se estiver certo, você aprova. Se errar, a multa sai do seu bolso.”',
    ],
  },
  {
    art: 'stamp',
    lines: [
      'Ela empurra o carimbo na sua direção. A fila já dobra a esquina.',
      'Seu primeiro dia começa agora.',
    ],
  },
];

/** Velocidade da máquina de escrever, em caracteres por segundo. */
export const TYPE_SPEED = 55;
