import { AnimatedSprite, Assets, Rectangle, Texture, TextureSource } from 'pixi.js';

/** Formato do atlas: uma imagem com frames em retângulos + animações nomeadas (lista de frames). */
export interface AtlasFrame {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AtlasData {
  image: string;
  frameWidth: number;
  frameHeight: number;
  frames: AtlasFrame[];
  animations: Record<string, string[]>;
}

export interface Atlas {
  textures: Record<string, Texture>;
  animations: Record<string, Texture[]>;
}

/**
 * Pixel art sempre com amostragem "nearest" (sem suavização). Definido no padrão
 * global de texturas, então vale para todo asset carregado depois desta chamada.
 */
export function configurePixelArt() {
  TextureSource.defaultOptions.scaleMode = 'nearest';
}

/** Carrega o JSON do atlas e a imagem, e monta uma Texture por frame e por animação. */
export async function loadAtlas(jsonUrl: string): Promise<Atlas> {
  configurePixelArt();
  const data = (await (await fetch(jsonUrl)).json()) as AtlasData;
  const base = await Assets.load<Texture>(data.image);
  const source = base.source;

  const textures: Record<string, Texture> = {};
  for (const f of data.frames) {
    textures[f.name] = new Texture({ source, frame: new Rectangle(f.x, f.y, f.w, f.h) });
  }

  const animations: Record<string, Texture[]> = {};
  for (const [name, frameNames] of Object.entries(data.animations)) {
    animations[name] = frameNames.map((fn) => {
      const t = textures[fn];
      if (!t) throw new Error(`Frame "${fn}" não existe no atlas ${jsonUrl}`);
      return t;
    });
  }
  return { textures, animations };
}

/** Sprite animado de pixel art, já configurado para não suavizar nem arredondar errado. */
export function makePixelSprite(atlas: Atlas, animation: string, fps = 8): AnimatedSprite {
  const frames = atlas.animations[animation];
  if (!frames) throw new Error(`Animação "${animation}" não existe no atlas`);
  const sprite = new AnimatedSprite(frames);
  sprite.animationSpeed = fps / 60;
  sprite.play();
  sprite.roundPixels = true;
  return sprite;
}
