import test from 'node:test';
import assert from 'node:assert/strict';
import { formatTabScore, parseTabScore, TAB_BEAT_MAX, TAB_MEASURE_MAX, TAB_TUPLET_MAX } from '../app/blog/tabScore.mjs';

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
    Array(TAB_BEAT_MAX + 1).fill('4:r').join(' '),
    Array(TAB_MEASURE_MAX + 1).fill('4:r').join('|'),
  ];
  for (const score of invalidScores) assert.equal(parseTabScore(score), null, score);
  assert.ok(parseTabScore(Array(TAB_MEASURE_MAX).fill(Array(TAB_BEAT_MAX).fill('16:r').join(' ')).join('|')));
});

test('triplets and sextuplets keep their own group and measure offsets around straight beats', () => {
  const source = '4:BD 3:2[8:HH+BD 8:r 8:HH+SD] 4:SD |\n6:4[16:RD 16:BD 16:HH 16:SD 16:r 16:FT]';
  const score = parseTabScore(source);
  assert.deepEqual(score.tuplets, [
    { measure: 0, start: 1, length: 3, count: 3, inTimeOf: 2 },
    { measure: 1, start: 0, length: 6, count: 6, inTimeOf: 4 },
  ]);
  assert.deepEqual(score.measures[0].slice(1, 4), [
    { duration: 8, notes: ['HH', 'BD'] },
    { duration: 8, notes: [] },
    { duration: 8, notes: ['HH', 'SD'] },
  ]);
  assert.equal(formatTabScore(score), source);
  assert.deepEqual(parseTabScore(formatTabScore(score)), score);
});

test('custom tuplets accept mixed note lengths and ratios above or below ordinary time', () => {
  // An eighth consumes two of the three sixteenth units, leaving one for the rest.
  const source = '3:2[8:BD 16:r] 2:3[8:RD 8:HH] 5:4[16:SD 16:SD 16:SD 16:SD 16:SD]';
  const score = parseTabScore(source);
  assert.deepEqual(score.tuplets, [
    { measure: 0, start: 0, length: 2, count: 3, inTimeOf: 2 },
    { measure: 0, start: 2, length: 2, count: 2, inTimeOf: 3 },
    { measure: 0, start: 4, length: 5, count: 5, inTimeOf: 4 },
  ]);
  assert.equal(formatTabScore(score), source);

  const maxGroup = `${TAB_TUPLET_MAX}:63[${Array(TAB_TUPLET_MAX).fill('16:CR+HH+RD+HT+MT+SD+FT+BD').join(' ')}]`;
  const fullBar = `${maxGroup} ${maxGroup}`;
  const fullScore = Array(TAB_MEASURE_MAX).fill(fullBar).join(' |\n');
  assert.equal(formatTabScore(parseTabScore(fullScore)), fullScore);
});

test('invalid, incomplete or nested tuplets do not publish', () => {
  const invalidScores = [
    '3:2[]',
    '3:2[8:HH 8:HH]',
    '3:2[8:HH 16:SD 16:BD]',
    '3:2[8:HH 8:HH 8:HH',
    '3:2[8:HH 8:HH 8:HH]]',
    '3:2[8:HH | 8:HH 8:HH]',
    '3:2[8:HH 3:2[16:SD 16:SD 16:SD]]',
    '3:2[8:HH 8:HH 8:XX]',
    '3:2[8:HH 8:HH 8:HH+HH]',
    '3:3[8:HH 8:HH 8:HH]',
    '3:0[8:HH 8:HH 8:HH]',
    '3:65[8:HH 8:HH 8:HH]',
    '65:3[8:HH 8:HH 8:HH]',
    '1:2[8:HH]',
  ];
  for (const score of invalidScores) assert.equal(parseTabScore(score), null, score);
});
