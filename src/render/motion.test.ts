import { describe, expect, it } from 'vitest';
import { fpsCap, isLowEnd } from './motion';

describe('motion', () => {
  it('aparelho fraco: poucos núcleos ou pouca memória', () => {
    expect(isLowEnd({ hardwareConcurrency: 4 })).toBe(true);
    expect(isLowEnd({ hardwareConcurrency: 8, deviceMemory: 2 })).toBe(true);
    expect(isLowEnd({ hardwareConcurrency: 8, deviceMemory: 8 })).toBe(false);
    expect(isLowEnd({})).toBe(false);
    expect(isLowEnd(undefined)).toBe(false);
  });

  it('limite de FPS', () => {
    expect(fpsCap(true)).toBe(30);
    expect(fpsCap(false)).toBe(60);
  });
});
