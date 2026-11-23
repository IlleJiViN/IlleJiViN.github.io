import type { DrumInstrument, TabScoreData } from './tabScore.mjs';

export type DrumRecordGrid = '8' | '16' | '3' | '6';
export type DrumRecordingHit = { timeMs: number; instrument: DrumInstrument };
export type DrumRecordingConfig = { bpm: number; bars: number; grid: DrumRecordGrid };

export const DRUM_RECORD_GRIDS: readonly DrumRecordGrid[];
export const DRUM_RECORD_BPM_MIN: 40;
export const DRUM_RECORD_BPM_MAX: 240;

export function quantizeDrumTake(hits: readonly DrumRecordingHit[], config: DrumRecordingConfig): TabScoreData | null;
