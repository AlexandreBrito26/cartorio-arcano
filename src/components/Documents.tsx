import { GAME_YEAR, formatDate } from '../game/constants';
import type { GuildSeal, IdentityCard, TravelPass } from '../game/types';

interface Marks {
  marks: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

interface FieldProps extends Marks {
  id: string;
  label: string;
  value: string;
}

/** Cada campo pode ser marcado com um clique, como grifar com giz. */
function Field({ id, label, value, marks, onToggle }: FieldProps) {
  const on = marks.has(id);
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <button
        type="button"
        className={`field-value${on ? ' marked' : ''}`}
        aria-pressed={on}
        onClick={() => onToggle(id)}
      >
        {value}
      </button>
    </div>
  );
}

export function IdentityDoc({ card, ...m }: { card: IdentityCard } & Marks) {
  return (
    <article className="doc doc-id" aria-label="Carta de Identidade Arcana">
      <header>
        <h3>Carta de Identidade Arcana</h3>
        <p>Registro nº {card.number}</p>
      </header>
      <Field id="id.name" label="Nome" value={card.name} {...m} />
      <Field id="id.species" label="Espécie" value={card.species} {...m} />
      <Field id="id.realm" label="Reino de origem" value={card.realm} {...m} />
      <Field id="id.birth" label="Nascimento (ano)" value={String(card.birthYear)} {...m} />
      <Field id="id.expiry" label="Validade" value={formatDate(card.expiry)} {...m} />
      <footer>Ano corrente {GAME_YEAR}</footer>
    </article>
  );
}

export function PassDoc({ pass, ...m }: { pass: TravelPass } & Marks) {
  return (
    <article className="doc doc-pass" aria-label="Passe de Viagem">
      <header>
        <h3>Passe de Viagem</h3>
        <p>Uma travessia pelas Brumas</p>
      </header>
      <Field id="pass.name" label="Portador" value={pass.name} {...m} />
      <Field id="pass.realm" label="Reino de partida" value={pass.realm} {...m} />
      <Field id="pass.purpose" label="Finalidade" value={pass.purpose} {...m} />
      <Field id="pass.expiry" label="Validade" value={formatDate(pass.expiry)} {...m} />
    </article>
  );
}

export function SealDoc({ seal, marks, onToggle }: { seal: GuildSeal } & Marks) {
  const on = marks.has('seal.symbol');
  return (
    <article className="doc doc-seal" aria-label="Selo de Guilda">
      <header>
        <h3>Selo de Guilda</h3>
        <p>Guilda dos {seal.guild}</p>
      </header>
      <button
        type="button"
        className={`seal-symbol${on ? ' marked' : ''}`}
        aria-pressed={on}
        aria-label={`Símbolo do selo: ${seal.symbol}`}
        onClick={() => onToggle('seal.symbol')}
      >
        {seal.symbol}
      </button>
    </article>
  );
}
