import { BANNED_ITEMS, ENTRY_FEE, GAME_YEAR, GUILD_SYMBOLS, formatDateFull } from './constants';
import { fineAmount, rewardApprove, rewardDeny, rewardDenyPartial, type Upgrades } from './upgrades';
import type { Applicant, DayRules, Decision, DecisionResult, Violation, ViolationCode } from './types';

export const DENY_LABEL: Record<ViolationCode, string> = {
  DOC_AUSENTE: 'Documento ausente',
  NOME_DIVERGENTE: 'Nome divergente',
  DOC_VENCIDO: 'Documento vencido',
  REINO_DIVERGENTE: 'Reino divergente',
  REINO_PROIBIDO: 'Reino proibido',
  SELO_AUSENTE: 'Selo ausente',
  SELO_FALSO: 'Selo falso',
  IDADE_INSUFICIENTE: 'Idade insuficiente',
  BAGAGEM_PROIBIDA: 'Item proibido na bagagem',
  TAXA_NAO_PAGA: 'Taxa não paga',
  ESPECIE_SEM_DOC: 'Documento da espécie ausente',
};

/** Texto da regra, como aparece no Regulamento. */
export function ruleText(code: ViolationCode, rules: DayRules): string {
  switch (code) {
    case 'DOC_AUSENTE':
      return 'Todo viajante deve entregar a Carta de Identidade e o Passe de Viagem.';
    case 'NOME_DIVERGENTE':
      return 'O nome deve ser idêntico na Carta e no Passe.';
    case 'DOC_VENCIDO':
      return 'Documento com validade anterior a hoje não é aceito.';
    case 'REINO_DIVERGENTE':
      return 'O reino de origem deve coincidir na Carta e no Passe.';
    case 'REINO_PROIBIDO':
      return `Fronteira fechada para: ${rules.bannedRealms.join(', ')}.`;
    case 'SELO_AUSENTE':
      return 'Passe com finalidade "Trabalho" exige o Selo de Guilda.';
    case 'SELO_FALSO':
      return 'O símbolo do Selo deve ser o oficial da guilda (aba Selos).';
    case 'IDADE_INSUFICIENTE':
      return `Para trabalhar é preciso ter ${rules.minWorkAge} anos ou mais (ano corrente: ${GAME_YEAR}).`;
    case 'BAGAGEM_PROIBIDA':
      return `Nenhum destes itens pode entrar na bagagem: ${BANNED_ITEMS.join(', ')}.`;
    case 'TAXA_NAO_PAGA':
      return `Toda entrada paga ${ENTRY_FEE} moedas no balcão.`;
    case 'ESPECIE_SEM_DOC':
      return 'Quem não for humano precisa do Documento da Espécie, com a mesma espécie da Carta.';
  }
}

/** Fonte única da verdade: o que está de fato errado nos documentos. */
export function evaluate(applicant: Applicant, rules: DayRules): Violation[] {
  const out: Violation[] = [];
  const has = (code: ViolationCode) => rules.active.includes(code);
  const { identity, pass, seal } = applicant;

  if (has('DOC_AUSENTE')) {
    if (!identity) out.push({ code: 'DOC_AUSENTE', detail: 'Falta a Carta de Identidade.' });
    if (!pass) out.push({ code: 'DOC_AUSENTE', detail: 'Falta o Passe de Viagem.' });
  }

  if (has('NOME_DIVERGENTE') && identity && pass && identity.name !== pass.name) {
    out.push({
      code: 'NOME_DIVERGENTE',
      detail: `Nome na Carta ("${identity.name}") difere do Passe ("${pass.name}").`,
    });
  }

  if (has('DOC_VENCIDO')) {
    if (identity && identity.expiry < rules.today) {
      out.push({
        code: 'DOC_VENCIDO',
        detail: `A Carta venceu em ${formatDateFull(identity.expiry)} (hoje é ${formatDateFull(rules.today)}).`,
      });
    }
    if (pass && pass.expiry < rules.today) {
      out.push({
        code: 'DOC_VENCIDO',
        detail: `O Passe venceu em ${formatDateFull(pass.expiry)} (hoje é ${formatDateFull(rules.today)}).`,
      });
    }
  }

  if (has('REINO_DIVERGENTE') && identity && pass && identity.realm !== pass.realm) {
    out.push({
      code: 'REINO_DIVERGENTE',
      detail: `A Carta diz "${identity.realm}", o Passe diz "${pass.realm}".`,
    });
  }

  if (has('REINO_PROIBIDO')) {
    const banned = [identity?.realm, pass?.realm].find(
      (r) => r !== undefined && rules.bannedRealms.includes(r),
    );
    if (banned) {
      out.push({ code: 'REINO_PROIBIDO', detail: `Viajante de ${banned}: fronteira fechada.` });
    }
  }

  if (pass && pass.purpose === 'Trabalho') {
    if (has('SELO_AUSENTE') && !seal) {
      out.push({ code: 'SELO_AUSENTE', detail: 'Finalidade "Trabalho" sem Selo de Guilda.' });
    }
    if (has('SELO_FALSO') && seal && seal.symbol !== GUILD_SYMBOLS[seal.guild]) {
      out.push({
        code: 'SELO_FALSO',
        detail: `O selo dos ${seal.guild} deveria ter ${GUILD_SYMBOLS[seal.guild]}, mas tem ${seal.symbol}.`,
      });
    }
    if (has('IDADE_INSUFICIENTE') && identity) {
      const age = GAME_YEAR - identity.birthYear;
      if (age < rules.minWorkAge) {
        out.push({
          code: 'IDADE_INSUFICIENTE',
          detail: `Nascido em ${identity.birthYear}: tem ${age} anos (mínimo ${rules.minWorkAge}).`,
        });
      }
    }
  }

  if (has('BAGAGEM_PROIBIDA')) {
    const item = applicant.baggage.find((i) => BANNED_ITEMS.includes(i));
    if (item) out.push({ code: 'BAGAGEM_PROIBIDA', detail: `Bagagem com item proibido: ${item}.` });
  }

  if (has('TAXA_NAO_PAGA') && applicant.fee < ENTRY_FEE) {
    out.push({
      code: 'TAXA_NAO_PAGA',
      detail: `Pagou ${applicant.fee} moeda(s); a entrada custa ${ENTRY_FEE}.`,
    });
  }

  if (has('ESPECIE_SEM_DOC') && applicant.look.species !== 'Humano') {
    if (!applicant.speciesDoc) {
      out.push({ code: 'ESPECIE_SEM_DOC', detail: 'Falta o Documento da Espécie.' });
    } else if (applicant.speciesDoc.species !== applicant.look.species) {
      out.push({
        code: 'ESPECIE_SEM_DOC',
        detail: `O documento diz "${applicant.speciesDoc.species}", mas o viajante é ${applicant.look.species}.`,
      });
    }
  }

  return out;
}

export function judge(violations: Violation[], decision: Decision, ups?: Upgrades): DecisionResult {
  const fine = fineAmount(ups);
  const clean = violations.length === 0;

  if (decision.kind === 'approve') {
    return clean
      ? {
          decision,
          violations,
          verdict: 'perfect',
          delta: rewardApprove(ups),
          headline: 'Carimbo certo! Os documentos estavam em ordem.',
        }
      : {
          decision,
          violations,
          verdict: 'wrong',
          delta: -fine,
          headline: 'Infração! Um viajante irregular passou pelo balcão.',
        };
  }

  if (clean) {
    return {
      decision,
      violations,
      verdict: 'wrong',
      delta: -fine,
      headline: 'Infração! Você barrou um viajante em ordem.',
    };
  }

  const matched = violations.some((v) => v.code === decision.reason);
  return matched
    ? {
        decision,
        violations,
        verdict: 'perfect',
        delta: rewardDeny(ups),
        headline: 'Negado pelo motivo certo!',
      }
    : {
        decision,
        violations,
        verdict: 'partial',
        delta: rewardDenyPartial(ups),
        headline: 'Negado, mas o motivo registrado estava errado.',
      };
}
