import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** AudioParam falso: aceita qualquer agendamento. */
const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  setTargetAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
  cancelScheduledValues: vi.fn(),
});

const stats = { convolvers: 0, oscillators: 0, started: 0, stopped: 0 };

function node(kind: string) {
  const n: Record<string, unknown> = {
    connect: (dest: unknown) => dest,
    disconnect: vi.fn(),
    start: vi.fn(() => {
      stats.started++;
    }),
    stop: vi.fn(() => {
      stats.stopped++;
    }),
    frequency: param(),
    detune: param(),
    gain: param(),
    Q: param(),
    threshold: param(),
    ratio: param(),
    pan: param(),
  };
  if (kind === 'convolver') stats.convolvers++;
  if (kind === 'oscillator') stats.oscillators++;
  return n;
}

class FakeAudioContext {
  currentTime = 0;
  sampleRate = 8000;
  state = 'running';
  destination = node('destination');
  resume = vi.fn();
  createBuffer = (_ch: number, length: number) => ({ getChannelData: () => new Float32Array(length) });
  createGain = () => node('gain');
  createOscillator = () => node('oscillator');
  createBiquadFilter = () => node('filter');
  createBufferSource = () => node('source');
  createConvolver = () => node('convolver');
  createDynamicsCompressor = () => node('compressor');
  createStereoPanner = () => node('panner');
}

const loadModules = async () => {
  vi.resetModules();
  const audio = await import('./audio');
  const music = await import('./music');
  return { audio, music };
};

beforeEach(() => {
  vi.useFakeTimers();
  stats.convolvers = stats.oscillators = stats.started = stats.stopped = 0;
  vi.stubGlobal('window', {
    AudioContext: FakeAudioContext,
    setInterval: (fn: () => void, ms: number) => setInterval(fn, ms),
    clearInterval: (id: number) => clearInterval(id),
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: number) => clearTimeout(id),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('perfis da trilha', () => {
  it('toda cena tem perfil válido (4 vozes, escala e intervalos coerentes)', async () => {
    const { music } = await loadModules();
    for (const scene of ['title', 'road', 'gate', 'office', 'mistress', 'stamp'] as const) {
      const p = music.scoreProfile(scene);
      expect(p.pad).toHaveLength(4);
      expect(p.scale.length).toBeGreaterThan(2);
      expect(p.gap[0]).toBeGreaterThan(0);
      expect(p.gap[1]).toBeGreaterThanOrEqual(p.gap[0]);
      expect(p.octaves[1]).toBeGreaterThanOrEqual(p.octaves[0]);
      expect(p.padCutoff).toBeGreaterThan(100);
    }
  });

  it('cada cena soa diferente (tônica, escala ou timbre mudam)', async () => {
    const { music } = await loadModules();
    const sig = (s: Parameters<typeof music.scoreProfile>[0]) => {
      const p = music.scoreProfile(s);
      return JSON.stringify([p.root, p.pad, p.scale, p.bell, p.pulse > 0]);
    };
    const scenes = ['title', 'road', 'gate', 'office', 'mistress', 'stamp'] as const;
    expect(new Set(scenes.map(sig)).size).toBe(scenes.length);
  });
});

describe('ciclo de vida da trilha', () => {
  it('liga uma vez, troca de cena sem reiniciar e para limpando timers e fontes', async () => {
    const { music } = await loadModules();
    music.playScore('title');
    vi.advanceTimersByTime(3000);
    expect(stats.convolvers).toBe(1);
    expect(stats.started).toBeGreaterThan(5);

    music.playScore('road');
    music.playScore('road');
    music.resolveScore();
    vi.advanceTimersByTime(3000);
    expect(stats.convolvers).toBe(1);

    music.stopScore(1);
    vi.advanceTimersByTime(3000);
    expect(vi.getTimerCount()).toBe(0);
    expect(stats.stopped).toBeGreaterThanOrEqual(12);
  });

  it('desligar o som para a trilha e religar recomeça se a cena ainda está tocando', async () => {
    const { audio, music } = await loadModules();
    music.playScore('office');
    vi.advanceTimersByTime(500);
    expect(stats.convolvers).toBe(1);

    audio.setMuted(true);
    vi.advanceTimersByTime(2000);
    expect(vi.getTimerCount()).toBe(0);

    audio.setMuted(false);
    expect(stats.convolvers).toBe(2);

    music.stopScore(0.5);
    vi.advanceTimersByTime(2000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mudo desde o começo: não cria nada', async () => {
    const { audio, music } = await loadModules();
    audio.setMuted(true);
    music.playScore('road');
    vi.advanceTimersByTime(2000);
    expect(stats.convolvers).toBe(0);
    music.stopScore(0.1);
  });
});
