import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Counter } from './components/Counter';
import { Cutscene } from './components/Cutscene';
import { Logo } from './components/Logo';
import { PixelSprite } from './components/PixelSprite';
import { Portrait } from './components/Portrait';
import { Briefing, DayEnd, Ending, EventScreen, Title, UpgradeShop } from './components/Screens';
import { MAX_DAY } from './game/constants';
import { UPGRADES } from './game/upgrades';
import { CUTSCENES, CUTSCENE_SCHEDULE, INTRO_SCENES, STAMP_IMPACT_MS, replayableCutscenes } from './game/cutscene';
import { SPECIES } from './game/constants';
import { createInitialState, reducer, type GameState } from './game/state';
import type { Look } from './game/types';
import { CHARACTER_LAYER_COUNT, OUTLINE_LAYER_INDEX, SPECIES_SLUG } from './render/characterAnim';

const noop = () => {};

/** renderToString separa trechos de texto com <!-- -->; removemos para comparar o texto visível. */
const render = (el: Parameters<typeof renderToString>[0]) =>
  renderToString(el).replace(/<!-- -->/g, '');

describe('renderização das telas', () => {
  it('monta título, briefing, balcão, resultado, fim de dia e desfecho em todos os dias', () => {
    expect(render(<Title state={createInitialState()} dispatch={noop} />)).toContain('Cartório das Brumas');

    let s: GameState = reducer(createInitialState(), { type: 'NEW_GAME' });
    expect(s.phase).toBe('cutscene');
    s = reducer(s, { type: 'CUTSCENE_DONE' });
    expect(s.phase).toBe('briefing');

    for (let day = 1; day <= MAX_DAY; day++) {
      expect(render(<Briefing state={s} dispatch={noop} />)).toContain(`Dia ${day} de ${MAX_DAY}`);

      s = reducer(s, { type: 'START_DAY', seed: day * 991 });

      while (s.phase === 'playing') {
        if (s.index >= s.arrived) {
          // Ainda ninguém no balcão: o relógio avança até o próximo chegar.
          expect(render(<Counter state={s} dispatch={noop} />)).toContain('Ninguém no balcão');
          s = reducer(s, { type: 'TICK' });
          continue;
        }
        expect(render(<Counter state={s} dispatch={noop} />)).toContain('Aprovar');

        // Alterna entre aprovar e negar para exercitar os dois caminhos.
        s = reducer(s, {
          type: 'DECIDE',
          decision: s.index % 2 === 0 ? { kind: 'approve' } : { kind: 'deny', reason: s.rules.active[0] },
        });
        const html = render(<Counter state={s} dispatch={noop} />);
        expect(html).toMatch(/Aprovado|Negado/);

        s = reducer(s, { type: 'NEXT' });
      }

      expect(s.phase).toBe('dayEnd');
      expect(render(<DayEnd state={s} dispatch={noop} />)).toContain(`Fim do dia ${day}`);

      // Garante que o dia seguinte seja jogável mesmo com saldo baixo.
      s = { ...s, coins: Math.max(s.coins, 0) };
      s = reducer(s, { type: 'NEXT_DAY' });
      if (s.phase === 'event') {
        expect(render(<EventScreen state={s} dispatch={noop} />)).toContain('Evento do dia');
        s = reducer(s, { type: 'EVENT_DONE' });
      }
    }

    expect(s.phase).toBe('ending');
    expect(render(<Ending state={s} dispatch={noop} />)).toContain('Aprendiz efetivado');
  });
});

describe('logo e cutscene', () => {
  it('renderiza a logo com e sem rótulo acessível', () => {
    expect(render(<Logo title="Logo do Cartório das Brumas" />)).toContain('aria-label="Logo do Cartório das Brumas"');
    expect(render(<Logo />)).toContain('aria-hidden="true"');
  });

  it('a logo é o selo em PNG, sem suavização e no tamanho pedido', () => {
    const html = render(<Logo size={64} className="title-logo" />);
    expect(html).toContain('<img');
    expect(html).toContain('src="/art/ui/logo-seal.png"');
    expect(html).toContain('width="64"');
    expect(html).toContain('class="logo title-logo"');
    expect(html).toContain('image-rendering:pixelated');
    expect(html).not.toContain('<svg');
  });

  it('a abertura tem cenas com texto e a primeira aparece na tela', () => {
    expect(INTRO_SCENES.length).toBeGreaterThan(2);
    for (const scene of INTRO_SCENES) expect(scene.lines.length).toBeGreaterThan(0);
    const html = render(<Cutscene scenes={INTRO_SCENES} onDone={noop} />);
    expect(html).toContain(INTRO_SCENES[0].lines[0]);
    expect(html).toContain('Pular');
  });

  it('novo jogo passa pela abertura; continuar vai direto ao briefing', () => {
    const base = createInitialState();
    expect(reducer(base, { type: 'NEW_GAME' }).phase).toBe('cutscene');
    expect(reducer(reducer(base, { type: 'NEW_GAME' }), { type: 'START_DAY', seed: 1 }).phase).toBe('cutscene');
    const withSave = { ...base, save: { day: 3, coins: 20, upgrades: {} } };
    expect(reducer(withSave, { type: 'CONTINUE' }).phase).toBe('briefing');
  });
});

describe('motor de cenas', () => {
  it('toda cena registrada tem id único, texto e opções válidas', () => {
    const ids = Object.values(CUTSCENES).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of Object.values(CUTSCENES)) {
      expect(CUTSCENES[def.id]).toBe(def);
      expect(def.scenes.length).toBeGreaterThan(0);
      for (const scene of def.scenes) expect(scene.lines.length).toBeGreaterThan(0);
    }
    for (const day of Object.keys(CUTSCENE_SCHEDULE)) {
      expect(CUTSCENES[CUTSCENE_SCHEDULE[Number(day)]!]).toBeDefined();
    }
  });

  it('renderiza legenda de quem fala e classes de câmera e transição', () => {
    const html = render(
      <Cutscene
        scenes={[{ art: 'mistress', lines: ['Oi.'], speaker: 'Mestra Aurelha', camera: 'pan-left', transition: 'iris' }]}
        onDone={noop}
      />,
    );
    expect(html).toContain('Mestra Aurelha');
    expect(html).toContain('data-camera="pan-left"');
    expect(html).toContain('tr-iris');
  });

  it('sem campos opcionais, usa câmera parada e fusão', () => {
    const html = render(<Cutscene scenes={[{ art: 'road', lines: ['x'] }]} onDone={noop} />);
    expect(html).toContain('data-camera="still"');
    expect(html).toContain('tr-fade');
  });

  it('o cartão de título "Ano 417" abre a cena, com letterbox, antes da primeira imagem', () => {
    expect(CUTSCENES.intro.titleCard).toBe('Ano 417');
    const html = render(<Cutscene scenes={INTRO_SCENES} titleCard={CUTSCENES.intro.titleCard} onDone={noop} />);
    expect(html).toContain('title-card');
    expect(html).toContain('Ano 417');
    expect(html).toContain('letterbox');
    expect(html).not.toContain('scene-stage');
    // Sem cartão, a primeira imagem aparece de imediato.
    const plain = render(<Cutscene scenes={INTRO_SCENES} onDone={noop} />);
    expect(plain).not.toContain('title-card');
    expect(plain).toContain('scene-stage');
  });

  it('cada cena da abertura tem câmera própria, e o foco é passado à cena do Pixi', () => {
    expect(INTRO_SCENES.map((s) => s.camera)).toEqual(['dolly-in', 'tilt-up', 'pan-left', 'push-in', 'pull-back']);
    const html = render(
      <Cutscene scenes={[{ art: 'road', lines: ['x'], camera: 'dolly-in', focus: { x: 54, y: 70 } }]} onDone={noop} />,
    );
    expect(html).toContain('data-camera="dolly-in"');
    expect(html).toContain('data-focus="54 70"');
  });

  it('o carimbo toca no instante do impacto e a cena treme nesse momento', () => {
    const last = INTRO_SCENES[INTRO_SCENES.length - 1];
    expect(last.sfx).toBe('approve');
    expect(last.sfxAt).toBe(STAMP_IMPACT_MS);
    const html = render(<Cutscene scenes={[last]} onDone={noop} />);
    expect(html).toContain('scene-shake impact');
    expect(html).toContain('--shake-at:1700ms');
  });

  it('o fim da cena leva à fase combinada e limpa a cena', () => {
    const playing = reducer(createInitialState(), { type: 'NEW_GAME' });
    expect(playing.cutscene).toEqual({ id: 'intro', next: 'briefing' });
    const done = reducer(playing, { type: 'CUTSCENE_DONE' });
    expect(done.phase).toBe('briefing');
    expect(done.cutscene).toBeNull();
    expect(reducer(done, { type: 'CUTSCENE_DONE' })).toBe(done);
  });

  it('o Diário lista as cenas e bloqueia o replay durante o expediente', async () => {
    const { Diary } = await import('./components/Diary');
    expect(replayableCutscenes(1).map((c) => c.id)).toContain('intro');
    const html = render(<Diary reachedDay={1} onClose={noop} onReplay={noop} canReplay={false} />);
    expect(html).toContain('Cenas');
  });
});

describe('Diário do Cartório', () => {
  it('mostra verbetes abertos e lacra os dos dias futuros', async () => {
    const { Diary } = await import('./components/Diary');
    const html = render(<Diary reachedDay={1} onClose={noop} />);
    expect(html).toContain('Diário do Cartório');
    expect(html).toContain('A subida das Brumas');
    expect(html).toContain('Verbete lacrado');
  });
});

const lookOf = (species: Look['species']): Look => ({
  species,
  skin: 'x',
  hair: 'x',
  eyes: 'x',
  cloak: 'x',
  hairStyle: 0,
  beard: false,
});

describe('pixel art no lugar do SVG (fase 8)', () => {
  it('nenhuma tela do jogo monta <svg> no DOM', () => {
    const state = createInitialState();
    expect(render(<Title state={state} dispatch={noop} />)).not.toContain('<svg');

    expect(render(<Cutscene scenes={INTRO_SCENES} titleCard={CUTSCENES.intro.titleCard} onDone={noop} />)).not.toContain('<svg');
    expect(render(<Cutscene scenes={INTRO_SCENES} onDone={noop} />)).not.toContain('<svg');

    let s: GameState = reducer(reducer(state, { type: 'NEW_GAME' }), { type: 'CUTSCENE_DONE' });
    s = reducer(s, { type: 'START_DAY', seed: 7 });
    while (s.phase === 'playing' && s.index >= s.arrived) s = reducer(s, { type: 'TICK' });
    expect(s.phase).toBe('playing');
    expect(render(<Counter state={s} dispatch={noop} />)).not.toContain('<svg');
  });

  it('o balcão monta o viajante com o retrato em pixel art', () => {
    let s: GameState = reducer(reducer(createInitialState(), { type: 'NEW_GAME' }), { type: 'CUTSCENE_DONE' });
    s = reducer(s, { type: 'START_DAY', seed: 7 });
    while (s.phase === 'playing' && s.index >= s.arrived) s = reducer(s, { type: 'TICK' });
    const html = render(<Counter state={s} dispatch={noop} />);
    expect(html).toContain('st-traveler');
    expect(html).toContain('pixel-portrait');
    expect(html).toMatch(/Retrato de /);
  });

  it('o retrato de reserva (sem WebGL) é a camada de contorno em PNG, para toda espécie', () => {
    for (const species of SPECIES) {
      const html = render(<Portrait look={lookOf(species)} />);
      expect(html).toContain('portrait-fallback');
      expect(html).toContain('role="img"');
      expect(html).toContain(`aria-label="Retrato de ${species}"`);
      expect(html).toContain(`/art/personagens/${SPECIES_SLUG[species]}.png`);
      expect(html).toContain('image-rendering:pixelated');
      expect(html).not.toContain('<svg');
    }
  });
});

describe('arte e atlas em public/', () => {
  const pub = join(process.cwd(), 'public');
  const pngSize = (file: string) => {
    const b = readFileSync(file);
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  };

  it('cada espécie tem PNG + JSON, e o contorno fica no índice que o Portrait de reserva usa', () => {
    for (const species of SPECIES) {
      const slug = SPECIES_SLUG[species];
      const json = join(pub, 'art', 'personagens', `${slug}.json`);
      const png = join(pub, 'art', 'personagens', `${slug}.png`);
      expect(existsSync(json), `${slug}.json`).toBe(true);
      expect(existsSync(png), `${slug}.png`).toBe(true);

      const atlas = JSON.parse(readFileSync(json, 'utf8')) as {
        image: string;
        frameWidth: number;
        frameHeight: number;
        frames: { name: string }[];
      };
      expect(atlas.image).toBe(`/art/personagens/${slug}.png`);
      // Portrait.tsx assume: contorno no índice 10, folha com CHARACTER_LAYER_COUNT quadros de 64×72.
      expect(atlas.frames.findIndex((f) => f.name === 'outline')).toBe(OUTLINE_LAYER_INDEX);
      expect(atlas.frames).toHaveLength(CHARACTER_LAYER_COUNT);
      expect(pngSize(png)).toEqual({ w: CHARACTER_LAYER_COUNT * atlas.frameWidth, h: atlas.frameHeight });
      // Fase 12: mãos, mangas, sombras e olhos existem em todas as espécies.
      for (const name of ['eyewhite', 'shade', 'armL', 'armR', 'handL', 'handR', 'lineL', 'lineR']) {
        expect(atlas.frames.map((f) => f.name), `${slug}: ${name}`).toContain(name);
      }
      expect([atlas.frameWidth, atlas.frameHeight]).toEqual([64, 72]);
    }
  });

  it('o selo da logo e os ícones do HUD existem', () => {
    for (const f of ['logo-seal.png', 'icon-dia.png', 'icon-moeda.png']) {
      expect(existsSync(join(pub, 'art', 'ui', f)), f).toBe(true);
    }
  });
});

describe('sem restos do SVG no código', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  const src = join(process.cwd(), 'src');
  const files = walk(src);

  it('SceneArt.tsx e o styles.css antigo não existem mais', () => {
    expect(files.some((f) => f.endsWith('SceneArt.tsx'))).toBe(false);
    expect(existsSync(join(src, 'styles.css'))).toBe(false);
  });

  it('nenhum componente declara elementos <svg>', () => {
    const offenders = files
      .filter((f) => /\.tsx$/.test(f) && !f.endsWith('.test.tsx'))
      .filter((f) => /<svg[\s>]/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('o SCSS não guarda estilos das partes SVG antigas', () => {
    const css = readFileSync(join(src, 'styles.scss'), 'utf8');
    for (const cls of ['st-clouds', 'st-mist', 'st-lamp', 'st-rune', 'st-candle', 'st-swing', 'st-flash', 'st-window']) {
      expect(css, cls).not.toContain(`.${cls}`);
    }
    expect(css).not.toMatch(/\.portrait\b(?!-)/);
    expect(css).not.toMatch(/\.px(-|\s|,|\{)/);
  });
});

describe('loja de melhorias', () => {
  it('lista as melhorias, mostra o saldo e desabilita o que não dá para pagar', () => {
    const base: GameState = { ...createInitialState(), phase: 'upgrades', day: 3, coins: 30, upgrades: { carimbo: 3 } };
    const html = render(<UpgradeShop state={base} dispatch={noop} />);
    expect(html).toContain('Melhorias do cartório');
    expect(html).toContain('Carimbo de Prata');
    expect(html).toContain('Nível máximo');
    expect(html).toContain('Comprar · 20');
    expect(html).toMatch(/disabled=""[^>]*>Comprar · 55/);
  });

  it('o fim de dia oferece a loja, exceto com o cartório falido', () => {
    const ok: GameState = { ...createInitialState(), phase: 'dayEnd', day: 1, coins: 20 };
    expect(render(<DayEnd state={ok} dispatch={noop} />)).toContain('Melhorias do cartório');
    const broke: GameState = { ...ok, coins: -2 };
    expect(render(<DayEnd state={broke} dispatch={noop} />)).not.toContain('Melhorias do cartório');
  });
});

describe('arte animada da oficina', () => {
  /** Largura e altura lidas do cabeçalho IHDR do PNG. */
  const pngSize = (path: string) => {
    const b = readFileSync(path);
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  };

  const SHEETS: [string, number, number, number][] = [
    ['upg-carimbo.png', 4, 24, 24],
    ['upg-ampulheta.png', 4, 24, 24],
    ['upg-seguro.png', 4, 24, 24],
    ['upg-cofre.png', 4, 24, 24],
    ['upg-balcao.png', 4, 24, 24],
    ['icon-moeda-spin.png', 6, 16, 16],
    ['fx-burst.png', 6, 32, 32],
    ['shop-banner.png', 4, 160, 48],
  ];

  it.each(SHEETS)('%s tem a folha no tamanho certo', (file, frames, w, h) => {
    const path = `public/art/ui/${file}`;
    expect(existsSync(path)).toBe(true);
    expect(pngSize(path)).toEqual({ w: w * frames, h });
  });

  it('toda melhoria da loja tem a sua folha de ícone', () => {
    for (const u of UPGRADES) expect(existsSync(`public/art/ui/upg-${u.id}.png`), u.id).toBe(true);
  });

  it('PixelSprite expõe o ciclo pelas variáveis CSS e é decorativo sem label', () => {
    const html = render(<PixelSprite src="/art/ui/upg-cofre.png" frames={4} w={24} h={24} scale={3} fps={4} />);
    expect(html).toContain('--frames:4');
    expect(html).toContain('--fw:72px');
    expect(html).toContain('--dur:1s');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('<svg');
    const once = render(<PixelSprite src="/art/ui/fx-burst.png" frames={6} w={32} h={32} once label="faísca" />);
    expect(once).toContain('--iter:1');
    expect(once).toContain('aria-label="faísca"');
  });

  it('a loja mostra banner e um ícone animado por melhoria, sem emoji nem SVG', () => {
    const s: GameState = { ...createInitialState(), phase: 'upgrades', day: 2, coins: 40, upgrades: {} };
    const html = render(<UpgradeShop state={s} dispatch={noop} />);
    expect(html).toContain('shop-banner');
    for (const u of UPGRADES) expect(html).toContain(`/art/ui/upg-${u.id}.png`);
    expect(html).not.toContain('<svg');
    expect(html).not.toMatch(/🪙|⏳|🛡|🕯|🪑/u);
  });
});
