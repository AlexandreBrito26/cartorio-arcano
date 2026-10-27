import { SPECIES_SLUG } from './characterAnim';

/**
 * Bundles de assets do Pixi. Este arquivo NÃO importa pixi.js de forma estática:
 * o Pixi só é baixado dentro de preloadBundle(), para não pesar o primeiro paint.
 *
 * Cada asset usa a própria URL como alias, então um `Assets.load(url)` feito depois
 * por qualquer componente já encontra a textura no cache.
 */
export type BundleName = 'titulo' | 'balcao' | 'abertura' | 'personagens';

const CUTSCENE_ARTS = ['road', 'gate', 'office', 'mistress', 'stamp'];
const DEPTHS = ['far', 'mid', 'near'];
const SLUGS = [...new Set(Object.values(SPECIES_SLUG))];

/** Imagens carregadas pelo Assets de cada bundle. */
export const BUNDLE_IMAGES: Record<BundleName, string[]> = {
  titulo: ['/art/ui/logo-seal.png'],
  balcao: [
    '/art/balcao/counter-back.png',
    '/art/balcao/counter-front.png',
    '/art/balcao/counter-lamp.png',
    '/art/balcao/counter-stamp.png',
    '/art/cutscene/fx-mist.png',
    '/sprites/smoke-rune.png',
  ],
  abertura: [
    ...CUTSCENE_ARTS.flatMap((a) => DEPTHS.map((d) => `/art/cutscene/${a}-${d}.png`)),
    '/art/cutscene/fx-mist.png',
    '/art/cutscene/fx-stamp.png',
    '/sprites/smoke-rune.png',
  ],
  personagens: SLUGS.map((s) => `/art/personagens/${s}.png`),
};

/** JSONs de atlas lidos com fetch() pelo loadAtlas; aqui só aquecem o cache HTTP. */
export const BUNDLE_ATLASES: Partial<Record<BundleName, string[]>> = {
  balcao: ['/sprites/smoke-rune.json'],
  abertura: ['/sprites/smoke-rune.json'],
  personagens: SLUGS.map((s) => `/art/personagens/${s}.json`),
};

const pending = new Map<BundleName, Promise<void>>();

/** Carrega um bundle uma única vez; chamadas repetidas devolvem a mesma promessa. Nunca rejeita. */
export function preloadBundle(name: BundleName): Promise<void> {
  let p = pending.get(name);
  if (!p) {
    p = load(name).catch(() => {
      pending.delete(name); // permite tentar de novo se a rede falhou
    });
    pending.set(name, p);
  }
  return p;
}

/** URLs já registradas em algum bundle (um alias só pode existir uma vez no Assets). */
const registered = new Set<string>();

async function load(name: BundleName) {
  const [{ Assets }, { configurePixelArt }] = await Promise.all([import('pixi.js'), import('./atlas')]);
  configurePixelArt(); // "nearest" tem de valer antes de qualquer textura ser criada
  const urls = BUNDLE_IMAGES[name];
  const fresh = urls.filter((u) => !registered.has(u));
  const shared = urls.filter((u) => registered.has(u));
  fresh.forEach((u) => registered.add(u));

  const bundleId = `bundle:${name}`;
  Assets.addBundle(bundleId, Object.fromEntries(fresh.map((u) => [u, u])));
  await Promise.all([
    Assets.loadBundle(bundleId),
    ...shared.map((u) => Assets.load(u)), // já é de outro bundle: só espera/lê o cache
    ...(BUNDLE_ATLASES[name] ?? []).map((u) => fetch(u).then((r) => r.arrayBuffer())),
  ]);
}

/** Pré-carrega vários bundles em sequência, sem competir com o que está na tela. */
export async function preloadBundles(names: BundleName[]) {
  for (const n of names) await preloadBundle(n);
}
