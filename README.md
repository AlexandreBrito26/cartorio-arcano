# Cartório Arcano

Jogo de navegador de inspeção de documentos, em React + TypeScript + Vite. Você é o aprendiz de um cartório de fronteira num mundo de fantasia: confere a Carta de Identidade, o Passe de Viagem e o Selo de Guilda de cada viajante, segue o Regulamento do dia e decide quem entra.

A mecânica de "conferir papéis e decidir" é um gênero clássico. Aqui o tema, as regras, os personagens e a arte (SVG desenhado no código) são todos originais.

## Como rodar

```bash
npm install
npm run dev      # servidor local
npm test         # testes da lógica do jogo
npm run build    # build de produção (pasta dist/)
```

Deploy na Vercel: importe o repositório e use os padrões do Vite (build `npm run build`, saída `dist`).

## Como jogar

- **Novo jogo** abre uma cutscene de abertura (5 cenas em SVG com texto em máquina de escrever). Clique, `Espaço` ou `Enter` avançam; `Esc` ou **Pular** vão direto ao primeiro dia. **Continuar** não repete a abertura.
- Clique nos campos dos documentos para grifá-los (ajuda a comparar nome, reino e datas).
- **Aprovar** (`A`) ou **Negar** (`N`). Ao negar, escolha o motivo certo para ganhar o bônus completo.
- Acertar rende moedas. Decisão errada vira multa. No fim do dia há despesas; se o saldo ficar negativo, o cartório fecha.
- São 5 dias, e as regras novas se somam a cada manhã:

| Dia | Novidade |
| --- | --- |
| 1 | Documentos presentes e nome igual na Carta e no Passe |
| 2 | Validade (nada vencido) |
| 3 | Reino igual nos dois papéis e fronteira fechada para o Reino das Cinzas |
| 4 | Passe de trabalho exige Selo de Guilda com o símbolo oficial |
| 5 | Idade mínima para trabalhar e quarentena no Pântano de Névoa |

O progresso (dia e moedas) é salvo no `localStorage` ao fim de cada dia.

As partículas (brasas no título e na cutscene, névoa nas cenas externas) usam **PixiJS**, carregado sob demanda e desligado com movimento reduzido.

Os sons (carimbo, moedinha, zumbido de infração) são sintetizados com Web Audio, sem arquivos de áudio. O botão no canto superior direito liga e desliga o som, e a escolha fica salva.

## Estrutura

```
src/
  game/
    types.ts        tipos do domínio
    constants.ts    reinos, nomes, recompensas e a configuração de cada dia
    rules.ts        evaluate() (o que está errado nos documentos) e judge() (pontuação)
    generator.ts    gera a fila do dia injetando falhas controladas
    state.ts        reducer do jogo (title, briefing, playing, result, dayEnd, ending)
    storage.ts      save no localStorage
    audio.ts        efeitos sonoros (Web Audio) e preferência de mudo
    rng.ts          gerador pseudoaleatório com seed
    game.test.ts    testes
  components/       Portrait (SVG), Documents, RuleBook, Counter, Screens, Logo, Cutscene, SceneArt, Ambience (PixiJS)
  game/cutscene.ts  roteiro da abertura (cenas e textos)
public/favicon.svg  ícone da aba
  App.tsx, styles.css, main.tsx
```

Ponto central do design: `evaluate()` calcula a verdade a partir dos documentos de fato, e o gerador só injeta falhas. Os testes garantem que todo viajante "limpo" passa e que toda falha injetada é detectada. Assim, o jogo nunca cobra por um erro que não existe.

## Ideias para evoluir

- Regra nova por dia: item contrabandeado, taxa de entrada, documento extra por espécie.
- Relógio do dia (tempo limite) e fila que cresce.
- Eventos de história com escolhas (suborno, pedido de ajuda) que afetam o saldo.
- Música ambiente.
- Cutscene de desfecho no dia 5 reaproveitando o componente `Cutscene`.
- Modo infinito depois do dia 5, com dificuldade crescente.
