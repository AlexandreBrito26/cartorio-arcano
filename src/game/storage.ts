export interface SaveData {
  day: number;
  coins: number;
}

const KEY = 'cartorio-arcano:save';

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SaveData>;
    if (typeof data.day === 'number' && typeof data.coins === 'number') {
      return { day: data.day, coins: data.coins };
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
