import type { DrumInstrument } from './tabScore.mjs';

export type DrumAudio = {
  resume(): Promise<void>;
  hit(instrument: DrumInstrument): void;
  click(timeMs: number, accent: boolean): void;
  cancelClicks(): void;
  close(): void;
};

const QUIET = 0.0001;
const LIVE_VOICE_LIMIT = 32;
const CLICK_VOICE_LIMIT = 48;
const TOMS = {
  HT: { from: 232, to: 154, tail: 0.22 },
  MT: { from: 180, to: 114, tail: 0.26 },
  FT: { from: 130, to: 78, tail: 0.32 },
};

export function createDrumAudio(): DrumAudio | null {
  if (typeof window === 'undefined' || !window.AudioContext) return null;

  let context: AudioContext;
  try {
    context = new window.AudioContext({ latencyHint: 'interactive' });
  } catch {
    return null;
  }

  const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 1.25), context.sampleRate);
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -17;
  compressor.knee.value = 12;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.1;
  const master = context.createGain();
  master.gain.value = 0.66;
  compressor.connect(master);
  master.connect(context.destination);

  const voices = new Set<() => void>();
  const clicks = new Set<() => void>();
  let closed = false;

  function play(
    source: OscillatorNode | AudioBufferSourceNode,
    at: number,
    duration: number,
    level: number,
    filter?: BiquadFilterNode,
    channel = voices,
  ) {
    const limit = channel === clicks ? CLICK_VOICE_LIMIT : LIVE_VOICE_LIMIT;
    if (channel.size >= limit) channel.values().next().value?.();

    const gain = context.createGain();
    gain.gain.setValueAtTime(QUIET, at);
    gain.gain.exponentialRampToValueAtTime(level, at + 0.002);
    gain.gain.exponentialRampToValueAtTime(QUIET, at + duration);
    if (filter) {
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(compressor);

    function clean() {
      channel.delete(cancel);
      source.onended = null;
      source.disconnect();
      filter?.disconnect();
      gain.disconnect();
    }
    function cancel() {
      source.stop();
      clean();
    }

    source.onended = clean;
    channel.add(cancel);
    if ('buffer' in source) {
      const offset = Math.random() * Math.max(0, noise.duration - duration);
      source.start(at, offset);
    } else {
      source.start(at);
    }
    source.stop(at + duration);
  }

  function tone(
    at: number, duration: number, level: number, from: number, to: number,
    shape: OscillatorType = 'sine', channel = voices,
  ) {
    const oscillator = context.createOscillator();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(from, at);
    oscillator.frequency.exponentialRampToValueAtTime(to, at + duration * 0.72);
    play(oscillator, at, duration, level, undefined, channel);
  }

  function burst(at: number, duration: number, level: number, frequency: number, type: BiquadFilterType) {
    const source = context.createBufferSource();
    source.buffer = noise;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = Math.min(frequency, context.sampleRate * 0.45);
    filter.Q.value = 0.7;
    play(source, at, duration, level, filter);
  }

  function hit(instrument: DrumInstrument) {
    if (closed) return;
    const at = context.currentTime;
    switch (instrument) {
      case 'BD':
        tone(at, 0.31, 0.55, 150, 43);
        burst(at, 0.022, 0.10, 2200, 'lowpass');
        break;
      case 'SD':
        burst(at, 0.22, 0.40, 1100, 'highpass');
        tone(at, 0.105, 0.12, 177, 105, 'triangle');
        break;
      case 'HT':
      case 'MT':
      case 'FT': {
        const { from, to, tail } = TOMS[instrument];
        tone(at, tail, 0.35, from, to);
        burst(at, 0.052, 0.075, 1250, 'bandpass');
        break;
      }
      case 'HH':
        burst(at, 0.085, 0.195, 6900, 'highpass');
        break;
      case 'RD':
        burst(at, 0.46, 0.21, 5900, 'bandpass');
        tone(at, 0.30, 0.048, 1440, 1380, 'triangle');
        break;
      case 'CR':
        burst(at, 0.87, 0.30, 3700, 'highpass');
        burst(at, 0.37, 0.10, 1850, 'bandpass');
        break;
    }
  }

  function cancelClicks() {
    for (const cancel of clicks) cancel();
  }

  return {
    resume() {
      return closed || context.state === 'running' ? Promise.resolve() : context.resume();
    },
    hit,
    click(timeMs, accent) {
      if (closed || !Number.isFinite(timeMs)) return;
      const at = context.currentTime + Math.max(0, (timeMs - performance.now()) / 1000);
      const frequency = accent ? 1690 : 980;
      tone(at, 0.052, accent ? 0.22 : 0.15, frequency, frequency, 'triangle', clicks);
    },
    cancelClicks,
    close() {
      if (closed) return;
      closed = true;
      cancelClicks();
      for (const cancel of voices) cancel();
      compressor.disconnect();
      master.disconnect();
      void context.close().catch(() => {});
    },
  };
}
