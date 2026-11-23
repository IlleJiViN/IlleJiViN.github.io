// Each step moves half a staff line spacing down, starting at the top line.
export const DRUM_INSTRUMENTS = [
  { id: 'CR', label: '크래시', step: -2, head: 'cross' },
  { id: 'HH', label: '하이햇', step: -1, head: 'cross' },
  { id: 'RD', label: '라이드', step: 0, head: 'cross' },
  { id: 'HT', label: '하이 탐', step: 1, head: 'oval' },
  { id: 'MT', label: '미드 탐', step: 2, head: 'oval' },
  { id: 'SD', label: '스네어', step: 3, head: 'oval' },
  { id: 'FT', label: '플로어 탐', step: 5, head: 'oval' },
  { id: 'BD', label: '킥', step: 7, head: 'oval' },
];

export const TAB_DURATIONS = [1, 2, 4, 8, 16];
export const TAB_MEASURE_MAX = 8;
export const TAB_BEAT_MAX = 16;
export const TAB_MOOD_MAX = 80;

const instrumentIds = new Set(DRUM_INSTRUMENTS.map(instrument => instrument.id));

function parseBeat(token) {
  const match = /^(1|2|4|8|16):(.+)$/.exec(token);
  if (!match) return null;

  const duration = Number(match[1]);
  if (match[2] === 'r') return { duration, notes: [] };

  const notes = match[2].split('+');
  if (notes.some(note => !instrumentIds.has(note)) || new Set(notes).size !== notes.length) return null;

  return { duration, notes };
}

export function parseTabScore(text) {
  if (text.length > 8192) return null;
  let source = text.trim();
  const fenced = /^(`{3,}|~{3,})[^\r\n]*\r?\n([\s\S]*?)\r?\n(`{3,}|~{3,})$/.exec(source);
  if (fenced && fenced[3][0] === fenced[1][0] && fenced[3].length >= fenced[1].length) {
    source = fenced[2].trim();
  }

  // Accept optional opening and closing barlines.
  source = source.replace(/^\||\|$/g, '').trim();
  if (!source) return null;

  const bars = source.split('|');
  if (bars.length > TAB_MEASURE_MAX) return null;
  const measures = [];
  for (const bar of bars) {
    const tokens = bar.trim().split(/\s+/);
    if (tokens.length > TAB_BEAT_MAX) return null;
    const measure = tokens.map(parseBeat);
    if (measure.includes(null)) return null;
    measures.push(measure);
  }
  return { measures };
}
