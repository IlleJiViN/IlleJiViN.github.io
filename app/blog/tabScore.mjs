export const TAB_STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];
export const TAB_DURATIONS = [1, 2, 4, 8, 16];
export const TAB_FRET_MAX = 24;
export const TAB_MEASURE_MAX = 8;
export const TAB_BEAT_MAX = 16;
export const TAB_MOOD_MAX = 80;

function parseBeat(token) {
  const match = /^(1|2|4|8|16):(.+)$/.exec(token);
  if (!match) return null;

  const duration = Number(match[1]);
  const notes = {};
  if (match[2] === 'r') return { duration, notes };

  for (const note of match[2].split('+')) {
    const fret = /^([eBGDAE])(\d{1,2})$/.exec(note);
    if (!fret || Number(fret[2]) > TAB_FRET_MAX || notes[fret[1]] !== undefined) return null;
    notes[fret[1]] = Number(fret[2]);
  }

  return { duration, notes };
}

export function parseTabScore(text) {
  if (text.length > 8192) return null;
  let source = text.trim();
  const fenced = /^(`{3,}|~{3,})[^\r\n]*\r?\n([\s\S]*?)\r?\n(`{3,}|~{3,})$/.exec(source);
  if (fenced && fenced[3][0] === fenced[1][0] && fenced[3].length >= fenced[1].length) {
    source = fenced[2].trim();
  }

  // Accept the opening and closing barlines of a handwritten TAB.
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
