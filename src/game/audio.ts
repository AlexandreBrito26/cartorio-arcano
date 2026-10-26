import type { Verdict } from './types';

/**
 * Efeitos sonoros sintetizados com Web Audio: nenhum arquivo de áudio.
 * O AudioContext só nasce no primeiro som, que sempre vem de um clique ou tecla
 * (exigência de autoplay dos navegadores).
 */

const KEY = 'cartorio-arcano:muted';

function readMuted(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readMuted();
let ctx: AudioContext | null = null;

export const isMuted = () => muted;

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {
    // Sem armazenamento: a escolha vale só nesta sessão.
  }
}

function getCtx(): AudioContext | null {
  if (muted || typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOptions {
  type: OscillatorType;
  from: number;
  to?: number;
  at?: number;
  dur: number;
  vol: number;
}

function tone(c: AudioContext, o: ToneOptions): void {
  const t0 = c.currentTime + (o.at ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = o.type;
  osc.frequency.setValueAtTime(o.from, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);

  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(o.vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + o.dur + 0.02);
}

/** Estalo curto de ruído filtrado: o "tchec" do carimbo no papel. */
function thud(c: AudioContext, dur: number, vol: number, cutoff: number): void {
  const length = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);

  const source = c.createBufferSource();
  source.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = cutoff;
  const gain = c.createGain();
  gain.gain.value = vol;

  source.connect(filter).connect(gain).connect(c.destination);
  source.start();
}

export function playStamp(kind: 'approve' | 'deny'): void {
  const c = getCtx();
  if (!c) return;
  tone(c, { type: 'sine', from: kind === 'approve' ? 150 : 110, to: 45, dur: 0.16, vol: 0.7 });
  thud(c, 0.09, 0.5, 1800);
}

export function playVerdict(verdict: Verdict): void {
  const c = getCtx();
  if (!c) return;

  if (verdict === 'perfect') {
    // Moedinha: duas notas curtas subindo.
    tone(c, { type: 'triangle', from: 880, at: 0.12, dur: 0.16, vol: 0.22 });
    tone(c, { type: 'triangle', from: 1318, at: 0.22, dur: 0.3, vol: 0.2 });
  } else if (verdict === 'partial') {
    tone(c, { type: 'triangle', from: 660, at: 0.12, dur: 0.25, vol: 0.2 });
  } else {
    // Infração: zumbido grave descendo.
    tone(c, { type: 'sawtooth', from: 170, to: 80, at: 0.1, dur: 0.35, vol: 0.18 });
  }
}

/** Carimbo + resultado, tocados juntos quando o veredito aparece. */
export function playResult(kind: 'approve' | 'deny', verdict: Verdict): void {
  playStamp(kind);
  playVerdict(verdict);
}
