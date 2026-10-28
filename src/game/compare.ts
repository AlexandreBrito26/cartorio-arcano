import { formatDateFull } from './constants';
import type { Applicant, DayRules, ViolationCode } from './types';

/** Resultado de conferir campos que o jogador grifou na mesa. */
export interface CompareResult {
  /** Identifica o par (ou o campo) conferido; serve de chave e de teste. */
  id: string;
  ok: boolean;
  text: string;
}

interface PairDef {
  id: string;
  label: string;
  /** Ids dos dois campos (ver Documents.tsx) que precisam estar grifados. */
  fields: [string, string];
  rule: ViolationCode;
  values: (a: Applicant) => [string, string] | null;
  names: [string, string];
}

const PAIRS: readonly PairDef[] = [
  {
    id: 'nome',
    label: 'Nome',
    fields: ['id.name', 'pass.name'],
    rule: 'NOME_DIVERGENTE',
    names: ['Carta', 'Passe'],
    values: (a) => (a.identity && a.pass ? [a.identity.name, a.pass.name] : null),
  },
  {
    id: 'reino',
    label: 'Reino',
    fields: ['id.realm', 'pass.realm'],
    rule: 'REINO_DIVERGENTE',
    names: ['Carta', 'Passe'],
    values: (a) => (a.identity && a.pass ? [a.identity.realm, a.pass.realm] : null),
  },
  {
    id: 'especie',
    label: 'Espécie',
    fields: ['id.species', 'especie.species'],
    rule: 'ESPECIE_SEM_DOC',
    names: ['Carta', 'Documento da Espécie'],
    values: (a) => (a.identity && a.speciesDoc ? [a.identity.species, a.speciesDoc.species] : null),
  },
];

const EXPIRY: readonly { field: string; id: string; name: string; pick: (a: Applicant) => number | null }[] = [
  { field: 'id.expiry', id: 'validade-carta', name: 'A Carta', pick: (a) => a.identity?.expiry ?? null },
  { field: 'pass.expiry', id: 'validade-passe', name: 'O Passe', pick: (a) => a.pass?.expiry ?? null },
];

/**
 * Conferência da mesa: com dois campos comparáveis grifados (nome, reino, espécie) o jogo diz se
 * batem; com uma validade grifada, diz se ela está em dia frente a "hoje". Só conferem o que o
 * Regulamento de hoje cobra, e usam a mesma lógica de `evaluate()`; quem decide e escolhe o
 * motivo ainda é o jogador.
 */
export function compareMarks(
  applicant: Applicant,
  rules: DayRules,
  marks: ReadonlySet<string>,
): CompareResult[] {
  const out: CompareResult[] = [];

  for (const p of PAIRS) {
    if (!p.fields.every((f) => marks.has(f))) continue;
    if (!rules.active.includes(p.rule)) {
      out.push({ id: p.id, ok: true, text: `${p.label}: essa conferência não vale no Regulamento de hoje.` });
      continue;
    }
    const v = p.values(applicant);
    if (!v) continue;
    const ok = v[0] === v[1];
    out.push({
      id: p.id,
      ok,
      text: ok
        ? `${p.label}: igual na ${p.names[0]} e no ${p.names[1]}.`
        : `${p.label}: DIFERENTE. ${p.names[0]}: ${v[0]} · ${p.names[1]}: ${v[1]}.`,
    });
  }

  if (rules.active.includes('DOC_VENCIDO')) {
    for (const e of EXPIRY) {
      if (!marks.has(e.field)) continue;
      const expiry = e.pick(applicant);
      if (expiry === null) continue;
      const ok = expiry >= rules.today;
      out.push({
        id: e.id,
        ok,
        text: ok
          ? `${e.name} vale até ${formatDateFull(expiry)}: em dia (hoje é ${formatDateFull(rules.today)}).`
          : `${e.name} venceu em ${formatDateFull(expiry)}: VENCIDO (hoje é ${formatDateFull(rules.today)}).`,
      });
    }
  }

  return out;
}
