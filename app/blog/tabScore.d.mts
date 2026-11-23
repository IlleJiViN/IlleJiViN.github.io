export type DrumInstrument = 'CR' | 'HH' | 'RD' | 'HT' | 'MT' | 'SD' | 'FT' | 'BD';
export type TabDuration = 1 | 2 | 4 | 8 | 16;
export type TabBeat = {
  duration: TabDuration;
  notes: DrumInstrument[];
};
export type TabTuplet = {
  measure: number;
  start: number;
  length: number;
  count: number;
  inTimeOf: number;
};
export type TabScoreData = { measures: TabBeat[][]; tuplets?: TabTuplet[] };
export type PostTab = {
  score: TabScoreData | null;
  difficulty: number | null;
  mood: string;
};

export const DRUM_INSTRUMENTS: readonly {
  id: DrumInstrument;
  label: string;
  step: number;
  head: 'cross' | 'oval';
}[];
export const TAB_DURATIONS: readonly TabDuration[];
export const TAB_MEASURE_MAX: 8;
export const TAB_BEAT_MAX: 128;
export const TAB_TUPLET_MAX: 64;
export const TAB_SOURCE_MAX: 32768;
export const TAB_MOOD_MAX: 80;
export function parseTabScore(text: string): TabScoreData | null;
export function formatTabScore(score: TabScoreData | null | undefined): string;
