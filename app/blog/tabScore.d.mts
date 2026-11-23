export type DrumInstrument = 'CR' | 'HH' | 'RD' | 'HT' | 'MT' | 'SD' | 'FT' | 'BD';
export type TabDuration = 1 | 2 | 4 | 8 | 16;
export type TabBeat = {
  duration: TabDuration;
  notes: DrumInstrument[];
};
export type TabScoreData = { measures: TabBeat[][] };
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
export const TAB_BEAT_MAX: 16;
export const TAB_MOOD_MAX: 80;
export function parseTabScore(text: string): TabScoreData | null;
