export type Species =
  | 'Humano'
  | 'Elfo'
  | 'Anão'
  | 'Goblin'
  | 'Fada'
  | 'Draconato'
  | 'Tritão'
  | 'Golem'
  | 'Espectro';

export type Realm =
  | 'Vale Dourado'
  | 'Ilhas de Cristal'
  | 'Floresta Sussurrante'
  | 'Montanhas de Ferro'
  | 'Pântano de Névoa'
  | 'Reino das Cinzas'
  | 'Abismo Azul'
  | 'Planícies do Vento';

export type Purpose = 'Visita' | 'Comércio' | 'Trabalho' | 'Estudo';

export type Guild = 'Ferreiros' | 'Alquimistas' | 'Cartógrafos' | 'Menestréis';

export type ViolationCode =
  | 'DOC_AUSENTE'
  | 'NOME_DIVERGENTE'
  | 'DOC_VENCIDO'
  | 'REINO_DIVERGENTE'
  | 'REINO_PROIBIDO'
  | 'SELO_AUSENTE'
  | 'SELO_FALSO'
  | 'IDADE_INSUFICIENTE'
  | 'BAGAGEM_PROIBIDA'
  | 'TAXA_NAO_PAGA'
  | 'ESPECIE_SEM_DOC';

export interface Look {
  species: Species;
  skin: string;
  hair: string;
  eyes: string;
  cloak: string;
  hairStyle: 0 | 1 | 2;
  beard: boolean;
}

export interface IdentityCard {
  name: string;
  species: Species;
  realm: Realm;
  birthYear: number;
  number: string;
  /** Data de validade, em "dia do ano" (ver formatDate). */
  expiry: number;
}

export interface TravelPass {
  name: string;
  realm: Realm;
  purpose: Purpose;
  expiry: number;
}

export interface GuildSeal {
  guild: Guild;
  symbol: string;
}

export interface SpeciesDoc {
  species: Species;
  code: string;
}

export interface Applicant {
  id: string;
  look: Look;
  line: string;
  identity: IdentityCard | null;
  pass: TravelPass | null;
  seal: GuildSeal | null;
  /** Itens declarados na bagagem. */
  baggage: string[];
  /** Moedas pagas no balcão como taxa de entrada. */
  fee: number;
  /** Documento da espécie (null para humanos). */
  speciesDoc: SpeciesDoc | null;
}

export interface Violation {
  code: ViolationCode;
  detail: string;
}

export interface DayRules {
  day: number;
  /** "Dia do ano" de hoje. */
  today: number;
  applicants: number;
  /** Regras em vigor (acumulam de um dia para o outro). */
  active: ViolationCode[];
  bannedRealms: Realm[];
  minWorkAge: number;
  headline: string;
  story: string;
  /** Regras que passam a valer hoje. */
  newCodes: ViolationCode[];
  /** Avisos extras do briefing (ex.: decreto atualizado). */
  notes: string[];
}

export type Decision = { kind: 'approve' } | { kind: 'deny'; reason: ViolationCode };

export type Verdict = 'perfect' | 'partial' | 'wrong';

export interface DecisionResult {
  decision: Decision;
  violations: Violation[];
  verdict: Verdict;
  delta: number;
  headline: string;
}
