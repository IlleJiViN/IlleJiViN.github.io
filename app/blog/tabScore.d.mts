export type TabString = 'e' | 'B' | 'G' | 'D' | 'A' | 'E';
export type TabDuration = 1 | 2 | 4 | 8 | 16;
export type TabBeat = {
  duration: TabDuration;
  notes: Partial<Record<TabString, number>>;
};
export type TabScoreData = { measures: TabBeat[][] };
export type PostTab = {
  score: TabScoreData | null;
  difficulty: number | null;
  mood: string;
};

export const TAB_STRINGS: readonly TabString[];
export const TAB_DURATIONS: readonly TabDuration[];
export const TAB_FRET_MAX: 24;
export const TAB_MEASURE_MAX: 8;
export const TAB_BEAT_MAX: 16;
export const TAB_MOOD_MAX: 80;
export function parseTabScore(text: string): TabScoreData | null;
