# Guia de arte: Cartório das Brumas

Decisões da Fase 0. Quando algo daqui mudar, altere este arquivo primeiro.

## 1. Resolução base

- **Cenas: 320×180 px de arte.** É o mesmo viewBox do SVG atual, então 1 unidade do SVG vira 1 pixel.
- **Escala inteira na tela** (calculada por `integerScale` em `src/render/scale.ts`):
  - 1920×1080 → **6x** (1080 ÷ 180 = 6)
  - 2560×1440 → **8x** (1440 ÷ 180 = 8)
  - 390×844 (celular em retrato) → **1x**, com faixas pretas
- Correção ao roadmap: a recomendação inicial dizia 3x em 1080p e 4x em 1440p. Isso só vale para uma base de 640×360. Com a base 320×180, os fatores reais são 6x e 8x.
- **Personagens: 48 a 64 px de altura** na arte. Isso dá cerca de um terço da altura da cena.
- **Celular:** em retrato a escala cai para 1x e a cena fica pequena. Decidido na Fase 10: base própria para telas estreitas, ver seção 10.

## 2. Paleta

- Fonte da verdade: `src/render/palette.json`, com 42 cores.
- Código lê via `src/render/palette.ts` (`paletteInt('ouro-2')`).
- Regra: nenhuma cor fora da paleta. Testes em `palette.test.ts` validam tamanho (32 a 48) e formato.
- Grupos: noite (fundos), ouro, carimbo (vermelho), madeira e couro, pedra e pergaminho, maré (ciano), névoa (roxo), luz fria, verde de guilda e pele.

## 3. Ferramenta de arte

- **Escolha: LibreSprite** (gratuito, lê arquivos `.aseprite`). Piskel serve se preferir algo no navegador.
- Aseprite continua válido se você já tiver a licença. O formato de exportação é o mesmo.
- **Export:** spritesheet PNG com um JSON de frames no formato do `loadAtlas` (`src/render/atlas.ts`): `image`, `frameWidth`, `frameHeight`, `frames` (nome, x, y, w, h) e `animations` (nome → lista de frames).
- Um atlas por entidade ou por cena, nunca um PNG por frame.

## 4. Escopo de animação

A lista completa está em `src/render/animations.json`, com frames, fps, loop e status de cada animação. Resumo:

- **Cenas da abertura (5):** road (névoa, tocha), gate (runa, névoa), office (vela, poeira), mistress (respiração, piscada), stamp (impacto, sincronizado com `STAMP_IMPACT_MS`).
- **Personagens (9 espécies):** idle, piscar e as duas reações (aprova e nega). Extras por espécie: golem (idle lento), espectro (flutua), fada (asas), draconato (fumaça) e tritão (respingo).
- **Balcão:** lâmpada, vela e runa da mesa.
- **HUD:** moeda com brilho.

Regra: animação nova só entra na lista com status `planejado`, antes do desenho.

## 5. Documentos

- **Decisão: DOM com moldura em pixel art.** Texto, nome, datas e regras continuam em fonte legível.
- Pixel art só em: bordas (com sombras em degrau), selos, carimbos e ícones.
- O documento não vira sprite. O carimbo animado (`carimbo-impacto`) é a única parte que se move.

## 6. Limites práticos

- Sem anti-aliasing: `antialias: false` no Pixi e `image-rendering: pixelated` no CSS do canvas.
- Textos de interface nunca dentro do canvas de pixel art.
- Animações respeitam `prefers-reduced-motion` (primeiro frame, sem parallax).

## 7. Pendências

- **Celular em retrato (1x).** Resolvida na Fase 10, com a opção (b): base diferente para telas estreitas (seção 10). Alternativas descartadas: (a) escala fracionária, por reintroduzir variação de 1 px e ruído de subpixel; (c) faixa preta, por deixar o viajante pequeno.

## 8. Fase 2: cenas da abertura

- Arte gerada por `tools/gen_cutscene_art.py` (reproduzível), com três camadas por cena em `public/art/cutscene/`.
- Câmera portada do CSS para `src/render/cutsceneCamera.ts`, com a mesma curva e as mesmas durações (16 s, dolly-in 19 s). Coberta por testes.
- **Desvio da Fase 0:** a abertura usa escala fluida (`min(largura/320, altura/180)`), não escala inteira. Com a janela entre 760 e 1120 px, a escala inteira deixaria faixas grandes em volta. Os pixels podem variar 1 px durante a câmera, que já é fracionária por natureza. Se quiser escala inteira, mudo para um canvas de resolução fixa.
- Ficaram de fora nesta fase: `tocha`, `nevoa-base`, `aurelha-respira`, `olhar-pisca`. Continuam `planejado` em `animations.json`.

## 9. Fase 3: personagens

- Sprites gerados por `tools/gen_characters.py`: uma folha por espécie (`public/art/personagens/`), com camadas de cor variável (máscaras brancas) e camadas fixas (detalhes e contorno).
- **Tints em vez de sprites por combinação:** o `look` (pele, cabelo, olhos, capa) vira `tint`. Branco × tint dá a cor exata do look, então as 9 espécies cobrem todas as combinações de `SKINS`, `HAIRS`, `EYES` e `CLOAKS`.
- Formas alternativas só onde mudam o desenho: `hair0`, `hair1` e `hair2` (estilo de cabelo) e `beard`.
- Animações em `src/render/characterAnim.ts` (testadas): respiração, piscada, aprovar, negar; Golem com brilho nas rachaduras, Espectro flutuando, Fada batendo asas.
- `PixelPortrait.tsx` substitui o `Portrait` do balcão e mantém o retrato SVG como fallback sem WebGL.
- Draconato: fumaça que sobe da boca (4 quadros, 6 fps). Tritão: gotas de respingo nos ombros (4 quadros, 6 fps). Ambas desenhadas por quadro com a paleta.
- Desvio: o tamanho do retrato segue escala inteira (`integerScale`), como na Fase 1; o SVG antigo era fluido.

## 10. Fase 4: balcão e objetos

- Arte gerada por `tools/gen_counter_art.py` em `public/art/balcao/`: fundo (céu, montanhas, torre, portão), frente (divisória, tampo, objetos), lampião e a folha do carimbo (4 quadros).
- O balcão usa um único canvas/Application (`PixiStage`), com 4 camadas em ordem: `fundo`, `viajante`, `chuva`, `frente` (`render/stage.ts`). `CounterPixelScene` (`back`/`front`), `PixelPortrait` e `RainLayer` só adicionam e removem o próprio Container; nenhum cria canvas.
- O viajante reproduz no Pixi o que era CSS: posição (`stageLayout.ts`), brilho/saturação (ColorMatrixFilter), halo azul (gradiente) e a entrada `emerge`. A abertura (cutscene) continua com Application próprio, porque a câmera dela é CSS no DOM.
- Animações em `counterAnim.ts` (testadas): lampião balançando, chama tremendo na vela e no lampião, runa e névoa, janela da torre, relâmpago a cada 11 s.
- Carimbo: quando a decisão é tomada, o quadro de impacto aparece no mesmo instante em que o som toca (`playResult`), depois a base volta e o carimbo repousa.
- Partículas de chuva e brasas ficam no `Ambience`, agora em canvas 2D (sem WebGL).
- Escala: menor inteiro que cobre o palco (`ceil`), sem faixas. O palco é 4:1, então fica quase sempre com um pouco de corte nas laterais.
- Ficaram para a Fase 8: os estilos CSS antigos das partes SVG (`.st-clouds`, `.st-mist`, `.st-lamp`, `.st-rune`, `.st-candle`, `.st-swing`, `.st-flash`) e o `SceneArt.tsx`. Não são mais usados.
- Limite: o `Portrait` SVG continua como fallback do viajante sem WebGL; o palco não tem fallback SVG.

## 11. Fase 5: interface pixel

- Ícones em `tools/gen_ui_art.py` (`public/art/ui/`): selo da logo (32×32), ampulheta do Dia e moeda das Moedas (16×16). O HUD usa os dois ícones.
- Molduras, painéis, modais e botões: cantos retos, anel de 2 px e sombra em degrau (sem raio e sem desfoque), no fim do `styles.scss`.
- Logo: a topbar e a reserva do título usam o selo em PNG. `Logo.tsx` não tem mais SVG.
- Retrato sem WebGL: o `Portrait` mostra a camada de contorno da folha do personagem, em PNG (sem SVG).
- Título: partículas de 1 px se juntam no contorno do portão dentro do próprio `CanvasLogo` (entrada de ~3 s); depois o selo surge com fade. Com movimento reduzido, pula a animação.
- `SceneArt.tsx` removido (não era mais usado).
- Critério: nenhuma tela tem `<svg>` no DOM (conferido no título e no balcão).
- Resolvido na Fase 8 (ver seção 14): os estilos CSS antigos de partes SVG (`.st-clouds`, `.st-mist`, `.st-lamp`, `.st-rune`, `.st-candle`, `.st-swing`, `.st-flash`) e as regras de `.portrait` que não se aplicam mais.

## 12. Fase 6: sincronia de animação e som

Pontos de sincronia e o relógio de cada um:

- **Carimbo da abertura (1,7 s):** `STAMP_IMPACT_MS` é o único valor. O som (`setTimeout` em `Cutscene.tsx`), o tremor de câmera (`--shake-at` no CSS) e a queda do carimbo em Pixi (`PixelCutsceneArt`) usam esse mesmo valor. Testado em `cutscene.schedule.test.ts`.
- **Relógio da cena:** `PixelCutsceneArt` mede o tempo com `performance.now()` desde a montagem, não desde o fim do carregamento das texturas. Antes, o carregamento atrasava a câmera e o carimbo em relação ao som e ao CSS.
- **Carimbo do balcão:** o quadro de impacto usa `performance.now()` no instante da decisão. O som (`playResult`) é disparado no mesmo commit do React.
- **Câmera e parallax:** pela curva de `cutsceneCamera.ts` (testada), com as mesmas durações do CSS antigo.
- **Chama, lampião, runa, névoa e relâmpago:** ligados ao tempo de parede; não há ponto de sincronia com áudio.

Medição: no navegador, o atraso do tremor do CSS é de 1700 ms, igual a `STAMP_IMPACT_MS`. Não medi a latência real do áudio (`AudioContext`), que pode somar algumas dezenas de milissegundos conforme o dispositivo. Não compensei esse atraso.

## 13. Fase 7: acessibilidade e desempenho

**Movimento reduzido** (`prefers-reduced-motion: reduce`), verificado no navegador:
- Cutscene: a câmera fica no enquadramento final, sem parallax; o texto aparece de uma vez; o cartão de título dura menos.
- Título: a formação de partículas é pulada e o selo aparece direto.
- Retratos e balcão: sem idle, sem piscada, sem reações animadas, sem balanço do lampião, sem relâmpago.
- Chuva (`Ambience`): não é criada.
- Sem erros no console.

**Sem WebGL**
- O retrato tem reserva em PNG (`Portrait.tsx`) e o palco tem fundo noturno em CSS (`.stage-view`), então a tela não fica vazia.
- Limite do teste: com as flags de Chromium que desligam o WebGL, o PixiJS continuou renderizando (provavelmente por outro backend). Assim, o caminho de reserva não foi exercitado de fato. Vale testar num navegador com GPU desligada de verdade.

**Desempenho (build de produção)**
- `index.js`: 313 KB (101,9 KB gzip). `lib` (Pixi, carregado pelo título e pelo balcão): 356 KB (103,3 KB gzip). CSS: 25 KB (6,8 KB gzip).
- Todas as texturas são PNG pequenas, em atlas por cena ou por espécie.
- Pixi é importado sob demanda (`await import('pixi.js')`) e o título não o usa mais (logo e brasas em canvas 2D). Ele só é baixado quando o jogador passa o ponteiro ou toca nos botões do título, ou ao entrar numa cutscene (`render/assets.ts`).
- Não medi FPS: o ambiente de teste usa renderização por software, que não representa um celular real.

**Pendências**
- Testar em celular de entrada com GPU real, para medir FPS e memória do balcão (4 canvas Pixi ao mesmo tempo: chuva, fundo, frente e retrato).
- Se o peso do Pixi incomodar, separar a logo do título em um canvas 2D simples (sem Pixi) e carregar o Pixi só ao entrar no jogo.

## 14. Fase 8: remoção do SVG e limpeza

- `SceneArt.tsx` já tinha saído na Fase 5, e `Logo.tsx` e `Portrait.tsx` já eram PNG (Fases 5 e 7). Os dois ficam como reservas sem WebGL, sem SVG.
- `styles.scss`: removidos ~345 linhas de estilos sem uso. Eram as partes SVG do balcão e da abertura (`.st-clouds`, `.st-mist`, `.st-lamp`, `.st-rune`, `.st-candle`, `.st-swing`, `.st-flash`, `.st-window`, `.rune`, `.mist`, `.flame`, `.twinkle`, `.walker`, `.stamp-drop`, `.stamp-mark`, `.scene-art`, as regras de `.portrait` sob `.st-traveler`, o `.logo-glow` e o `.logo-star`), a câmera antiga em CSS (`.cam-*`, `.px*` e seus keyframes, hoje em `cutsceneCamera.ts`) e os keyframes que só elas usavam. CSS do build: 25 KB para 19,6 KB (6,8 KB para 5,6 KB gzip).
- `src/styles.css` apagado: nada o importava (o `main.tsx` usa `styles.scss`), e o README ainda o citava.
- Testes (`ui.test.tsx`): nenhuma tela monta `<svg>`; o balcão usa `pixel-portrait`; a logo é o PNG pixelado; o retrato de reserva funciona nas 9 espécies; cada atlas de personagem bate com o que `Portrait.tsx` assume; e há guardas contra a volta de `SceneArt.tsx`, de `<svg>` em componentes e dos estilos antigos.
- `@types/node` entrou como dependência de desenvolvimento (e `"node"` em `types` no `tsconfig.json`), porque os testes de arte leem arquivos de `public/`.
- Mantido de propósito: `public/favicon.svg` (ícone da aba, fora do DOM do jogo). O tipo `SceneArt` em `game/cutscene.ts` é só a lista de ids de cena (`road`, `gate`...), não tem relação com o componente removido.
- Pendências herdadas da Fase 7, que continuam abertas: testar sem WebGL de verdade e medir FPS num celular com GPU real.

## 10. Fase 10: escala e celular

**Decisão (opção b):** o balcão tem duas bases de arte, escolhidas por `pickBase` (`src/render/bases.ts`).

| Base   | Arte      | Quando                                                              | Escala típica                      |
| ------ | --------- | ------------------------------------------------------------------- | ---------------------------------- |
| `wide` | 320×80    | tudo o que não é celular em pé (desktop, tablet, celular deitado)   | a de hoje                          |
| `tall` | 180×240   | janela com largura ≤ 720 px e altura ≥ 1,1 × largura               | 2x em 390 px de largura (390÷180)  |

- A escolha é pela **janela**, não pelo palco: a altura do palco depende da base, então decidir pelo palco seria circular.
- O corte é o do layout de celular do CSS (720 px). Tablet em pé (768×1024) fica na base larga.
- A base `tall` é um valor de partida. Em 390 px dá 2x com 30 px de sobra (centrados sobre o fundo noturno); uma base de ~130 px de largura daria 3x, mas com menos arte visível. Revisar no 10.3 olhando o aparelho.
- Em telas estreitas o palco fica mais alto (proporção 3:4) para o viajante aparecer em destaque; os documentos descem. Conferir em celular real.
- A abertura (cutscene) segue em 320×180; o recorte em retrato dela (por `focus`) é decidido no 10.3.
- Passos: 10.2 resolução interna fixa e upscale inteiro por CSS; 10.3 arte e troca de base; 10.4 movimento em pixel inteiro; 10.5 testes e fechamento.

### 10.2 Resolução interna fixa

- Os canvases do balcão e da abertura têm `resolution: 1` e `autoDensity: false`. O tamanho em CSS é definido em JS, como múltiplo inteiro do canvas lógico, com `image-rendering: pixelated`. A densidade do aparelho (`devicePixelRatio`) não entra mais no desenho: cada pixel lógico vira um bloco inteiro de pixels do aparelho.
- Balcão (`fitCounter`, `stageLayout.ts`): `p` = CSS px por pixel lógico (a escala inteira do viajante); `m` = escala inteira da cena dentro do canvas lógico. O pixel da cena na tela é `p × m` px de CSS. Todo desenho do balcão usa unidades lógicas (`app.screen`).
- Abertura (`fitCutscene`): `p` inteiro, e o resto fracionário do encaixe fica na escala da arte *dentro* do canvas lógico. A câmera é desenhada em baixa resolução, então o movimento não varia 1 px por causa da densidade da tela. O encaixe é o mesmo `min()` de antes; a escala da arte na tela continua fracionária em quadros que não são múltiplos de 320×180, mas é estável.
- Efeitos: a chuva fica `p` vezes mais grossa (pixel art); a velocidade das gotas é compensada por `1/p`. O brilho do viajante é um gradiente ampliado por CSS.
