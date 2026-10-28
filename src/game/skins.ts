import { DEFAULT_SUIT, SUIT_IDS, suitDef, type SuitId } from './suits';
import type { Weather } from './weather';

/**
 * Skins do cartório: temas visuais comprados com Selos (moeda à parte das moedas do expediente,
 * ganha ao fechar cada dia sem falir). Uma skin troca as cores da interface inteira (variáveis CSS),
 * o céu do clima do dia e a tinta da arte do balcão. Dados e regras puros, testados.
 */

export type SkinId = 'classico' | 'ambar' | 'mare' | 'musgo' | 'rubi' | 'prata' | 'neon';

/** Variáveis CSS que uma skin define (sem o `--`). */
export interface SkinUi {
  night: string;
  night2: string;
  wood: string;
  wood2: string;
  parchment: string;
  parchment2: string;
  gold: string;
  violet: string;
  text: string;
  muted: string;
  tide: string;
  tide2: string;
  /** Brilho de fundo da página. */
  glow: string;
  /** Luz quente do lado do aprendiz, sobre o balcão. */
  warm: string;
}

export interface SkinScene {
  /** Cor que tinge o céu do dia e quanto (0 a 1). */
  skyTint: number;
  skyMix: number;
  /** Multiplicadores de cor da arte do fundo e da frente do balcão (0xffffff = sem mudança). */
  artTint: number;
  frontTint: number;
  /** Cor da placa do guichê. */
  plaque: number;
}

export interface Skin {
  id: SkinId;
  name: string;
  description: string;
  /** Preço em Selos (0 = já vem com o jogo). */
  cost: number;
  ui: SkinUi;
  scene: SkinScene;
}

export const SKINS: readonly Skin[] = [
  {
    id: 'classico',
    name: 'Cartório Clássico',
    description: 'A noite roxa das Brumas, com ouro velho e madeira escura. Do jeito que a Mestra deixou.',
    cost: 0,
    ui: {
      night: '#120e24', night2: '#1c1638', wood: '#2b1d17', wood2: '#3a2820',
      parchment: '#f1e4c3', parchment2: '#e2cf9f', gold: '#e0b44c', violet: '#7a66e0',
      text: '#ece6ff', muted: '#a79fc9', tide: '#5fb3c4', tide2: '#3d8fa3', glow: '#3b2f7a', warm: '#ffb54d',
    },
    scene: { skyTint: 0xffffff, skyMix: 0, artTint: 0xffffff, frontTint: 0xffffff, plaque: 0xe0b44c },
  },
  {
    id: 'ambar',
    name: 'Âmbar de Vela',
    description: 'Tudo à luz de vela: madeira de mel, pergaminho dourado e um céu de brasa fraca.',
    cost: 6,
    ui: {
      night: '#1a1008', night2: '#2a1a0e', wood: '#3a2412', wood2: '#4d3118',
      parchment: '#f4e2b8', parchment2: '#e6c98a', gold: '#ffb347', violet: '#c97b3a',
      text: '#fdeccf', muted: '#c9a77a', tide: '#e0a458', tide2: '#b9803a', glow: '#6a3a14', warm: '#ffa133',
    },
    scene: { skyTint: 0xff9a3c, skyMix: 0.35, artTint: 0xffd9a8, frontTint: 0xffe2b8, plaque: 0xffb347 },
  },
  {
    id: 'mare',
    name: 'Maré Profunda',
    description: 'O cartório no fundo do mar das Brumas: azuis frios, espuma e luz de águas-vivas.',
    cost: 8,
    ui: {
      night: '#06141f', night2: '#0b2233', wood: '#12303a', wood2: '#1b4450',
      parchment: '#dcf1f0', parchment2: '#b8dcdc', gold: '#5fe0d0', violet: '#3fa3d8',
      text: '#def4ff', muted: '#8fb8c9', tide: '#7fe9ff', tide2: '#3fb6cf', glow: '#0f4a66', warm: '#5fd6ff',
    },
    scene: { skyTint: 0x2f9fd8, skyMix: 0.4, artTint: 0xb8e4ff, frontTint: 0xcfeeff, plaque: 0x5fe0d0 },
  },
  {
    id: 'musgo',
    name: 'Bosque de Musgo',
    description: 'Um balcão coberto de folhas, verdes profundos e vaga-lumes no portão.',
    cost: 10,
    ui: {
      night: '#0b1a10', night2: '#12281a', wood: '#2a2418', wood2: '#3a3320',
      parchment: '#e8f0c8', parchment2: '#cfdca0', gold: '#b8d65a', violet: '#5fb36a',
      text: '#e6f5da', muted: '#9ab894', tide: '#7fd68a', tide2: '#4aa05a', glow: '#1f5a2a', warm: '#c8f07a',
    },
    scene: { skyTint: 0x4fbf5a, skyMix: 0.38, artTint: 0xcdf0b8, frontTint: 0xe0f5cc, plaque: 0xb8d65a },
  },
  {
    id: 'rubi',
    name: 'Rubi das Cinzas',
    description: 'Vermelhos de forja e carimbo recém-lacrado, como no Reino das Cinzas.',
    cost: 12,
    ui: {
      night: '#1c0a0e', night2: '#2e1016', wood: '#3a1a14', wood2: '#50261c',
      parchment: '#f5dccb', parchment2: '#e2b8a0', gold: '#ff8a5c', violet: '#d9455f',
      text: '#ffe6e0', muted: '#c99a98', tide: '#ff7a8a', tide2: '#d9455f', glow: '#7a1a2a', warm: '#ff6a4a',
    },
    scene: { skyTint: 0xd9344a, skyMix: 0.4, artTint: 0xffb8a8, frontTint: 0xffd0c0, plaque: 0xff8a5c },
  },
  {
    id: 'prata',
    name: 'Luar de Prata',
    description: 'Tudo em prata e cinza-lunar, como um cartório de espectros.',
    cost: 14,
    ui: {
      night: '#101216', night2: '#1b1e26', wood: '#262a30', wood2: '#343a42',
      parchment: '#eef0f5', parchment2: '#cfd4de', gold: '#c9d2e3', violet: '#8a94b8',
      text: '#eef0f8', muted: '#9aa2b4', tide: '#b8c4de', tide2: '#8a98b8', glow: '#3a4258', warm: '#dfe6ff',
    },
    scene: { skyTint: 0x9aa2b8, skyMix: 0.5, artTint: 0xc8cede, frontTint: 0xdfe4f0, plaque: 0xdfe6ff },
  },
  {
    id: 'neon',
    name: 'Neon Arcano',
    description: 'Rosa e ciano elétricos: o balcão visto por um mago de outro século.',
    cost: 20,
    ui: {
      night: '#0a0618', night2: '#150a2e', wood: '#1e0f3a', wood2: '#2d1a52',
      parchment: '#ffe6fb', parchment2: '#f0b8ec', gold: '#ff3df2', violet: '#3df2ff',
      text: '#f6e8ff', muted: '#b88adf', tide: '#3df2ff', tide2: '#19b8c9', glow: '#5a1a9a', warm: '#ff3df2',
    },
    scene: { skyTint: 0xb420ff, skyMix: 0.5, artTint: 0xe0b8ff, frontTint: 0xf0d0ff, plaque: 0x3df2ff },
  },
];

export const DEFAULT_SKIN: SkinId = 'classico';
export const SKIN_IDS: readonly SkinId[] = SKINS.map((s) => s.id);

export const skinDef = (id: SkinId): Skin => SKINS.find((s) => s.id === id) ?? SKINS[0];

export interface SkinsState {
  owned: SkinId[];
  equipped: SkinId;
  /** Selos disponíveis. */
  selos: number;
  /** Trajes dos viajantes (game/suits.ts) que você tem e o que está em uso. */
  suits: SuitId[];
  suit: SuitId;
}

export const initialSkins = (): SkinsState => ({
  owned: [DEFAULT_SKIN],
  equipped: DEFAULT_SKIN,
  selos: 0,
  suits: [DEFAULT_SUIT],
  suit: DEFAULT_SUIT,
});

/** Selos por dia fechado sem falir: 1, e 3 a cada quinto dia. */
export const selosForDay = (day: number): number => 1 + (day > 0 && day % 5 === 0 ? 2 : 0);
/** Bônus por chegar ao fim da campanha. */
export const ENDING_SELOS = 5;

const isSkinId = (v: unknown): v is SkinId => typeof v === 'string' && (SKIN_IDS as readonly string[]).includes(v);

const isSuitId = (v: unknown): v is SuitId => typeof v === 'string' && (SUIT_IDS as readonly string[]).includes(v);

/** Valida um objeto vindo do localStorage. A skin clássica é sempre sua. */
export function sanitizeSkins(raw: unknown): SkinsState {
  const out = initialSkins();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Record<string, unknown>;
  if (Array.isArray(r.owned)) out.owned = [...new Set([DEFAULT_SKIN, ...r.owned.filter(isSkinId)])];
  if (typeof r.selos === 'number' && Number.isFinite(r.selos) && r.selos > 0) out.selos = Math.floor(r.selos);
  if (isSkinId(r.equipped) && out.owned.includes(r.equipped)) out.equipped = r.equipped;
  if (Array.isArray(r.suits)) out.suits = [...new Set([DEFAULT_SUIT, ...r.suits.filter(isSuitId)])];
  if (isSuitId(r.suit) && out.suits.includes(r.suit)) out.suit = r.suit;
  return out;
}

export const owns = (s: SkinsState, id: SkinId) => s.owned.includes(id);

export const canBuySkin = (s: SkinsState, id: SkinId) => !owns(s, id) && s.selos >= skinDef(id).cost;

/** Compra e já veste a skin. Devolve null se já é sua ou se faltam Selos. */
export function buySkin(s: SkinsState, id: SkinId): SkinsState | null {
  if (!canBuySkin(s, id)) return null;
  return { ...s, owned: [...s.owned, id], equipped: id, selos: s.selos - skinDef(id).cost };
}

export function equipSkin(s: SkinsState, id: SkinId): SkinsState {
  return owns(s, id) ? { ...s, equipped: id } : s;
}

export const ownsSuit = (s: SkinsState, id: SuitId) => s.suits.includes(id);

export const canBuySuit = (s: SkinsState, id: SuitId) => !ownsSuit(s, id) && s.selos >= suitDef(id).cost;

/** Compra e já veste o traje. Devolve null se já é seu ou se faltam Selos. */
export function buySuit(s: SkinsState, id: SuitId): SkinsState | null {
  if (!canBuySuit(s, id)) return null;
  return { ...s, suits: [...s.suits, id], suit: id, selos: s.selos - suitDef(id).cost };
}

export function equipSuit(s: SkinsState, id: SuitId): SkinsState {
  return ownsSuit(s, id) ? { ...s, suit: id } : s;
}

export function grantSelos(s: SkinsState, n: number): SkinsState {
  return n > 0 ? { ...s, selos: s.selos + Math.floor(n) } : s;
}

/** Mistura `color` com `tint` (0xRRGGBB); `mix` de 0 (nada) a 1 (só a tinta). */
export function tintColor(color: number, tint: number, mix: number): number {
  const m = Math.min(1, Math.max(0, mix));
  const ch = (shift: number) => {
    const a = (color >> shift) & 255;
    const b = (tint >> shift) & 255;
    return Math.round(a * (1 - m) + b * m);
  };
  return (ch(16) << 16) | (ch(8) << 8) | ch(0);
}

/** O clima do dia com o céu e as nuvens tingidos pela skin. A skin clássica devolve o próprio clima. */
export function skinWeather(weather: Weather, skin: Skin): Weather {
  const { skyTint, skyMix } = skin.scene;
  if (skyMix <= 0) return weather;
  const t = (c: number) => tintColor(c, skyTint, skyMix);
  return {
    ...weather,
    sky: weather.sky.map(t) as Weather['sky'],
    clouds: { ...weather.clouds, color: t(weather.clouds.color) },
  };
}

/** As variáveis CSS da skin, com o `--` (prontas para `style.setProperty`). */
export function skinCssVars(skin: Skin): Record<string, string> {
  const ui = skin.ui;
  return {
    '--night': ui.night,
    '--night-2': ui.night2,
    '--wood': ui.wood,
    '--wood-2': ui.wood2,
    '--parchment': ui.parchment,
    '--parchment-2': ui.parchment2,
    '--gold': ui.gold,
    '--violet': ui.violet,
    '--text': ui.text,
    '--muted': ui.muted,
    '--tide': ui.tide,
    '--tide-2': ui.tide2,
    '--glow': ui.glow,
    '--warm': ui.warm,
  };
}

/** Faixas do céu da chuva, tingidas pela skin, como `linear-gradient` para a prévia do cartão. */
export function skyGradient(weather: Weather, skin: Skin): string {
  const sky = skinWeather(weather, skin).sky;
  const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
  return `linear-gradient(180deg, ${sky.map(hex).join(', ')})`;
}
