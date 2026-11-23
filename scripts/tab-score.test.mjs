import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTabScore } from '../app/blog/tabScore.mjs';

test('TAB notation keeps chord frets, high and low E, and all rhythmic values', () => {
  assert.deepEqual(parseTabScore('1:e24+E0 2:r | 4:D10 8:B2 16:G5+A9'), {
    measures: [
      [{ duration: 1, notes: { e: 24, E: 0 } }, { duration: 2, notes: {} }],
      [{ duration: 4, notes: { D: 10 } }, { duration: 8, notes: { B: 2 } }, { duration: 16, notes: { G: 5, A: 9 } }],
    ],
  });
});

test('TAB notation rejects malformed notes, repeated strings and empty or oversized bars', () => {
  const invalidScores = [
    '', '||', '4:e0 || 4:E0', '32:A3', '4:e25', '4:e0+e1', '4:H2', '4:r+A1', '4:E-1', '4:E0 4:',
    Array(17).fill('4:r').join(' '),
    Array(9).fill('4:r').join('|'),
  ];
  for (const score of invalidScores) assert.equal(parseTabScore(score), null, score);
  assert.ok(parseTabScore(Array(8).fill(Array(16).fill('16:r').join(' ')).join('|')));
});
