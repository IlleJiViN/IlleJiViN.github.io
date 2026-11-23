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
export const TAB_BEAT_MAX = 128;
export const TAB_TUPLET_MAX = 64;
export const TAB_SOURCE_MAX = 32768;
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

function parseMeasure(bar, measureIndex) {
  const tokens = bar.match(/[^\s\[\]]+|\[|\]/g);
  if (!tokens) return null;

  const beats = [];
  const tuplets = [];
  let group = null;

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token === ']') {
      if (!group || group.start === beats.length) return null;
      const members = beats.slice(group.start);
      const shortest = Math.max(...members.map(beat => beat.duration));
      const writtenUnits = members.reduce((sum, beat) => sum + shortest / beat.duration, 0);
      if (writtenUnits !== group.count) return null;
      tuplets.push({ ...group, length: members.length });
      group = null;
      continue;
    }

    if (tokens[index + 1] === '[') {
      if (group) return null;
      const ratio = /^([1-9]\d?):([1-9]\d?)$/.exec(token);
      if (!ratio) return null;
      const [, written, ordinary] = ratio;
      const count = Number(written);
      const inTimeOf = Number(ordinary);
      if (count < 2 || count > TAB_TUPLET_MAX || inTimeOf > TAB_TUPLET_MAX || count === inTimeOf) return null;
      group = { measure: measureIndex, start: beats.length, count, inTimeOf };
      index++;
      continue;
    }

    const beat = parseBeat(token);
    if (!beat || beats.length === TAB_BEAT_MAX) return null;
    beats.push(beat);
  }

  return group || !beats.length ? null : { beats, tuplets };
}

export function parseTabScore(text) {
  if (text.length > TAB_SOURCE_MAX) return null;
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
  const tuplets = [];
  for (const [measureIndex, bar] of bars.entries()) {
    const parsed = parseMeasure(bar, measureIndex);
    if (!parsed) return null;
    measures.push(parsed.beats);
    tuplets.push(...parsed.tuplets);
  }
  return tuplets.length ? { measures, tuplets } : { measures };
}

export function formatTabScore(score) {
  if (!score) return '';
  const groups = new Map(score.tuplets?.map(group => [`${group.measure}:${group.start}`, group]));
  const formatBeat = beat => `${beat.duration}:${beat.notes.length ? beat.notes.join('+') : 'r'}`;

  return score.measures.map((measure, measureIndex) => {
    const tokens = [];
    for (let index = 0; index < measure.length; index++) {
      const group = groups.get(`${measureIndex}:${index}`);
      if (group && group.length > 0) {
        const notes = measure.slice(index, index + group.length).map(formatBeat);
        tokens.push(`${group.count}:${group.inTimeOf}[${notes.join(' ')}]`);
        index += group.length - 1;
      } else {
        tokens.push(formatBeat(measure[index]));
      }
    }
    return tokens.join(' ');
  }).join(' |\n');
}
