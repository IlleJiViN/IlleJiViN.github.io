import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePosts, getSeriesNavigation, isHiddenProject } from '../app/blog/series.mjs';

const post = (id, date, order, project = 'cuuube') => ({ id, date, order, project });

test('manual order takes priority over publication date; gaps are allowed', () => {
  const posts = [post(1, '2026-01-01', 20), post(2, '2026-01-02', 10), post(3, '2026-01-03', 30)];
  assert.deepEqual([...posts].sort(comparePosts).map(p => p.id), [2, 1, 3]);
  assert.deepEqual(posts.map(p => p.id), [1, 2, 3]);
});

test('duplicate order falls back to date then issue id', () => {
  const posts = [post(3, '2026-01-02', 2), post(2, '2026-01-01', 2), post(1, '2026-01-01', 2)];
  assert.deepEqual(posts.sort(comparePosts).map(p => p.id), [1, 2, 3]);
});

test('legacy and invalid order follow numbered posts in chronological order', () => {
  const posts = [
    post(6, '2026-01-06', null), post(5, '2026-01-05', undefined),
    post(4, '2026-01-04', 0), post(3, '2026-01-03', -1),
    post(2, '2026-01-02', 1.5), post(1, '2026-01-01', Number.MAX_SAFE_INTEGER + 1),
    post(7, '2026-01-07', 10),
  ];
  assert.deepEqual(posts.sort(comparePosts).map(p => p.id), [7, 1, 2, 3, 4, 5, 6]);
});

test('navigation uses the complete same-project sequence', () => {
  const posts = [post(1, '2026-01-01', 2), post(2, '2026-01-02', 1), post(3, '2026-01-03', 3), post(4, '2026-01-04', 1, 'other')];
  const nav = getSeriesNavigation(posts, posts[0]);
  assert.equal(nav.previous.id, 2);
  assert.equal(nav.next.id, 3);
  assert.equal(nav.position, 2);
  assert.equal(nav.total, 3);
  assert.deepEqual(posts.map(p => p.id), [1, 2, 3, 4]);
});

test('first, last, single and missing posts have no invalid neighbor links', () => {
  const posts = [post(1, '2026-01-01', 1), post(2, '2026-01-02', 2)];
  assert.equal(getSeriesNavigation(posts, posts[0]).previous, null);
  assert.equal(getSeriesNavigation(posts, posts[1]).next, null);
  assert.deepEqual(getSeriesNavigation([posts[0]], posts[0]), { previous: null, next: null, position: 1, total: 1 });
  assert.deepEqual(getSeriesNavigation(posts, post(99, '2026-01-01', 3)), { previous: null, next: null, position: 0, total: 2 });
});

test('removed projects stay excluded even when old issue labels use different case or whitespace', () => {
  for (const name of ['mission1', ' MISSION2 ', 'Portfolio', ' portfolio ']) {
    assert.equal(isHiddenProject(name), true);
    const hidden = post(1, '2026-01-01', 1, name);
    assert.deepEqual(getSeriesNavigation([hidden], hidden), { previous: null, next: null, position: 0, total: 0 });
  }
  assert.equal(isHiddenProject('mission'), false);
});
