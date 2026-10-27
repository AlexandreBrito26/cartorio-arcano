import { getAudioContext, onMutedChange } from './audio';
import type { SceneArt } from './cutscene';

/**
 * Trilha ambiente da abertura, 100% sintetizada com Web Audio (nenhum arquivo de áudio).
 *
 * Camadas: um pad de 4 vozes que desliza de acorde em acorde, vento (ruído filtrado),
 * sinos/plucks esparsos que caminham pela escala da cena, brasas crepitando e, na cena do
 * carimbo, um pulso grave de coração. Cada cena tem um perfil; trocar de cena só muda os alvos
 * (as vozes deslizam, não reiniciam), então a música nunca corta.
 */

export type ScoreScene = 'title' | SceneArt;

type BellKind = 'bell' | 'pluck' | 'glass';

interface Profile {
  /** Nota MIDI da tônica do pad. */
  root: number;
  /** Quatro intervalos (semitons acima da tônica) para as vozes do pad. */
  pad: [number, number, number, number];
  /** Escala (semitons) usada pelos sinos. */
  scale: number[];
  /** Faixa de oitavas acima da tônica para os sinos. */
  octaves: [number, number];
  /** Intervalo (s) entre notas dos sinos. */
  gap: [number, number];
  bell: BellKind;
  bellVol: number;
  padCutoff: number;
  padVol: number;
  wind: number;
  windFreq: number;
  /** Batimentos por minuto do pulso grave (0 = sem pulso). */
  pulse: number;
  /** Crepitar de brasas/vela (0 a 1). */
  crackle: number;
}

const PROFILES: Record<ScoreScene, Profile> = {
  // Cartão "Ano 417": quase silêncio, uma quinta vazia e sinos raros.
  title: {
    root: 38,
    pad: [0, 7, 12, 19],
    scale: [0, 3, 5, 7, 10],
    octaves: [2, 3],
    gap: [3.8, 6.5],
    bell: 'glass',
    bellVol: 0.06,
    padCutoff: 360,
    padVol: 0.5,
    wind: 0.015,
    windFreq: 500,
    pulse: 0,
    crackle: 0,
  },
  // Estrada: ré dórico, vento aberto, sinos distantes.
  road: {
    root: 38,
    pad: [0, 7, 15, 19],
    scale: [0, 2, 5, 7, 9],
    octaves: [2, 3],
    gap: [2.4, 5],
    bell: 'bell',
    bellVol: 0.08,
    padCutoff: 520,
    padVol: 0.55,
    wind: 0.09,
    windFreq: 650,
    pulse: 0,
    crackle: 0,
  },
  // Portão: sol menor, grave e solene, brilho de runa nos agudos.
  gate: {
    root: 31,
    pad: [0, 7, 12, 15],
    scale: [0, 3, 5, 7, 10],
    octaves: [2, 4],
    gap: [3, 6],
    bell: 'glass',
    bellVol: 0.075,
    padCutoff: 640,
    padVol: 0.65,
    wind: 0.05,
    windFreq: 420,
    pulse: 0,
    crackle: 0,
  },
  // Cartório: fá maior, calor de vela e plucks suaves.
  office: {
    root: 29,
    pad: [0, 7, 16, 21],
    scale: [0, 2, 4, 7, 9],
    octaves: [2, 3],
    gap: [1.5, 3.3],
    bell: 'pluck',
    bellVol: 0.1,
    padCutoff: 760,
    padVol: 0.55,
    wind: 0,
    windFreq: 500,
    pulse: 0,
    crackle: 0.7,
  },
  // Aurelha: lá menor, severa; plucks mais próximos, quase uma frase.
  mistress: {
    root: 33,
    pad: [0, 7, 15, 22],
    scale: [0, 3, 5, 7, 10],
    octaves: [2, 3],
    gap: [1.1, 2.5],
    bell: 'pluck',
    bellVol: 0.085,
    padCutoff: 600,
    padVol: 0.6,
    wind: 0,
    windFreq: 500,
    pulse: 0,
    crackle: 0.25,
  },
  // Carimbo: ré com acorde diminuto e coração batendo, até o impacto resolver.
  stamp: {
    root: 38,
    pad: [0, 6, 9, 15],
    scale: [0, 3, 6, 9],
    octaves: [2, 2],
    gap: [2.6, 4],
    bell: 'glass',
    bellVol: 0.05,
    padCutoff: 480,
    padVol: 0.6,
    wind: 0.03,
    windFreq: 380,
    pulse: 58,
    crackle: 0.2,
  },
};

/** Depois do impacto do carimbo: ré maior, sem pulso e com sinos claros. */
const STAMP_RESOLVED: Profile = {
  ...PROFILES.stamp,
  pad: [0, 7, 16, 19],
  scale: [0, 2, 4, 7, 9],
  octaves: [2, 3],
  gap: [1.4, 2.8],
  bell: 'bell',
  bellVol: 0.09,
  padCutoff: 880,
  padVol: 0.7,
  wind: 0.02,
  pulse: 0,
  crackle: 0.1,
};

export const scoreProfile = (scene: ScoreScene): Profile => PROFILES[scene];

const MASTER_LEVEL = 0.32;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

function noiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(c.sampleRate * seconds);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    // Ruído "marrom" (integrado): mais grave e macio que o branco, bom para vento.
    last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

/** Reverb sintetizado: ruído estéreo com decaimento exponencial. */
function impulse(c: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(c.sampleRate * seconds);
  const buffer = c.createBuffer(2, length, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.2;
  }
  return buffer;
}

interface Score {
  setScene(scene: ScoreScene): void;
  resolve(): void;
  stop(fadeSeconds: number): void;
}

function createScore(c: AudioContext, first: ScoreScene): Score {
  let profile = PROFILES[first];
  let stopped = false;
  const sources: { stop(when?: number): void }[] = [];
  const nodes: AudioNode[] = [];
  const track = <T extends AudioNode>(n: T): T => {
    nodes.push(n);
    return n;
  };

  // ---- Cadeia principal: master -> compressor -> saída; reverb em paralelo.
  const master = track(c.createGain());
  master.gain.value = 0.0001;
  const comp = track(c.createDynamicsCompressor());
  comp.threshold.value = -20;
  comp.ratio.value = 3;
  master.connect(comp).connect(c.destination);

  const convolver = track(c.createConvolver());
  convolver.buffer = impulse(c, 3.4);
  const revSend = track(c.createGain());
  revSend.gain.value = 0.7;
  const revReturn = track(c.createGain());
  revReturn.gain.value = 0.9;
  revSend.connect(convolver).connect(revReturn).connect(master);

  // ---- Pad: 4 vozes, cada uma com dois dentes-de-serra levemente desafinados.
  const padFilter = track(c.createBiquadFilter());
  padFilter.type = 'lowpass';
  padFilter.Q.value = 0.7;
  padFilter.frequency.value = profile.padCutoff;
  const padBus = track(c.createGain());
  padBus.gain.value = 0.0001;
  padFilter.connect(padBus);
  padBus.connect(master);
  padBus.connect(revSend);

  const voices: OscillatorNode[][] = [];
  for (let v = 0; v < 4; v++) {
    const pair: OscillatorNode[] = [];
    for (const detune of [-7, 7]) {
      const osc = c.createOscillator();
      osc.type = 'sawtooth';
      osc.detune.value = detune;
      osc.frequency.value = hz(profile.root + profile.pad[v]);
      const g = track(c.createGain());
      g.gain.value = v === 0 ? 0.2 : 0.12;
      osc.connect(g).connect(padFilter);
      osc.start();
      sources.push(osc);
      pair.push(osc);
    }
    voices.push(pair);
  }
  // Sub grave (sino de igreja ao longe).
  const sub = c.createOscillator();
  sub.type = 'sine';
  sub.frequency.value = hz(profile.root - 12);
  const subGain = track(c.createGain());
  subGain.gain.value = 0.22;
  sub.connect(subGain).connect(padBus);
  sub.start();
  sources.push(sub);

  // LFO lento no filtro: o pad "respira".
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = track(c.createGain());
  lfoDepth.gain.value = 140;
  lfo.connect(lfoDepth).connect(padFilter.frequency);
  lfo.start();
  sources.push(lfo);

  // ---- Vento: ruído marrom em passa-banda com a frequência balançando.
  const windSrc = c.createBufferSource();
  windSrc.buffer = noiseBuffer(c, 6);
  windSrc.loop = true;
  const windFilter = track(c.createBiquadFilter());
  windFilter.type = 'bandpass';
  windFilter.Q.value = 0.9;
  windFilter.frequency.value = profile.windFreq;
  const windGain = track(c.createGain());
  windGain.gain.value = 0.0001;
  const windLfo = c.createOscillator();
  windLfo.frequency.value = 0.045;
  const windLfoDepth = track(c.createGain());
  windLfoDepth.gain.value = 220;
  windLfo.connect(windLfoDepth).connect(windFilter.frequency);
  windSrc.connect(windFilter).connect(windGain).connect(master);
  windGain.connect(revSend);
  windSrc.start();
  windLfo.start();
  sources.push(windSrc, windLfo);

  // ---- Barramento dos sinos/plucks.
  const bellBus = track(c.createGain());
  bellBus.gain.value = 1;
  bellBus.connect(master);
  const bellSend = track(c.createGain());
  bellSend.gain.value = 0.9;
  bellBus.connect(bellSend).connect(revSend);

  const pan = (): AudioNode => {
    if (typeof c.createStereoPanner !== 'function') return bellBus;
    const p = c.createStereoPanner();
    p.pan.value = rand(-0.5, 0.5);
    p.connect(bellBus);
    return p;
  };

  const envelope = (dest: AudioNode, t: number, peak: number, attack: number, decay: number): GainNode => {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    g.connect(dest);
    return g;
  };

  const partial = (
    type: OscillatorType,
    freq: number,
    t: number,
    peak: number,
    attack: number,
    decay: number,
    dest: AudioNode,
  ) => {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(envelope(dest, t, peak, attack, decay));
    osc.start(t);
    osc.stop(t + attack + decay + 0.05);
  };

  const ring = (midi: number, t: number, vol: number, kind: BellKind) => {
    const f = hz(midi);
    const dest = pan();
    if (kind === 'bell') {
      partial('sine', f, t, vol, 0.005, 3.2, dest);
      partial('sine', f * 2.76, t, vol * 0.35, 0.005, 1.4, dest);
      partial('sine', f * 5.4, t, vol * 0.12, 0.005, 0.5, dest);
    } else if (kind === 'pluck') {
      partial('triangle', f, t, vol, 0.006, 1.1, dest);
      partial('sine', f * 2, t, vol * 0.4, 0.006, 0.6, dest);
    } else {
      partial('sine', f, t, vol, 0.35, 3.4, dest);
      partial('sine', f * 1.5, t, vol * 0.25, 0.5, 3, dest);
    }
  };

  // ---- Pulso de coração (lub-dub) e crepitar.
  const thump = (t: number, vol: number, from: number) => {
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(34, t + 0.22);
    osc.connect(envelope(master, t, vol, 0.012, 0.22));
    osc.start(t);
    osc.stop(t + 0.3);
  };

  const crackleBuf = noiseBuffer(c, 0.05);
  const tick = (t: number, vol: number) => {
    const src = c.createBufferSource();
    src.buffer = crackleBuf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = rand(1800, 4200);
    f.Q.value = 1.4;
    src.connect(f).connect(envelope(master, t, vol, 0.002, rand(0.012, 0.03)));
    src.start(t);
  };

  // ---- Agendador (olha ~1 s à frente).
  let degree = -1;
  let nextBell = c.currentTime + 1.2;
  let nextBeat = c.currentTime + 0.6;
  let nextTick = c.currentTime + 0.5;

  const pitches = (): number[] => {
    const out: number[] = [];
    for (let o = profile.octaves[0]; o <= profile.octaves[1]; o++)
      for (const s of profile.scale) out.push(profile.root + s + 12 * o);
    return out;
  };

  const schedule = () => {
    if (stopped) return;
    const now = c.currentTime;
    const horizon = now + 1;

    while (nextBell < horizon) {
      const list = pitches();
      if (degree < 0 || degree >= list.length) degree = Math.floor(rand(0, list.length));
      const leap = Math.random() < 0.22;
      const step = leap ? Math.round(rand(-4, 4)) : Math.random() < 0.5 ? -1 : 1;
      degree = Math.min(list.length - 1, Math.max(0, degree + (step === 0 ? 1 : step)));
      ring(list[degree], Math.max(nextBell, now), profile.bellVol * rand(0.7, 1.1), profile.bell);
      nextBell += rand(profile.gap[0], profile.gap[1]);
    }

    if (profile.pulse > 0) {
      const period = 60 / profile.pulse;
      while (nextBeat < horizon) {
        thump(Math.max(nextBeat, now), 0.5, 70);
        thump(Math.max(nextBeat + 0.3, now), 0.32, 62);
        nextBeat += period;
      }
    } else {
      nextBeat = Math.max(nextBeat, now + 0.2);
    }

    if (profile.crackle > 0) {
      while (nextTick < horizon) {
        tick(Math.max(nextTick, now), rand(0.012, 0.045) * profile.crackle);
        nextTick += rand(0.08, 0.6) / profile.crackle;
      }
    } else {
      nextTick = Math.max(nextTick, now + 0.2);
    }
  };

  const applyProfile = (p: Profile, glide: number) => {
    profile = p;
    const t = c.currentTime;
    voices.forEach((pair, v) => {
      for (const osc of pair) osc.frequency.setTargetAtTime(hz(p.root + p.pad[v]), t, glide);
    });
    sub.frequency.setTargetAtTime(hz(p.root - 12), t, glide);
    padFilter.frequency.setTargetAtTime(p.padCutoff, t, glide);
    padBus.gain.setTargetAtTime(p.padVol, t, glide);
    windFilter.frequency.setTargetAtTime(p.windFreq, t, glide);
    windGain.gain.setTargetAtTime(Math.max(p.wind, 0.0001), t, glide);
    degree = -1;
  };

  applyProfile(profile, 0.05);
  // Entrada suave: a trilha nasce do silêncio.
  master.gain.setTargetAtTime(MASTER_LEVEL, c.currentTime, 1.1);
  schedule();
  const timer = window.setInterval(schedule, 250);

  return {
    setScene(scene) {
      if (stopped) return;
      applyProfile(PROFILES[scene], 1.6);
    },
    resolve() {
      if (stopped) return;
      // Impacto: batida grave seca e o acorde se abre em ré maior.
      const t = c.currentTime;
      thump(t, 0.9, 90);
      ring(profile.root + 24, t + 0.02, 0.12, 'bell');
      ring(profile.root + 28, t + 0.08, 0.09, 'bell');
      ring(profile.root + 31, t + 0.14, 0.08, 'bell');
      applyProfile(STAMP_RESOLVED, 0.7);
    },
    stop(fadeSeconds) {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      const t = c.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setTargetAtTime(0.0001, t, Math.max(fadeSeconds, 0.05) / 4);
      window.setTimeout(
        () => {
          for (const s of sources) {
            try {
              s.stop();
            } catch {
              // Já parada.
            }
          }
          for (const n of nodes) n.disconnect();
        },
        fadeSeconds * 1000 + 400,
      );
    },
  };
}

// ---- API pública: o resto do jogo só fala com estas funções.

let current: Score | null = null;
let wanted: ScoreScene | null = null;
let resolved = false;
let unsubscribe: (() => void) | null = null;

function ensureRunning(c: AudioContext): void {
  if (c.state === 'running') return;
  void c.resume();
  // Se o navegador ainda segura o áudio, o primeiro toque ou tecla libera.
  const unlock = () => {
    void c.resume();
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
}

function start(): void {
  if (current || wanted === null) return;
  const c = getAudioContext();
  if (!c) return;
  ensureRunning(c);
  current = createScore(c, wanted);
  if (resolved) current.resolve();
}

/** Liga a trilha (se ainda não toca) ou troca para o perfil da cena. Idempotente. */
export function playScore(scene: ScoreScene): void {
  if (typeof window === 'undefined') return;
  if (wanted !== scene) resolved = false;
  wanted = scene;
  unsubscribe ??= onMutedChange((muted) => {
    if (muted) {
      current?.stop(0.25);
      current = null;
    } else {
      start();
    }
  });
  if (current) current.setScene(scene);
  else start();
}

/** O carimbo bateu: a música resolve. */
export function resolveScore(): void {
  resolved = true;
  current?.resolve();
}

/** Desliga a trilha com um fade-out. */
export function stopScore(fadeSeconds = 1.4): void {
  wanted = null;
  resolved = false;
  current?.stop(fadeSeconds);
  current = null;
  unsubscribe?.();
  unsubscribe = null;
}
