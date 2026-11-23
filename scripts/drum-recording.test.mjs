import test from 'node:test';
import assert from 'node:assert/strict';
import { quantizeDrumTake } from '../app/blog/drumRecording.mjs';
import { formatTabScore, parseTabScore } from '../app/blog/tabScore.mjs';

test('snaps early and late hits, merges chords in kit order, and keeps empty positions', () => {
  const score = quantizeDrumTake([
    { timeMs: 249, instrument: 'SD' },
    { timeMs: 12, instrument: 'BD' },
    { timeMs: 30, instrument: 'BD' },
    { timeMs: 0, instrument: 'HH' },
    { timeMs: 625, instrument: 'FT' },
  ], { bpm: 120, bars: 1, grid: '8' });
  assert.deepEqual(score.measures[0], [
    { duration: 8, notes: ['HH', 'BD'] },
    { duration: 8, notes: ['SD'] },
    { duration: 8, notes: [] },
    { duration: 8, notes: ['FT'] },
    { duration: 8, notes: [] },
    { duration: 8, notes: [] },
    { duration: 8, notes: [] },
    { duration: 8, notes: [] },
  ]);
});

test('keeps bar boundaries and clamps a valid hit just before the take ends', () => {
  const score = quantizeDrumTake([
    { timeMs: -1, instrument: 'RD' },
    { timeMs: 1999, instrument: 'BD' },
    { timeMs: 2000, instrument: 'SD' },
    { timeMs: 3999, instrument: 'FT' },
    { timeMs: 4000, instrument: 'CR' },
    { timeMs: Number.NaN, instrument: 'HH' },
  ], { bpm: 120, bars: 2, grid: '16' });
  assert.equal(score.measures.length, 2);
  assert.deepEqual(score.measures.map(measure => measure.length), [16, 16]);
  assert.equal(score.measures[0].filter(beat => beat.notes.length).length, 0);
  assert.deepEqual(score.measures[1][0], { duration: 16, notes: ['SD', 'BD'] });
  assert.deepEqual(score.measures[1][15], { duration: 16, notes: ['FT'] });
  assert.equal(score.measures[1].filter(beat => beat.notes.length).length, 2);
});

test('writes triplets and sextuplets as separate quarter-beat groups that round-trip', () => {
  for (const { grid, subdivisions, duration, inTimeOf } of [
    { grid: '3', subdivisions: 3, duration: 8, inTimeOf: 2 },
    { grid: '6', subdivisions: 6, duration: 16, inTimeOf: 4 },
  ]) {
    const score = quantizeDrumTake([
      { timeMs: 0, instrument: 'BD' },
      { timeMs: 500 / subdivisions, instrument: 'HH' },
      { timeMs: 2500, instrument: 'SD' },
    ], { bpm: 120, bars: 2, grid });
    assert.deepEqual(score.measures[0].slice(0, 3), [
      { duration, notes: ['BD'] },
      { duration, notes: ['HH'] },
      { duration, notes: [] },
    ]);
    assert.equal(score.tuplets.length, 8);
    assert.deepEqual(score.tuplets.slice(3, 5), [
      { measure: 0, start: 3 * subdivisions, length: subdivisions, count: subdivisions, inTimeOf },
      { measure: 1, start: 0, length: subdivisions, count: subdivisions, inTimeOf },
    ]);
    assert.match(formatTabScore(score), new RegExp(`^${subdivisions}:${inTimeOf}\\[${duration}:BD `));
    assert.deepEqual(parseTabScore(formatTabScore(score)), score);
  }
});

test('silence and invalid settings or events do not create a score', () => {
  const config = { bpm: 120, bars: 1, grid: '8' };
  assert.equal(quantizeDrumTake([], config), null);
  assert.equal(quantizeDrumTake([{ timeMs: -1, instrument: 'SD' }, { timeMs: 2000, instrument: 'BD' }], config), null);
  assert.equal(quantizeDrumTake([{ timeMs: 10, instrument: 'X' }], config), null);
  const hits = [{ timeMs: 0, instrument: 'BD' }];
  for (const invalid of [{ bpm: 39 }, { bpm: 241 }, { bpm: Infinity }, { bars: 0 }, { bars: 9 }, { bars: 1.5 }, { grid: '5' }]) {
    assert.equal(quantizeDrumTake(hits, { ...config, ...invalid }), null);
  }
});
