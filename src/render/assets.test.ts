import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUNDLE_ATLASES, BUNDLE_IMAGES } from './assets';

describe('manifesto de assets', () => {
  const all = [...Object.values(BUNDLE_IMAGES).flat(), ...Object.values(BUNDLE_ATLASES).flat()];

  it.each([...new Set(all)])('%s existe em public/', (url) => {
    expect(existsSync(`public${url}`)).toBe(true);
  });

  it('cobre os 9 retratos de personagem', () => {
    expect(BUNDLE_IMAGES.personagens).toHaveLength(9);
  });
});
