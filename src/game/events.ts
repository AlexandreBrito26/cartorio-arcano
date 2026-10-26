/** Eventos de história: acontecem antes de certos dias e trazem escolhas com efeito no saldo. */

export interface EventOption {
  label: string;
  /** Texto mostrado depois da escolha. */
  outcome: string;
  /** Variação de moedas (pode ser negativa). */
  delta: number;
}

export interface StoryEvent {
  id: string;
  /** Dia em que o evento acontece, antes do balcão abrir. */
  day: number;
  title: string;
  text: string;
  options: EventOption[];
}

export const EVENTS: StoryEvent[] = [
  {
    id: 'suborno',
    day: 2,
    title: 'Uma bolsa sobre o balcão',
    text:
      'Um mercador de tecidos deixa uma bolsa pesada na mesa enquanto a Mestra procura um carimbo. "Só um agrado pela pressa, aprendiz. Ninguém precisa saber."',
    options: [
      { label: 'Aceitar a bolsa', outcome: 'Você guarda a bolsa na gaveta. O peso é bom, mas a consciência pesa mais.', delta: 5 },
      { label: 'Devolver com educação', outcome: 'O mercador dá de ombros e vai embora. Sem ganhos, sem problemas.', delta: 0 },
      { label: 'Anotar o nome no livro', outcome: 'Ele empalidece e deixa um pequeno agradecimento pela discrição. Você fica com a taxa do registro.', delta: 2 },
    ],
  },
  {
    id: 'ajuda',
    day: 4,
    title: 'Um velho sem moedas',
    text:
      'Um senhor encurvado não consegue pagar a taxa de entrada. Ele segura o passe com as duas mãos e pede, quase sem voz, que alguém o ajude.',
    options: [
      { label: 'Pagar a taxa dele', outcome: 'Ele sorri e agradece com uma reverência. A sua gaveta fica mais leve.', delta: -2 },
      { label: 'Explicar as regras', outcome: 'Ele entende, pede desculpas e volta mais tarde com a taxa completa.', delta: 0 },
      { label: 'Pedir uma gorjeta', outcome: 'Ele paga a taxa e deixa uma moeda a mais, por constrangimento.', delta: 3 },
    ],
  },
  {
    id: 'patrocinio',
    day: 6,
    title: 'Convite da Guilda',
    text:
      'Um emissário da Guilda dos Cartógrafos oferece patrocinar o balcão em troca de um aviso sempre que um mapa suspeito cruzar a fronteira.',
    options: [
      { label: 'Aceitar o patrocínio', outcome: 'A Guilda envia um bom ouro e uma lista de mapas para vigiar.', delta: 7 },
      { label: 'Recusar com cortesia', outcome: 'O emissário agradece e deixa o cartório como estava.', delta: 0 },
      { label: 'Vender a lista de contrabando', outcome: 'Você ganha um bom dinheiro, mas o nome do cartório ficou manchado nas feiras.', delta: 4 },
    ],
  },
  {
    id: 'doacao',
    day: 8,
    title: 'Fim das Brumas',
    text:
      'As Brumas começam a se dissipar. A Mestra propõe usar as últimas economias para ajudar as aldeias que ficaram sem papel e sem remédio.',
    options: [
      { label: 'Doar uma parte', outcome: 'As aldeias recebem pergaminho e velas. A Mestra sorri pela primeira vez no mês.', delta: -4 },
      { label: 'Guardar o ouro', outcome: 'A Mestra assente. Você segue com o cofre intacto.', delta: 0 },
      { label: 'Investir em velas extras', outcome: 'As velas duram mais e o balcão ganha fama de pontual.', delta: -2 },
    ],
  },
  {
    id: 'abismo',
    day: 11,
    title: 'Rumores do Abismo',
    text:
      'Um marinheiro molhado chega ao balcão com um pergaminho manchado de sal. Diz que o Abismo Azul esconde documentos falsos à venda no porto.',
    options: [
      { label: 'Pagar pela informação', outcome: 'O pergaminho confirma o esquema. O preço foi alto, mas a fronteira ficou mais segura.', delta: -4 },
      { label: 'Encaminhar à Guilda', outcome: 'A Guilda agradece e promete investigar. Nada muda no seu caixa.', delta: 0 },
      { label: 'Vender a história ao jornal', outcome: 'A história sai nas feiras e rende algumas moedas, mas a Mestra não gostou.', delta: 3 },
    ],
  },
  {
    id: 'carta',
    day: 15,
    title: 'Carta da Mestra',
    text:
      'A Mestra Aurelha escreve de longe: "Aprendiz, manda o cartório pagar o aluguel das velas do mês. Não me decepcione."',
    options: [
      { label: 'Pagar o aluguel agora', outcome: 'O aluguel sai do cofre. A Mestra responde com um elogio seco.', delta: -5 },
      { label: 'Adiar o pagamento', outcome: 'A conta fica para depois. Por enquanto, o cofre respira.', delta: 0 },
      { label: 'Renegociar com o fornecedor', outcome: 'O fornecedor aceita um desconto pela pontualidade do cartório.', delta: 2 },
    ],
  },
  {
    id: 'imperio',
    day: 18,
    title: 'Convite do império',
    text:
      'Um enviado do império oferece um cargo honorário na capital. O salário é alto, mas o cartório perderia o aprendiz.',
    options: [
      { label: 'Aceitar o cargo', outcome: 'Você recebe a bolsa do império e parte para a capital, deixando o cofre mais gordo.', delta: 8 },
      { label: 'Recusar e ficar', outcome: 'O enviado sorri e diz que o cartório vai precisar de você. Sem ganhos extras.', delta: 0 },
      { label: 'Pedir um adiantamento', outcome: 'O império aceita pagar um pouco agora, em troca de sua lealdade.', delta: 4 },
    ],
  },
];

export const eventForDay = (day: number): StoryEvent | undefined =>
  EVENTS.find((e) => e.day === day);
