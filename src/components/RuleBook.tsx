import { useState } from 'react';
import {
  FINE,
  GAME_YEAR,
  LATE_PENALTY,
  GUILDS,
  GUILD_SYMBOLS,
  REWARD_APPROVE,
  REWARD_DENY,
  REWARD_DENY_PARTIAL,
  dailyExpenses,
  formatDate,
} from '../game/constants';
import { ruleText } from '../game/rules';
import type { DayRules } from '../game/types';

type Tab = 'rules' | 'seals' | 'pay';

const TABS: { id: Tab; label: string }[] = [
  { id: 'rules', label: 'Regras' },
  { id: 'seals', label: 'Selos' },
  { id: 'pay', label: 'Pagamento' },
];

export function RuleBook({ rules }: { rules: DayRules }) {
  const [tab, setTab] = useState<Tab>('rules');
  const sealsActive = rules.active.includes('SELO_AUSENTE');

  return (
    <aside className="rulebook" aria-label="Regulamento do cartório">
      <h2>Regulamento</h2>
      <p className="rulebook-date">
        Hoje: <strong>{formatDate(rules.today)}</strong>, ano {GAME_YEAR}
      </p>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rulebook-body" role="tabpanel">
        {tab === 'rules' && (
          <ol className="rule-list">
            {rules.active.map((code) => (
              <li key={code} className={rules.newCodes.includes(code) ? 'new' : undefined}>
                {ruleText(code, rules)}
              </li>
            ))}
          </ol>
        )}

        {tab === 'seals' &&
          (sealsActive ? (
            <table className="seal-table">
              <caption>Símbolos oficiais</caption>
              <tbody>
                {GUILDS.map((g) => (
                  <tr key={g}>
                    <th scope="row">{g}</th>
                    <td className="symbol">{GUILD_SYMBOLS[g]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Hoje ainda não há regras sobre selos de guilda.</p>
          ))}

        {tab === 'pay' && (
          <ul className="pay-list">
            <li>Aprovar corretamente: <strong>+{REWARD_APPROVE}</strong></li>
            <li>Negar com o motivo certo: <strong>+{REWARD_DENY}</strong></li>
            <li>Negar com o motivo errado: <strong>+{REWARD_DENY_PARTIAL}</strong></li>
            <li>Infração (decisão errada): <strong>−{FINE}</strong></li>
            <li>Viajante sem atendimento quando o relógio zera: <strong>−{LATE_PENALTY}</strong></li>
            <li>Despesas do fim do dia: <strong>−{dailyExpenses(rules.day)}</strong></li>
          </ul>
        )}
      </div>
    </aside>
  );
}
