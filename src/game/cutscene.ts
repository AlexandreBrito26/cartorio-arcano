export type SceneArt = 'road' | 'gate' | 'office' | 'mistress' | 'stamp';

/** Movimento lento da "câmera" sobre a arte da cena. */
export type SceneCamera = 'still' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';

/** Como a cena entra: fusão suave, íris (círculo que abre) ou corte seco. */
export type SceneTransition = 'fade' | 'iris' | 'cut';

/** Tipo de partícula (PixiJS) que flutua sobre a cena. */
export type SceneMood = 'mist' | 'embers' | 'rain';

export interface CutsceneScene {
  art: SceneArt;
  /** Texto da cena; cada item vira um parágrafo. */
  lines: string[];
  /** Quem fala (aparece como legenda acima do texto). Sem valor, é narração. */
  speaker?: string;
  camera?: SceneCamera;
  transition?: SceneTransition;
  /** Partículas da cena. Sem valor, segue o padrão da arte (ver `defaultMood`). */
  mood?: SceneMood;
  /** Quantidade de partículas. Sem valor, segue o padrão da arte. */
  particles?: number;
  /** Carimbo sonoro tocado quando a cena entra. */
  sfx?: 'approve' | 'deny';
}

export type CutsceneId = 'intro';

export interface CutsceneDef {
  id: CutsceneId;
  /** Nome mostrado no Diário, na aba de cenas. */
  title: string;
  /** Dia da campanha em que a cena passa a poder ser revista no Diário. */
  unlockDay: number;
  scenes: readonly CutsceneScene[];
  /** Rótulo do botão da última cena. */
  doneLabel?: string;
}

/** Abertura: o que acontece antes do primeiro dia no balcão. */
const INTRO_SCENES_DATA: readonly CutsceneScene[] = [
  {
    art: 'road',
    camera: 'zoom-in',
    transition: 'fade',
    lines: [
      'Ano 417. A estrada das Brumas serpenteia até a única fronteira que ainda não se perdeu na névoa.',
      'Você chega ao amanhecer, com uma carta de recomendação e as botas molhadas.',
    ],
  },
  {
    art: 'gate',
    camera: 'pan-right',
    transition: 'fade',
    lines: [
      'O portão é velho, mas a runa sobre o arco continua acesa. Quem passa ali sem papel em dia não volta o mesmo.',
    ],
  },
  {
    art: 'office',
    camera: 'pan-left',
    transition: 'fade',
    lines: [
      'Dentro, o Cartório Arcano cheira a cera, tinta e pergaminho. Há três carimbos na mesa e uma pilha de regulamentos maior que você.',
    ],
  },
  {
    art: 'mistress',
    camera: 'zoom-in',
    transition: 'iris',
    speaker: 'Mestra Aurelha',
    lines: [
      '“Você é o novo aprendiz.” A Mestra Aurelha não pergunta, afirma.',
      '“Carta, Passe e Selo. Nome, reino, validade. Se estiver errado, você nega. Se estiver certo, você aprova. Se errar, a multa sai do seu bolso.”',
    ],
  },
  {
    art: 'stamp',
    camera: 'zoom-out',
    transition: 'cut',
    sfx: 'approve',
    lines: [
      'Ela empurra o carimbo na sua direção. A fila já dobra a esquina.',
      'Seu primeiro dia começa agora.',
    ],
  },
];

export const CUTSCENES: Record<CutsceneId, CutsceneDef> = {
  intro: {
    id: 'intro',
    title: 'Abertura: o aprendiz chega',
    unlockDay: 1,
    scenes: INTRO_SCENES_DATA,
    doneLabel: 'Abrir o cartório',
  },
};

/** Compatibilidade: as cenas da abertura. */
export const INTRO_SCENES = CUTSCENES.intro.scenes;

/**
 * Cenas que passam antes de um dia da campanha (antes do evento e do briefing).
 * Chave = dia. Fica vazio até as cenas de marco entrarem (roadmap, fase 3).
 */
export const CUTSCENE_SCHEDULE: Readonly<Partial<Record<number, CutsceneId>>> = {};

export const cutsceneForDay = (day: number): CutsceneId | undefined => CUTSCENE_SCHEDULE[day];

/** Cenas que o Diário deixa rever, na ordem de desbloqueio. */
export const replayableCutscenes = (reachedDay: number): CutsceneDef[] =>
  Object.values(CUTSCENES)
    .filter((c) => c.unlockDay <= reachedDay)
    .sort((a, b) => a.unlockDay - b.unlockDay);

/** Partículas padrão por arte: névoa fora do cartório, brasas dentro. */
export function defaultMood(art: SceneArt): { mood: SceneMood; count: number } {
  return art === 'road' || art === 'gate' ? { mood: 'mist', count: 10 } : { mood: 'embers', count: 34 };
}

/** Velocidade da máquina de escrever, em caracteres por segundo. */
export const TYPE_SPEED = 55;
