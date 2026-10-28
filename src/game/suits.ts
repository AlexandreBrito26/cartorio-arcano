import type { Look } from './types';

/**
 * Trajes dos viajantes: skins que mudam as cores das roupas, dos cabelos e dos olhos de quem chega ao balcão
 * (e a cor do halo em volta). É só aparência: a espécie, o formato e as regras do jogo não mudam.
 * Cada viajante recebe uma cor do traje de forma determinística (a mesma pessoa vem sempre igual).
 */

export type SuitId = 'original' | 'neve' | 'tinta' | 'floresta' | 'gala' | 'sombra' | 'aurora' | 'carnaval';

export interface Suit {
  id: SuitId;
  name: string;
  description: string;
  /** Preço em Selos (0 = já vem com o jogo). */
  cost: number;
  /** Cores de capa; o viajante recebe uma delas. Vazio = mantém a dele. */
  cloaks: readonly string[];
  hair: readonly string[];
  eyes: readonly string[];
  /** Tinge a pele em direção a `tint` (0 a 1), para trajes como o de tinta. */
  skin?: { tint: string; mix: number };
  /** Cor do brilho em volta do viajante (#rrggbb). */
  halo: string;
}

export const SUITS: readonly Suit[] = [
  {
    id: 'original',
    name: 'Trajes do Cartório',
    description: 'Cada viajante com as cores com que saiu de casa.',
    cost: 0,
    cloaks: [],
    hair: [],
    eyes: [],
    halo: '#7da0ff',
  },
  {
    id: 'neve',
    name: 'Capas de Inverno',
    description: 'Lã branca, azul-gelo e cinza de geada, com cabelos de neve fresca.',
    cost: 6,
    cloaks: ['#e8eef7', '#a9c8e8', '#8a97ad', '#c9d6e6'],
    hair: ['#f4f7ff', '#c9d6e6', '#8a97ad', '#5d6c85'],
    eyes: ['#5fb3e0', '#7fd0ff'],
    halo: '#bfe0ff',
  },
  {
    id: 'tinta',
    name: 'Retrato de Tinta',
    description: 'Tudo em tons de cinza, como num velho desenho a nanquim.',
    cost: 6,
    cloaks: ['#3a3a3a', '#5a5a5a', '#7a7a7a', '#9a9a9a'],
    hair: ['#1e1e1e', '#4a4a4a', '#8a8a8a', '#d0d0d0'],
    eyes: ['#e8e8e8'],
    skin: { tint: '#9a9a9a', mix: 0.85 },
    halo: '#cfcfcf',
  },
  {
    id: 'floresta',
    name: 'Folhagem',
    description: 'Capas de musgo, casca e folha de outono; cabelos cor de terra.',
    cost: 8,
    cloaks: ['#3f6b3a', '#6f8f3a', '#7a5a35', '#a8672e'],
    hair: ['#3a2a1a', '#6a4a2a', '#a8672e', '#c9b458'],
    eyes: ['#6fbf5a', '#d8b43a'],
    halo: '#9be08a',
  },
  {
    id: 'gala',
    name: 'Gala Dourada',
    description: 'Veludos de festa: ouro, marfim, bordô e azul-noite.',
    cost: 8,
    cloaks: ['#d9a83a', '#f1e4c3', '#7a1f33', '#1f2f5a'],
    hair: ['#2a1a10', '#e8d28a', '#7a4a2a'],
    eyes: ['#e0b44c', '#3a6a9a'],
    halo: '#ffd98a',
  },
  {
    id: 'sombra',
    name: 'Véus de Sombra',
    description: 'Negros e roxos fundos, cabelos de prata e olhos que brilham no escuro.',
    cost: 12,
    cloaks: ['#1a1226', '#2a1a44', '#101a2a', '#3a1a2a'],
    hair: ['#e8e8f4', '#9a9ab8', '#2a2a3a'],
    eyes: ['#ff4a5a', '#ffd84a', '#8a5aff'],
    halo: '#9a6aff',
  },
  {
    id: 'aurora',
    name: 'Prisma de Aurora',
    description: 'Cores de aurora boreal: verde-água, magenta, violeta e laranja, de cabelo pastel.',
    cost: 12,
    cloaks: ['#2fc9b0', '#d94ac0', '#7a5aff', '#ff9a4a'],
    hair: ['#b8f0e0', '#f0b8ff', '#c0b8ff', '#ffd8a8'],
    eyes: ['#5fffe0', '#ff5ad0'],
    halo: '#ff7ae0',
  },
  {
    id: 'carnaval',
    name: 'Carnaval das Brumas',
    description: 'Roupas berrantes, cabelos vivos e muita festa na fila.',
    cost: 14,
    cloaks: ['#e0354a', '#f0c42a', '#2ac0e0', '#e04ab0', '#4ac040'],
    hair: ['#ff4a8a', '#4af0c0', '#ffe04a', '#8a4aff', '#2a2a2a'],
    eyes: ['#ff4a8a', '#4af0c0', '#ffe04a'],
    halo: '#ffe04a',
  },
];

export const DEFAULT_SUIT: SuitId = 'original';
export const SUIT_IDS: readonly SuitId[] = SUITS.map((s) => s.id);

export const suitDef = (id: SuitId): Suit => SUITS.find((s) => s.id === id) ?? SUITS[0];

/** Hash pequeno e estável de um texto (djb2), para escolher cores sempre iguais para o mesmo viajante. */
function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

const channel = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);

/** Mistura duas cores #rrggbb; `mix` de 0 (só `a`) a 1 (só `b`). */
export function mixHex(a: string, b: string, mix: number): string {
  const m = Math.min(1, Math.max(0, mix));
  const out = [0, 1, 2].map((i) => Math.round(channel(a, i) * (1 - m) + channel(b, i) * m));
  return `#${out.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** `#rrggbb` → "r,g,b" para usar em `rgba(...)`. */
export const hexToRgb = (hex: string): string => [0, 1, 2].map((i) => channel(hex, i)).join(',');

/** O viajante vestido com o traje: só cores mudam; espécie, estilo de cabelo e barba ficam como estão. */
export function dressLook(look: Look, suit: Suit): Look {
  if (suit.id === DEFAULT_SUIT) return look;
  const seed = hash(`${look.species}|${look.skin}|${look.hair}|${look.eyes}|${look.cloak}|${look.hairStyle}`);
  const pick = (list: readonly string[], salt: number, fallback: string) =>
    list.length ? list[(seed + salt * 2654435761) % list.length >>> 0] : fallback;
  return {
    ...look,
    cloak: pick(suit.cloaks, 1, look.cloak),
    hair: pick(suit.hair, 2, look.hair),
    eyes: pick(suit.eyes, 3, look.eyes),
    skin: suit.skin ? mixHex(look.skin, suit.skin.tint, suit.skin.mix) : look.skin,
  };
}
