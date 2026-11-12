const hiddenProjects = new Set(['mission1', 'mission2', 'portfolio']);

/** @param {string} name */
export function isHiddenProject(name) {
  return hiddenProjects.has(name.trim().toLowerCase());
}

/**
 * @typedef {{ id: number, date: string, project: string, order?: number | null }} SeriesPost
 */

/** @param {SeriesPost} post */
function hasOrder(post) {
  return typeof post.order === 'number' && Number.isSafeInteger(post.order) && post.order > 0;
}

/** @param {SeriesPost} a @param {SeriesPost} b */
export function comparePosts(a, b) {
  const orderedA = hasOrder(a);
  const orderedB = hasOrder(b);
  if (orderedA !== orderedB) return orderedA ? -1 : 1;
  if (orderedA && orderedB && a.order !== b.order) return /** @type {number} */ (a.order) - /** @type {number} */ (b.order);
  return a.date.localeCompare(b.date) || a.id - b.id;
}

/**
 * @template {SeriesPost} T
 * @param {readonly T[]} posts
 * @param {T} current
 * @returns {{previous: T | null, next: T | null, position: number, total: number}}
 */
export function getSeriesNavigation(posts, current) {
  const series = posts.filter(post => post.project === current.project && !isHiddenProject(post.project)).sort(comparePosts);
  const index = series.findIndex(post => post.id === current.id);
  return {
    previous: index > 0 ? series[index - 1] : null,
    next: index >= 0 && index + 1 < series.length ? series[index + 1] : null,
    position: index + 1,
    total: series.length,
  };
}
