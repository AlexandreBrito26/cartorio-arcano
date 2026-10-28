import { initialSkins, sanitizeSkins, type SkinsState } from './skins';
import { sanitizeUpgrades, type Upgrades } from './upgrades';

export interface SaveData {
  day: number;
  coins: number;
  /** Melhorias compradas (saves antigos não têm este campo). */
  upgrades: Upgrades;
}

const KEY = 'cartorio-arcano:save';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SaveData>;
    if (typeof data.day === 'number' && typeof data.coins === 'number') {
      return { day: data.day, coins: data.coins, upgrades: sanitizeUpgrades(data.upgrades) };
    }
  } catch {
    // localStorage indisponível ou JSON inválido: segue sem save.
  }
  return null;
}

export function persistSave(save: SaveData | null): void {
  try {
    if (save) localStorage.setItem(KEY, JSON.stringify(save));
    else localStorage.removeItem(KEY);
  } catch {
    // Ignora erros de armazenamento.
  }
}

const SKINS_KEY = 'cartorio-arcano:skins';

/** Skins e Selos ficam à parte do save do expediente: sobrevivem a uma falência e a um novo jogo. */
export function loadSkins(): SkinsState {
  try {
    const raw = localStorage.getItem(SKINS_KEY);
    if (raw) return sanitizeSkins(JSON.parse(raw));
  } catch {
    // localStorage indisponível ou JSON inválido: começa sem skins extras.
  }
  return initialSkins();
}

export function persistSkins(skins: SkinsState): void {
  try {
    localStorage.setItem(SKINS_KEY, JSON.stringify(skins));
  } catch {
    // Ignora erros de armazenamento.
  }
}
