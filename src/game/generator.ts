import {
  AGE_RANGE,
  CLOAKS,
  EYES,
  FAKE_SYMBOLS,
  FIRST_NAMES,
  GAME_YEAR,
  GUILDS,
  GUILD_SYMBOLS,
  HAIRS,
  LAST_NAMES,
  LINES,
  MIN_WORK_AGE,
  PURPOSES,
  REALMS,
  SKINS,
  SPECIES,
} from './constants';
import { createRng, type Rng } from './rng';
import type {
  Applicant,
  DayRules,
  GuildSeal,
  IdentityCard,
  Look,
  Purpose,
  Species,
  TravelPass,
  ViolationCode,
} from './types';

const LETTERS = 'ABCDEFGHJKLMNPRSTVXZ';

/** Ordem de aplicação das falhas (algumas dependem de outras). */
const FAULT_ORDER: ViolationCode[] = [
  'DOC_AUSENTE',
  'REINO_PROIBIDO',
  'REINO_DIVERGENTE',
  'NOME_DIVERGENTE',
  'DOC_VENCIDO',
  'SELO_AUSENTE',
  'SELO_FALSO',
  'IDADE_INSUFICIENTE',
];

const isSealFault = (c: ViolationCode) => c === 'SELO_AUSENTE' || c === 'SELO_FALSO';

/** Muda de leve o nome, de um jeito visível para quem olha com atenção. */
export function mutateName(name: string, rng: Rng): string {
  const chars = [...name];
  const isLetter = (c: string) => /\p{L}/u.test(c);
  const inner = chars
    .map((c, i) => (i > 0 && isLetter(c) && isLetter(chars[i - 1]) ? i : -1))
    .filter((i) => i >= 0);

  for (const mode of rng.shuffle(['swap', 'vowel', 'last'] as const)) {
    const out = [...chars];

    if (mode === 'swap') {
      const cands = inner.filter(
        (i) => i + 1 < chars.length && isLetter(chars[i + 1]) && chars[i] !== chars[i + 1],
      );
      if (!cands.length) continue;
      const i = rng.pick(cands);
      [out[i], out[i + 1]] = [out[i + 1], out[i]];
    } else if (mode === 'vowel') {
      const cands = inner.filter((i) => 'aeiou'.includes(chars[i]));
      if (!cands.length) continue;
      const i = rng.pick(cands);
      out[i] = rng.pick([...'aeiou'].filter((v) => v !== chars[i]));
    } else {
      const i = chars.length - 1;
      out[i] = rng.pick([...'aeiymnrlst'].filter((v) => v !== chars[i]));
    }

    const result = out.join('');
    if (result !== name) return result;
  }

  return `${name}e`;
}

function makeLook(rng: Rng, species: Species): Look {
  return {
    species,
    skin: rng.pick(SKINS[species]),
    hair: rng.pick(HAIRS),
    eyes: rng.pick(EYES),
    cloak: rng.pick(CLOAKS),
    hairStyle: rng.pick([0, 1, 2] as const),
    beard: species === 'Anão' || (species === 'Humano' && rng.chance(0.25)),
  };
}

/** Monta um viajante e injeta exatamente as falhas pedidas. */
export function buildApplicant(
  rng: Rng,
  rules: DayRules,
  faults: ViolationCode[],
  id: string,
): Applicant {
  const { today } = rules;
  const sealRule = rules.active.includes('SELO_AUSENTE');
  const needsWork = faults.some((f) => isSealFault(f) || f === 'IDADE_INSUFICIENTE');

  const species = rng.pick(SPECIES);
  const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
  const openRealms = REALMS.filter((r) => !rules.bannedRealms.includes(r));
  const realm = rng.pick(openRealms);

  const purposePool: readonly Purpose[] = sealRule
    ? PURPOSES
    : PURPOSES.filter((p) => p !== 'Trabalho');
  const purpose: Purpose = needsWork ? 'Trabalho' : rng.pick(purposePool);

  const [minAge, maxAge] = AGE_RANGE[species];
  const age =
    purpose === 'Trabalho'
      ? rng.int(Math.max(MIN_WORK_AGE, minAge), maxAge)
      : rng.int(minAge, maxAge);

  let identity: IdentityCard | null = {
    name,
    species,
    realm,
    birthYear: GAME_YEAR - age,
    number: `${rng.int(1000, 9999)}-${rng.pick([...LETTERS])}${rng.pick([...LETTERS])}`,
    expiry: today + rng.int(0, 70),
  };
  let pass: TravelPass | null = { name, realm, purpose, expiry: today + rng.int(0, 70) };

  const guild = rng.pick(GUILDS);
  let seal: GuildSeal | null =
    sealRule && purpose === 'Trabalho' ? { guild, symbol: GUILD_SYMBOLS[guild] } : null;

  const ordered = [...faults].sort((a, b) => FAULT_ORDER.indexOf(a) - FAULT_ORDER.indexOf(b));

  for (const fault of ordered) {
    switch (fault) {
      case 'DOC_AUSENTE':
        if (rng.chance(0.5)) identity = null;
        else pass = null;
        break;
      case 'REINO_PROIBIDO':
        if (identity && pass && rules.bannedRealms.length) {
          const banned = rng.pick(rules.bannedRealms);
          identity.realm = banned;
          pass.realm = banned;
        }
        break;
      case 'REINO_DIVERGENTE':
        if (identity && pass) {
          pass.realm = rng.pick(openRealms.filter((r) => r !== identity!.realm));
        }
        break;
      case 'NOME_DIVERGENTE':
        if (identity && pass) {
          if (rng.chance(0.5)) pass.name = mutateName(identity.name, rng);
          else identity.name = mutateName(pass.name, rng);
        }
        break;
      case 'DOC_VENCIDO':
        if (identity && pass) {
          const target = rng.chance(0.5) ? identity : pass;
          target.expiry = today - rng.int(1, 45);
        }
        break;
      case 'SELO_AUSENTE':
        seal = null;
        break;
      case 'SELO_FALSO':
        if (seal) seal = { guild: seal.guild, symbol: rng.pick(FAKE_SYMBOLS) };
        break;
      case 'IDADE_INSUFICIENTE':
        if (identity) identity.birthYear = GAME_YEAR - rng.int(7, MIN_WORK_AGE - 1);
        break;
    }
  }

  return {
    id,
    look: makeLook(rng, species),
    line: rng.pick(LINES[purpose]),
    identity,
    pass,
    seal,
  };
}

export function pickFaults(rng: Rng, rules: DayRules): ViolationCode[] {
  const primary = rng.pick(rules.active);
  if (primary === 'DOC_AUSENTE' || rules.day < 3 || !rng.chance(0.3)) return [primary];

  const pool = rules.active.filter(
    (c) => c !== 'DOC_AUSENTE' && c !== primary && !(isSealFault(c) && isSealFault(primary)),
  );
  return pool.length ? [primary, rng.pick(pool)] : [primary];
}

/** Gera a fila do dia, misturando viajantes válidos e irregulares. */
export function generateDay(rules: DayRules, seed: number): Applicant[] {
  const rng = createRng(seed);
  const count = rules.applicants;
  const ratio = rng.pick([0.4, 0.5, 0.5, 0.6]);
  const invalid = Math.min(count - 1, Math.max(1, Math.round(count * ratio)));
  const flags = rng.shuffle(Array.from({ length: count }, (_, i) => i < invalid));

  return flags.map((bad, i) =>
    buildApplicant(rng, rules, bad ? pickFaults(rng, rules) : [], `d${rules.day}-${i}`),
  );
}
