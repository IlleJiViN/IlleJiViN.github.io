import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTabScore } from '../app/blog/tabScore.mjs';

test('drum notation keeps simultaneous hits, cymbals, rests and all rhythmic values', () => {
  assert.deepEqual(parseTabScore('1:CR+BD 2:r | 4:HH+SD 8:RD+HT 16:MT+FT'), {
    measures: [
      [{ duration: 1, notes: ['CR', 'BD'] }, { duration: 2, notes: [] }],
      [{ duration: 4, notes: ['HH', 'SD'] }, { duration: 8, notes: ['RD', 'HT'] }, { duration: 16, notes: ['MT', 'FT'] }],
    ],
  });
});

test('drum notation rejects guitar frets, unknown or repeated instruments and oversized bars', () => {
  const invalidScores = [
    '', '||', '4:HH || 4:SD', '32:BD', '4:e25', '4:HH+HH', '4:XX', '4:r+BD', '4:HH+', '4:BD 4:',
    Array(17).fill('4:r').join(' '),
    Array(9).fill('4:r').join('|'),
  ];
  for (const score of invalidScores) assert.equal(parseTabScore(score), null, score);
  assert.ok(parseTabScore(Array(8).fill(Array(16).fill('16:r').join(' ')).join('|')));
});
