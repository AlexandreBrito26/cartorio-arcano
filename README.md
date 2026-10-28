# Cartório das Brumas

Jogo de navegador de inspeção de documentos, em React + TypeScript + Vite. Você é o aprendiz de um cartório de fronteira num mundo de fantasia: confere a Carta de Identidade, o Passe de Viagem e o Selo de Guilda de cada viajante, segue o Regulamento do dia e decide quem entra.

A mecânica de "conferir papéis e decidir" é um gênero clássico. Aqui o tema, as regras, os personagens e a arte (pixel art gerada por scripts Python e desenhada com PixiJS) são todos originais.

## Como rodar

```bash
npm install
npm run dev      # servidor local
npm test         # testes da lógica, das telas e da arte (atlas, sem SVG)
npm run build    # build de produção (pasta dist/)
```

Deploy na Vercel: importe o repositório e use os padrões do Vite (build `npm run build`, saída `dist`).

## Como jogar

- **Novo jogo** abre uma cutscene de abertura: cartão de título "Ano 417", letterbox e 5 cenas em pixel art com câmera em movimento, trilha ambiente e texto em máquina de escrever. Clique, `Espaço` ou `Enter` avançam; `Esc` ou **Pular** vão direto ao primeiro dia. **Continuar** não repete a abertura.
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
| 6 | Bagagem: itens proibidos (contrabando) |
| 7 | Taxa de entrada de 2 moedas, com recibo na mesa |
| 8 | Documento da Espécie para quem não for humano |
| 9 a 20 | Sem regras novas: mais viajantes, filas mais longas e fronteiras que se fecham (Abismo Azul, Planícies do Vento) |

O progresso (dia e moedas) é salvo no `localStorage` ao fim de cada dia.

As partículas (brasas no título e na cutscene, névoa nas cenas externas) usam **PixiJS**, carregado sob demanda e desligado com movimento reduzido.

Os sons (carimbo, moedinha, zumbido de infração) são sintetizados com Web Audio, sem arquivos de áudio. O botão no canto superior direito liga e desliga o som, e a escolha fica salva.

### Abertura polida (fase 2)

- **Câmera por cena** (`camera` e `focus` em `game/cutscene.ts`): `dolly-in` na estrada, `tilt-up` no portão, `pan-left` no cartório, `push-in` na Mestra Aurelha e `pull-back` no carimbo. Também existem `zoom-in`, `zoom-out`, `pan-right`, `tilt-down` e `still`. Cada cena tem três camadas de profundidade (`far`, `mid`, `near`, PNGs em `public/art/cutscene/`) que se movem em ritmos diferentes (parallax), calculadas em `render/cutsceneCamera.ts`, mais um balanço leve de câmera na mão. O tranco do carimbo acontece no instante do impacto (`sfxAt`, igual a `STAMP_IMPACT_MS`).
- **Letterbox**: faixas pretas de cinema que fecham sobre a imagem (≈ 2,2:1). A arte nova precisa caber nos ~10% de cima e de baixo que ficam cobertos.
- **Título**: `titleCard` na definição da cena (`Ano 417` na abertura). Segue sozinho em ~4 s; clique, tecla ou **Continuar** pulam.
- **Trilha** (`game/music.ts`): pad de 4 vozes, vento, sinos/plucks que caminham pela escala, brasas e um pulso de coração, tudo sintetizado. Cada cena tem um perfil (tônica, escala, timbre, densidade); a troca de cena desliza os acordes, sem cortes. No impacto do carimbo a música resolve em ré maior. Some com fade ao sair da cena, para ao silenciar o som e volta ao reativá-lo. Com movimento reduzido, as animações de câmera e título ficam estáticas.

### Melhorias do cartório (upgrades)

No **Fim do dia**, o botão **Melhorias do cartório** abre a oficina, onde as moedas viram upgrades permanentes (valem nos dias seguintes e entram no save). O saldo nunca fica negativo por causa de uma compra, e as despesas do dia seguinte saem do que sobrar.

| Melhoria | Efeito por nível | Preços |
| --- | --- | --- |
| Carimbo de Prata | +1 moeda por decisão certa | 25 / 45 / 70 |
| Ampulheta Encantada | +2 s por viajante no relógio | 20 / 35 / 55 |
| Seguro do Cartório | −1 moeda em cada multa (mínimo 1) | 30 / 50 |
| Despensa Econômica | −2 moedas nas despesas diárias | 25 / 40 / 60 |
| Balcão Ordenado | +1 s entre as chegadas de viajantes | 20 / 40 |

Tudo está em `game/upgrades.ts` (definições, preços e funções de efeito). Para criar uma melhoria nova: adicione o id em `UpgradeId`, uma entrada em `UPGRADES` e use a função de efeito no ponto da regra que ela altera. O livro de regras (aba Pagamento) já mostra os valores com as melhorias aplicadas. Saves antigos, sem o campo `upgrades`, carregam como "nenhuma melhoria".

## Estrutura

```
src/
  game/
    types.ts        tipos do domínio
    constants.ts    reinos, nomes, recompensas e a configuração de cada dia
    rules.ts        evaluate() (o que está errado nos documentos) e judge() (pontuação)
    generator.ts    gera a fila do dia injetando falhas controladas
    state.ts        reducer do jogo (title, briefing, playing, result, dayEnd, ending)
    storage.ts      save no localStorage (dia, moedas e melhorias)
    upgrades.ts     melhorias do cartório: definições, preços e efeitos
    audio.ts        efeitos sonoros (Web Audio) e preferência de mudo
    rng.ts          gerador pseudoaleatório com seed
    game.test.ts    testes
  components/       Documents, RuleBook, Counter, CounterScene, Screens, Cutscene, Diary, Ambience (canvas 2D),
                    Logo e Portrait (reservas em PNG, sem WebGL), CanvasLogo (canvas 2D)
  render/           pixel art em PixiJS: PixiStage (canvas único do balcão), PixelPortrait, CounterPixelScene, sky (céu do dia), SkinShop (skins e trajes), SuitSamples, WeatherLayer (partículas do clima), PixelCutsceneArt, assets, atlas, paleta, escala e câmera
  game/cutscene.ts  motor de cenas: tipos (câmera, transição, falante, sfx), registro CUTSCENES e agenda por dia (CUTSCENE_SCHEDULE)
  App.tsx, styles.scss, main.tsx
tools/              geradores da arte (Python + Pillow)
public/art/         PNGs e atlas JSON gerados (cutscene, personagens, balcao, ui)
public/favicon.svg  ícone da aba do navegador (o único SVG que sobrou)
```

Ponto central do design: `evaluate()` calcula a verdade a partir dos documentos de fato, e o gerador só injeta falhas. Os testes garantem que todo viajante "limpo" passa e que toda falha injetada é detectada. Assim, o jogo nunca cobra por um erro que não existe.

## Arte (pixel art)

Toda a arte do jogo é pixel art e nenhuma tela monta `<svg>` no DOM. As regras de resolução, paleta e escala estão em [`ART.md`](ART.md); a paleta única (42 cores) fica em `src/render/palette.json`.

A arte é **gerada por scripts** em `tools/` (Python 3 + [Pillow](https://pypi.org/project/pillow/)), então dá para mudar um desenho no código e regenerar tudo igual:

```bash
pip install pillow
python3 tools/gen_cutscene_art.py   # abertura: 5 cenas x 3 camadas + névoa e carimbo -> public/art/cutscene/
python3 tools/gen_characters.py     # 9 espécies: PNG + atlas JSON                    -> public/art/personagens/
python3 tools/gen_counter_art.py    # balcão: fundo, frente, lampião e carimbo        -> public/art/balcao/
python3 tools/gen_ui_art.py         # selo da logo e ícones do HUD                    -> public/art/ui/
python3 tools/gen_upgrade_art.py    # oficina de melhorias: ícones, moeda e faísca animados -> public/art/ui/
python3 tools/preview_characters.py # prévia dos personagens (mãos, sombras, olhos) em PNG
```

Rodar os quatro de novo reproduz os arquivos atuais byte a byte. Depois de regenerar, rode `npm test`: os testes conferem que cada espécie tem PNG e JSON, que a folha tem 19 camadas de 64×72 (as 8 últimas são olhos, sombras, mangas e mãos) e que o contorno (usado como retrato sem WebGL) está no índice 10.

**Atlas.** Um atlas é um PNG + um JSON com `image`, `frameWidth`, `frameHeight`, `frames` (nome, x, y, w, h) e `animations` (nome para lista de quadros), carregado por `loadAtlas` em `src/render/atlas.ts`. Só `gen_characters.py` escreve JSON; as demais cenas e o balcão são PNGs carregados direto. A runa da mesa usa `public/sprites/smoke-rune.*`, que **não** é gerada por script.

**Personagens.** Cada espécie tem camadas de cor em máscara branca, tingidas em tempo de execução com o `look` (pele, cabelo, olhos, capa). Para uma espécie nova, adicione-a em `tools/gen_characters.py`, em `SPECIES` (`game/constants.ts`) e em `SPECIES_SLUG` (`render/characterAnim.ts`) e rode o gerador.

**Sem WebGL.** O viajante cai na silhueta em PNG (`Portrait.tsx`), a logo do título no selo (`Logo.tsx`) e o balcão mantém um fundo noturno em CSS. Com movimento reduzido, as animações ficam paradas.

## Ideias para evoluir

- Regra nova por dia: item contrabandeado, taxa de entrada, documento extra por espécie.
- Relógio do dia (tempo limite) e fila que cresce.
- Eventos de história com escolhas (suborno, pedido de ajuda) que afetam o saldo.
- Trilha também no menu e no balcão (o motor de `music.ts` aceita novos perfis).
- Cutscene de desfecho no dia 5 reaproveitando o componente `Cutscene`.
- Modo infinito depois do dia 5, com dificuldade crescente.
