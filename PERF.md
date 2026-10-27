# Desempenho — Fase 9

Medir sempre no mesmo celular de entrada, Chrome, aba limpa, 60 s no balcão com chuva ligada.

| Métrica                                  | Antes (9.1) | Depois (9.5) |
| ---------------------------------------- | ----------- | ------------ |
| Aparelho / Android / Chrome              |             |              |
| JS inicial gzip (`measure-bundle.mjs`)   |             |              |
| FPS médio no balcão                      |             |              |
| FPS mínimo (1% low)                      |             |              |
| Memória JS (DevTools > Memory)           |             |              |
| Canvases WebGL na tela de jogo           |             |              |
| Draw calls por frame (Spector.js)        |             |              |
| Pop-in de textura ao entrar no balcão    |             |              |

Como medir: `chrome://inspect` para o celular; FPS pelo painel Performance; draw calls com a extensão Spector.js.

## O que a Fase 9 mudou (para comparar com a tabela)

- 9.2: texturas em bundles (`titulo`, `balcao`, `abertura`, `personagens`), pré-carregadas antes de aparecerem.
- 9.3: título e brasas em canvas 2D; o Pixi só é baixado ao mostrar intenção de jogar.
- 9.4: balcão com 1 canvas Pixi (4 camadas) em vez de 4.
- 9.5: ticker único por palco (`stage.tick`), pausa com a aba oculta, limite de 30 FPS em aparelho fraco
  (`navigator.hardwareConcurrency <= 4` ou `deviceMemory <= 2`) e movimento reduzido lido em `render/motion.ts`.
