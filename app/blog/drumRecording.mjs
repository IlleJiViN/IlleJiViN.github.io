import { DRUM_INSTRUMENTS, TAB_MEASURE_MAX } from './tabScore.mjs';

export const DRUM_RECORD_GRIDS = ['8', '16', '3', '6'];
export const DRUM_RECORD_BPM_MIN = 40;
export const DRUM_RECORD_BPM_MAX = 240;

const BEATS_PER_BAR = 4;
const gridSpecs = new Map([
  ['8', { stepsPerBeat: 2, duration: 8 }],
  ['16', { stepsPerBeat: 4, duration: 16 }],
  ['3', { stepsPerBeat: 3, duration: 8, inTimeOf: 2 }],
  ['6', { stepsPerBeat: 6, duration: 16, inTimeOf: 4 }],
]);
const instrumentIds = DRUM_INSTRUMENTS.map(instrument => instrument.id);
const knownInstruments = new Set(instrumentIds);

export function quantizeDrumTake(hits, { bpm, bars, grid }) {
  const spec = gridSpecs.get(grid);
  if (!spec || !Number.isFinite(bpm) || bpm < DRUM_RECORD_BPM_MIN || bpm > DRUM_RECORD_BPM_MAX
    || !Number.isInteger(bars) || bars < 1 || bars > TAB_MEASURE_MAX) return null;

  const { stepsPerBeat, duration, inTimeOf } = spec;
  const beatMs = 60000 / bpm;
  const stepMs = beatMs / stepsPerBeat;
  const stepsPerBar = BEATS_PER_BAR * stepsPerBeat;
  const totalSteps = bars * stepsPerBar;
  const takeMs = bars * BEATS_PER_BAR * beatMs;
  const hitsByStep = new Map();

  for (const { timeMs, instrument } of hits) {
    if (!Number.isFinite(timeMs) || timeMs < 0 || timeMs >= takeMs || !knownInstruments.has(instrument)) continue;
    const step = Math.min(totalSteps - 1, Math.round(timeMs / stepMs));
    if (!hitsByStep.has(step)) hitsByStep.set(step, new Set());
    hitsByStep.get(step).add(instrument);
  }

  if (!hitsByStep.size) return null;

  const tuplets = [];
  const measures = Array.from({ length: bars }, (_, measure) => {
    if (inTimeOf) {
      for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
        tuplets.push({ measure, start: beat * stepsPerBeat, length: stepsPerBeat, count: stepsPerBeat, inTimeOf });
      }
    }

    return Array.from({ length: stepsPerBar }, (_, offset) => {
      const instruments = hitsByStep.get(measure * stepsPerBar + offset);
      return { duration, notes: instruments ? instrumentIds.filter(id => instruments.has(id)) : [] };
    });
  });

  return tuplets.length ? { measures, tuplets } : { measures };
}
